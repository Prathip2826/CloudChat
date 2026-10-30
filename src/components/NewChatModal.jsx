import { useState } from 'react';
import Modal from './Modal';
import UserPicker from './UserPicker';
import Avatar from './Avatar';
import { XIcon } from './Icons';
import { useChat } from '../context/ChatContext';
import { cn } from '../lib/utils';

export default function NewChatModal() {
  const { setNewChatOpen, openDirect, createGroup } = useChat();
  const [tab, setTab] = useState('direct');
  const [groupName, setGroupName] = useState('');
  const [picked, setPicked] = useState([]); // [{id, display_name, avatar_color}]
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => setNewChatOpen(false);

  async function startDirect(u) {
    setBusy(true);
    setError('');
    try {
      await openDirect(u.id);
      close();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  function toggle(u) {
    setPicked((p) => (p.some((x) => x.id === u.id) ? p.filter((x) => x.id !== u.id) : [...p, u]));
  }

  async function submitGroup(e) {
    e.preventDefault();
    if (!groupName.trim()) return setError('Give your group a name.');
    if (!picked.length) return setError('Add at least one person.');
    setBusy(true);
    setError('');
    try {
      await createGroup(groupName.trim(), picked.map((p) => p.id));
      close();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="New conversation" onClose={close}>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1 text-sm font-medium">
        {[
          ['direct', 'Direct message'],
          ['group', 'New group']
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setError('');
            }}
            className={cn(
              'rounded-full py-1.5 transition',
              tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'direct' ? (
        <div className={cn(busy && 'pointer-events-none opacity-60')}>
          <UserPicker onPick={startDirect} />
        </div>
      ) : (
        <form onSubmit={submitGroup} className="space-y-4">
          <div>
            <label className="label" htmlFor="gname">
              Group name
            </label>
            <input
              id="gname"
              className="input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={80}
              placeholder="e.g. Project Alpha"
            />
          </div>

          {picked.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {picked.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 py-1 pl-1 pr-2 text-xs font-medium text-blue-700"
                >
                  <Avatar name={p.display_name} color={p.avatar_color} size="xs" />
                  {p.display_name}
                  <button type="button" onClick={() => toggle(p)} aria-label={`Remove ${p.display_name}`}>
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <UserPicker multi selected={picked.map((p) => p.id)} onPick={toggle} />

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn btn-primary w-full py-2.5" disabled={busy}>
            {busy ? 'Creating…' : `Create group${picked.length ? ` (${picked.length + 1})` : ''}`}
          </button>
        </form>
      )}

      {tab === 'direct' && error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Modal>
  );
}
