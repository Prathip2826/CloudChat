import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext(null);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id;

  // The profile row is created by a DB trigger; retry briefly in case of lag.
  useEffect(() => {
    if (!uid) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 6; i++) {
        const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
        if (cancelled) return;
        if (data) {
          setProfile(data);
          return;
        }
        await sleep(500);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const signUp = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name }, emailRedirectTo: `${window.location.origin}/app` }
    });
    if (error) throw error;
    // No session => email confirmation is switched on in Supabase.
    return { needsConfirmation: !data.session };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` }
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(
    async (patch) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', uid)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      return data;
    },
    [uid]
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      updateProfile
    }),
    [session, profile, loading, signUp, signIn, signInWithGoogle, signOut, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
