import { useState } from 'react';
import Avatar from './Avatar';
import Modal from './Modal';
import UserPicker from './UserPicker';
import { LogoutIcon, PlusIcon, XIcon, CheckIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { cn, otherMember, roomTitle } from '../lib/utils';

function AddMembersModal({ room, onClose }) {
  const { addMembers } = useChat();
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggle = (u) => setPicked((p) => (p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id]));

  async function submit() {
    setBusy(true);
    setError('');
    try {
      await addMembers(room.id, picked);
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Add members" onClose={onClose}>
      <UserPicker multi selected={picked} exclude={room.members.map((m) => m.user_id)} onPick={toggle} />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary mt-4 w-full py-2.5" disabled={!picked.length || busy} onClick={submit}>
        {busy ? 'Adding…' : `Add ${picked.length || ''} ${picked.length === 1 ? 'person' : 'people'}`}
      </button>
    </Modal>
  );
}

export default function InfoPanel({ room, onClose }) {
  const { user } = useAuth();
  const { online, leaveRoom } = useChat();
  const [adding, setAdding] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const me = room.members.find((m) => m.user_id === user.id);
  const isAdmin = me?.role === 'admin';
  const other = !room.is_group ? otherMember(room, user.id) : null;
  const title = roomTitle(room, user.id);

  async function leave() {
    if (!window.confirm(`Leave "${room.name}"? You will stop receiving its messages.`)) return;
    setLeaving(true);
    try {
      await leaveRoom(room.id);
    } catch (e) {
      alert(e.message);
      setLeaving(false);
    }
  }

  const members = [...room.members].sort((a, b) => {
    const ao = online.has(a.user_id) ? 0 : 1;
    const bo = online.has(b.user_id) ? 0 : 1;
    return ao - bo || (a.profile?.display_name || '').localeCompare(b.profile?.display_name || '');
  });

  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-full animate-slide-left flex-col border-l border-slate-200 bg-white shadow-2xl sm:w-80 xl:static xl:shadow-none">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="font-display text-slate-900">{room.is_group ? 'Group info' : 'Contact info'}</h3>
        <button className="icon-btn -mr-2" onClick={onClose} aria-label="Close panel">
          <XIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 scroll-thin">
        <div className="flex flex-col items-center text-center">
          <Avatar
            name={title}
            color={other ? other.profile?.avatar_color : undefined}
            seed={room.id}
            size="xl"
            online={other ? online.has(other.user_id) : undefined}
          />
          <h4 className="mt-4 font-display text-xl text-slate-900">{title}</h4>
          {other && <p className="text-sm text-slate-500">{other.profile?.email}</p>}
          {room.is_group && (
            <p className="text-sm text-slate-500">
              {room.members.length} members · Created{' '}
              {new Date(room.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>

        {room.is_group && (
          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between">
              <h5 className="text-sm font-semibold text-slate-900">Members</h5>
              {isAdmin && (
                <button onClick={() => setAdding(true)} className="btn btn-ghost px-2.5 py-1 text-xs text-blue-600">
                  <PlusIcon className="h-3.5 w-3.5" /> Add
                </button>
              )}
            </div>
            <ul className="space-y-1">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                  <Avatar
                    name={m.profile?.display_name}
                    color={m.profile?.avatar_color}
                    size="sm"
                    online={online.has(m.user_id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {m.profile?.display_name}
                      {m.user_id === user.id && <span className="text-slate-400"> (you)</span>}
                    </p>
                    <p className={cn('text-xs', online.has(m.user_id) ? 'text-emerald-600' : 'text-slate-400')}>
                      {online.has(m.user_id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  {m.role === 'admin' && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      <CheckIcon className="h-3 w-3" /> Admin
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <button onClick={leave} disabled={leaving} className="btn mt-6 w-full bg-red-50 text-red-600 hover:bg-red-100">
              <LogoutIcon className="h-4 w-4" /> {leaving ? 'Leaving…' : 'Leave group'}
            </button>
          </div>
        )}
      </div>

      {adding && <AddMembersModal room={room} onClose={() => setAdding(false)} />}
    </aside>
  );
}
