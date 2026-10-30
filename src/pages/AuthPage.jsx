import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { AlertIcon, ArrowRightIcon, CheckIcon, LockIcon, BoltIcon, UsersIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

function friendlyError(e) {
  const msg = (e?.message || '').toLowerCase();
  if (msg.includes('invalid login')) return 'Incorrect email or password.';
  if (msg.includes('already registered')) return 'An account with this email already exists. Try signing in.';
  if (msg.includes('password should be')) return 'Password must be at least 6 characters.';
  if (msg.includes('email not confirmed')) return 'Please confirm your email first — check your inbox.';
  if (msg.includes('rate limit')) return 'Too many attempts. Please wait a minute and try again.';
  if (msg.includes('provider is not enabled')) return 'Google sign-in is not enabled in this Supabase project yet.';
  return e?.message || 'Something went wrong. Please try again.';
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.9a5.04 5.04 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.07z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.75c-.98.66-2.24 1.06-3.74 1.06-2.87 0-5.3-1.94-6.17-4.55H2.17v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.83 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.17a11 11 0 0 0 0 9.88z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.46 2.09 14.97 1 12 1A11 11 0 0 0 2.17 7.06l3.66 2.84C6.7 7.32 9.13 5.38 12 5.38z" />
    </svg>
  );
}

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (isLogin) {
        await signIn(email.trim(), password);
        navigate('/app', { replace: true });
      } else {
        if (!name.trim()) throw new Error('Please enter your name.');
        const { needsConfirmation } = await signUp(name.trim(), email.trim(), password);
        if (needsConfirmation) {
          setNotice('Account created! Check your email to confirm your address, then sign in.');
        } else {
          navigate('/app', { replace: true });
        }
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div className="flex min-h-full bg-white">
      {/* form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <Link to="/" aria-label="Home">
            <Logo size="h-11 w-11" />
          </Link>

          <h1 className="mt-16 font-display text-lg font-medium text-slate-900">
            {isLogin ? 'Sign in to your account' : 'Get started for free'}
          </h1>
          <p className="mt-2 text-sm text-slate-700">
            {isLogin ? (
              <>
                Don’t have an account?{' '}
                <Link to="/register" className="font-medium text-blue-600 hover:underline">
                  Sign up
                </Link>{' '}
                for free.
              </>
            ) : (
              <>
                Already registered?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:underline">
                  Sign in
                </Link>{' '}
                to your account.
              </>
            )}
          </p>

          <form onSubmit={onSubmit} className="mt-10 space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="label">
                  Full name
                </label>
                <input
                  id="name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  maxLength={60}
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
              {!isLogin && <p className="mt-2 text-xs text-slate-500">At least 6 characters.</p>}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            {notice && (
              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary w-full py-2.5">
              {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
              {!busy && <ArrowRightIcon className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-4 text-xs uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button type="button" onClick={onGoogle} className="btn btn-outline mt-6 w-full py-2.5">
            <GoogleG /> Continue with Google
          </button>
        </div>
      </div>

      {/* gradient panel */}
      <div className="relative hidden flex-1 overflow-hidden bg-blue-600 lg:block">
        <div className="absolute -left-32 -top-32 h-[42rem] w-[42rem] rounded-full bg-blue-700 blur-3xl" />
        <div className="absolute -right-24 top-1/4 h-[36rem] w-[36rem] rounded-full bg-sky-300 opacity-80 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/4 h-[34rem] w-[34rem] rounded-full bg-violet-500 opacity-70 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-0 h-[24rem] w-[24rem] rounded-full bg-cyan-300 opacity-60 blur-3xl" />

        <div className="relative flex h-full items-end p-12 xl:p-16">
          <div className="w-full max-w-lg rounded-3xl bg-white/15 p-8 text-white shadow-xl ring-1 ring-white/30 backdrop-blur-xl">
            <h2 className="font-display text-2xl">Conversations, without the clutter.</h2>
            <ul className="mt-6 space-y-4 text-sm">
              {[
                [BoltIcon, 'Instant delivery on every device'],
                [UsersIcon, 'Direct chats and group rooms'],
                [LockIcon, 'Private by default, secured by Postgres RLS']
              ].map(([Icon, text]) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
