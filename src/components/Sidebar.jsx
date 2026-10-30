import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Avatar from './Avatar';
import { ComposeIcon, GearIcon, SearchIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { cn, formatListTime, otherMember, roomTitle } from '../lib/utils';

function RoomItem({ room, active, unread, online, myId, onClick }) {
  const other = !room.is_group ? otherMember(room, myId) : null;
  const title = roomTitle(room, myId);
  const mine = room.last_message_sender_id === myId;
  const preview = room.last_message_preview
    ? `${mine ? 'You: ' : room.is_group ? `${room.members.find((m) => m.user_id === room.last_message_sender_id)?.profile?.display_name?.split(' ')[0] || ''}: ` : ''}${room.last_message_preview}`
    : 'No messages yet';

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition',
        active ? 'bg-blue-50' : 'hover:bg-slate-50'
      )}
    >
      <Avatar
        name={title}
        color={other ? other.profile?.avatar_color : undefined}
        seed={room.id}
        online={other ? online.has(other.user_id) : undefined}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn('truncate text-sm', unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-900')}>
            {title}
          </span>
          <span className={cn('shrink-0 text-[11px]', unread ? 'font-semibold text-blue-600' : 'text-slate-400')}>
            {room.last_message_preview ? formatListTime(room.last_message_at) : ''}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className={cn('truncate text-[13px]', unread ? 'font-medium text-slate-800' : 'text-slate-500')}>
            {preview}
          </span>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3 px-3 py-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-3 w-3/4 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Sidebar({ activeRoomId, className }) {
  const { user, profile } = useAuth();
  const { rooms, loaded, unread, online, setNewChatOpen, setSettingsOpen } = useChat();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rooms;
    return rooms.filter((r) => roomTitle(r, user.id).toLowerCase().includes(term));
  }, [rooms, q, user.id]);

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  return (
    <aside className={cn('flex-col border-r border-slate-200 bg-white', className)}>
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <div className="flex items-center gap-2">
          <Logo size="h-8 w-8" />
          {totalUnread > 0 && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">{totalUnread}</span>
          )}
        </div>
        <button className="icon-btn bg-slate-100" onClick={() => setNewChatOpen(true)} title="New conversation">
          <ComposeIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-full bg-slate-100 py-2 pl-10 pr-4 text-sm placeholder-slate-400 outline-none ring-blue-600 transition focus:bg-white focus:ring-1"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 scroll-thin">
        {!loaded && <Skeleton />}
        {loaded && rooms.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="font-display text-slate-900">No conversations yet</p>
            <p className="mt-1 text-sm text-slate-500">Start a chat with someone to get going.</p>
            <button onClick={() => setNewChatOpen(true)} className="btn btn-primary mt-5">
              Start a chat
            </button>
          </div>
        )}
        {loaded && rooms.length > 0 && filtered.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-slate-400">No matches for “{q}”.</p>
        )}
        <div className="space-y-0.5">
          {filtered.map((r) => (
            <RoomItem
              key={r.id}
              room={r}
              myId={user.id}
              active={r.id === activeRoomId}
              unread={unread[r.id] || 0}
              online={online}
              onClick={() => navigate(`/app/${r.id}`)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 p-4">
        <Avatar name={profile.display_name} color={profile.avatar_color} size="sm" online />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{profile.display_name}</p>
          <p className="truncate text-xs text-slate-500">{profile.email}</p>
        </div>
        <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Profile & settings">
          <GearIcon className="h-[18px] w-[18px]" />
        </button>
      </div>
    </aside>
  );
}
