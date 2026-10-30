import { useState } from 'react';
import Modal from './Modal';
import Avatar from './Avatar';
import { BellIcon, CheckIcon, LogoutIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { AVATAR_GRADIENTS, cn } from '../lib/utils';

export default function SettingsModal() {
  const { profile, updateProfile, signOut } = useAuth();
  const { setSettingsOpen, requestNotifications } = useChat();
  const [name, setName] = useState(profile.display_name);
  const [color, setColor] = useState(profile.avatar_color % AVATAR_GRADIENTS.length);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [perm, setPerm] = useState('Notification' in window ? Notification.permission : 'unsupported');

  const close = () => setSettingsOpen(false);

  async function save(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Name cannot be empty.');
    setBusy(true);
    setError('');
    try {
      await updateProfile({ display_name: name.trim(), avatar_color: color });
      close();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function enableNotifs() {
    setPerm(await requestNotifications());
  }

  return (
    <Modal title="Your profile" onClose={close}>
      <form onSubmit={save} className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={name || profile.display_name} color={color} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{profile.email}</p>
            <p className="text-xs text-slate-500">Choose how you appear to others.</p>
          </div>
        </div>

        <div>
          <label htmlFor="dn" className="label">
            Display name
          </label>
          <input id="dn" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </div>

        <div>
          <span className="label">Avatar colour</span>
          <div className="flex flex-wrap gap-2">
            {AVATAR_GRADIENTS.map((g, i) => (
              <button
                key={g}
                type="button"
                onClick={() => setColor(i)}
                aria-label={`Colour ${i + 1}`}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-white ring-offset-2 transition',
                  g,
                  color === i ? 'ring-2 ring-blue-600' : 'hover:scale-105'
                )}
              >
                {color === i && <CheckIcon className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <BellIcon className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">Desktop notifications</p>
              <p className="text-xs text-slate-500">
                {perm === 'granted'
                  ? 'Enabled – you’ll be alerted when the tab is in the background.'
                  : perm === 'denied'
                    ? 'Blocked in your browser settings.'
                    : perm === 'unsupported'
                      ? 'Not supported in this browser.'
                      : 'Get alerted about new messages.'}
              </p>
            </div>
          </div>
          {perm === 'default' && (
            <button type="button" onClick={enableNotifs} className="btn btn-outline px-3 py-1.5 text-xs">
              Enable
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={signOut} className="btn btn-outline">
            <LogoutIcon className="h-4 w-4" /> Sign out
          </button>
          <button className="btn btn-primary flex-1" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
