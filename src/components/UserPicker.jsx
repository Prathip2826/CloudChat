import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Avatar from './Avatar';
import { CheckIcon, SearchIcon } from './Icons';
import { cn } from '../lib/utils';

/**
 * Search registered users by name/email.
 * `selected` = array of ids that are ticked (multi mode); in single mode just call onPick.
 */
export default function UserPicker({ exclude = [], selected = [], onPick, multi = false }) {
  const { user } = useAuth();
  const { online } = useChat();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(true);
  const excludeKey = exclude.join(',');

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setBusy(true);
      let query = supabase
        .from('profiles')
        .select('id, display_name, email, avatar_color')
        .neq('id', user.id)
        .order('display_name')
        .limit(30);
      const term = q.trim().replace(/[%,()*]/g, '');
      if (term) query = query.or(`display_name.ilike.%${term}%,email.ilike.%${term}%`);
      const { data } = await query;
      if (cancelled) return;
      const skip = new Set(excludeKey ? excludeKey.split(',') : []);
      setResults((data || []).filter((u) => !skip.has(u.id)));
      setBusy(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, user.id, excludeKey]);

  return (
    <div>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          placeholder="Search by name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>

      <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto scroll-thin">
        {busy && results.length === 0 && <li className="px-2 py-6 text-center text-sm text-slate-400">Searching…</li>}
        {!busy && results.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-slate-400">
            No users found. Ask your friend to sign up first.
          </li>
        )}
        {results.map((u) => {
          const isSel = selected.includes(u.id);
          return (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => onPick(u)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50',
                  isSel && 'bg-blue-50 hover:bg-blue-50'
                )}
              >
                <Avatar name={u.display_name} color={u.avatar_color} size="sm" online={online.has(u.id)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">{u.display_name}</span>
                  <span className="block truncate text-xs text-slate-500">{u.email}</span>
                </span>
                {multi && (
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full ring-1',
                      isSel ? 'bg-blue-600 text-white ring-blue-600' : 'ring-slate-300'
                    )}
                  >
                    {isSel && <CheckIcon className="h-3 w-3" />}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
