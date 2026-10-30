import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FILES_BUCKET, supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Avatar from '../components/Avatar';
import MessageBubble from '../components/MessageBubble';
import Composer from '../components/Composer';
import InfoPanel from '../components/InfoPanel';
import { ArrowLeftIcon, ChevronUpIcon, InfoIcon } from '../components/Icons';
import { byCreated, cn, formatDayLabel, otherMember, roomTitle, sanitizeFileName } from '../lib/utils';

const PAGE = 40;

export default function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { rooms, loaded, online, markRead } = useChat();
  const room = rooms.find((r) => r.id === roomId);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typing, setTyping] = useState({}); // uid -> name
  const [showInfo, setShowInfo] = useState(false);

  const channelRef = useRef(null);
  const listRef = useRef(null);
  const stickRef = useRef(true);
  const typingTimers = useRef({});

  const profileOf = useMemo(() => {
    const map = {};
    room?.members.forEach((m) => (map[m.user_id] = m.profile));
    return (uid) => map[uid];
  }, [room]);

  /* --------------------------------------------------- message state ops */
  const upsert = useCallback((m) => {
    setMessages((prev) => {
      const i = prev.findIndex((x) => x.id === m.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...prev[i], ...m, pending: false, failed: false };
        return copy;
      }
      return [...prev, m].sort(byCreated);
    });
  }, []);

  const replaceTemp = useCallback((tmpId, real) => {
    setMessages((prev) => {
      const without = prev.filter((x) => x.id !== tmpId);
      if (without.some((x) => x.id === real.id)) return without;
      return [...without, real].sort(byCreated);
    });
  }, []);

  /* ------------------------------------------- load + realtime for room */
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setLoading(true);
    setHasMore(false);
    setTyping({});
    stickRef.current = true;

    (async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(PAGE);
      if (cancelled) return;
      if (!error) {
        setMessages(data.reverse());
        setHasMore(data.length === PAGE);
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel(`room-${roomId}`, { config: { broadcast: { self: false } } })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        ({ new: m }) => {
          upsert(m);
          if (m.sender_id !== user.id) {
            setTyping((t) => {
              if (!t[m.sender_id]) return t;
              const { [m.sender_id]: _removed, ...rest } = t;
              return rest;
            });
            if (document.visibilityState === 'visible') markRead(roomId);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        ({ new: m }) => upsert(m)
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload?.user_id || payload.user_id === user.id) return;
        setTyping((t) => ({ ...t, [payload.user_id]: payload.name }));
        clearTimeout(typingTimers.current[payload.user_id]);
        typingTimers.current[payload.user_id] = setTimeout(() => {
          setTyping((t) => {
            const { [payload.user_id]: _removed, ...rest } = t;
            return rest;
          });
        }, 3500);
      })
      .subscribe();
    channelRef.current = channel;

    markRead(roomId);

    return () => {
      cancelled = true;
      Object.values(typingTimers.current).forEach(clearTimeout);
      typingTimers.current = {};
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, user.id, upsert, markRead]);

  // Mark as read again when the tab regains focus
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && markRead(roomId);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [roomId, markRead]);

  /* ------------------------------------------------------------- scroll */
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, typing, loading]);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  async function loadOlder() {
    if (!messages.length || loadingMore) return;
    setLoadingMore(true);
    const el = listRef.current;
    const prevHeight = el.scrollHeight;
    const oldest = messages.find((m) => !m.pending)?.created_at;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .lt('created_at', oldest)
      .order('created_at', { ascending: false })
      .limit(PAGE);
    if (data) {
      stickRef.current = false;
      setMessages((prev) => [...data.reverse(), ...prev]);
      setHasMore(data.length === PAGE);
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevHeight;
      });
    }
    setLoadingMore(false);
  }

  /* ------------------------------------------------------------ actions */
  const sendTyping = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, name: profile.display_name.split(' ')[0] }
    });
  }, [user.id, profile.display_name]);

  const send = useCallback(
    async ({ text, file }, retryId) => {
      const tmpId = retryId || `tmp-${crypto.randomUUID()}`;
      const temp = {
        id: tmpId,
        room_id: roomId,
        sender_id: user.id,
        content: text,
        created_at: new Date().toISOString(),
        attachment_name: file?.name ?? null,
        attachment_type: file?.type ?? null,
        attachment_size: file?.size ?? null,
        localPreview: file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        pending: true,
        failed: false,
        _payload: { text, file }
      };
      stickRef.current = true;
      setMessages((prev) => [...prev.filter((x) => x.id !== tmpId), temp].sort(byCreated));

      try {
        let path = null;
        if (file) {
          path = `${roomId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
          const { error: upErr } = await supabase.storage
            .from(FILES_BUCKET)
            .upload(path, file, { contentType: file.type || 'application/octet-stream' });
          if (upErr) throw upErr;
        }
        const { data, error } = await supabase
          .from('messages')
          .insert({
            room_id: roomId,
            sender_id: user.id,
            content: text,
            attachment_path: path,
            attachment_name: file?.name ?? null,
            attachment_type: file?.type ?? null,
            attachment_size: file?.size ?? null
          })
          .select()
          .single();
        if (error) throw error;
        replaceTemp(tmpId, data);
      } catch (err) {
        console.error('Send failed', err);
        setMessages((prev) => prev.map((x) => (x.id === tmpId ? { ...x, pending: false, failed: true } : x)));
      }
    },
    [roomId, user.id, replaceTemp]
  );

  const retry = (m) => send(m._payload, m.id);
  const discard = (m) => setMessages((prev) => prev.filter((x) => x.id !== m.id));

  async function remove(m) {
    if (!window.confirm('Delete this message for everyone?')) return;
    const path = m.attachment_path;
    const { data, error } = await supabase
      .from('messages')
      .update({
        content: '',
        deleted_at: new Date().toISOString(),
        attachment_path: null,
        attachment_name: null,
        attachment_type: null,
        attachment_size: null
      })
      .eq('id', m.id)
      .select()
      .single();
    if (error) return alert(error.message);
    upsert(data);
    if (path) supabase.storage.from(FILES_BUCKET).remove([path]);
  }

  /* ------------------------------------------------------------- render */
  if (!loaded) return <div className="chat-bg flex-1" />;
  if (!room) {
    return (
      <div className="chat-bg flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="font-display text-xl text-slate-900">Conversation not found</p>
        <p className="text-sm text-slate-500">It may have been removed, or you’re no longer a member.</p>
        <button className="btn btn-primary" onClick={() => navigate('/app')}>
          Back to chats
        </button>
      </div>
    );
  }

  const title = roomTitle(room, user.id);
  const other = !room.is_group ? otherMember(room, user.id) : null;
  const others = room.members.filter((m) => m.user_id !== user.id);
  const onlineCount = room.members.filter((m) => online.has(m.user_id)).length;
  const typingNames = Object.values(typing);

  const statusOf = (m) => {
    if (m.failed) return 'failed';
    if (m.pending) return 'sending';
    const t = new Date(m.created_at).getTime();
    const seen = others.length > 0 && others.every((o) => new Date(o.last_read_at).getTime() >= t);
    return seen ? 'seen' : 'sent';
  };

  // build list items with day separators + grouping
  const items = [];
  let lastDay = '';
  messages.forEach((m, i) => {
    const d = new Date(m.created_at);
    const dayKey = d.toDateString();
    if (dayKey !== lastDay) {
      items.push({ type: 'day', key: `day-${dayKey}`, label: formatDayLabel(d) });
      lastDay = dayKey;
    }
    const prev = messages[i - 1];
    const sameBlock =
      prev &&
      prev.sender_id === m.sender_id &&
      new Date(prev.created_at).toDateString() === dayKey &&
      d - new Date(prev.created_at) < 5 * 60 * 1000;
    items.push({ type: 'msg', key: m.id, m, first: !sameBlock });
  });

  return (
    <div className="relative flex min-w-0 flex-1">
      <section className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-5">
          <button className="icon-btn md:hidden" onClick={() => navigate('/app')} aria-label="Back">
            <ArrowLeftIcon />
          </button>
          <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setShowInfo((s) => !s)}>
            <Avatar
              name={title}
              color={other ? other.profile?.avatar_color : undefined}
              seed={room.id}
              online={other ? online.has(other.user_id) : undefined}
            />
            <div className="min-w-0">
              <h2 className="truncate font-display text-base text-slate-900">{title}</h2>
              <p
                className={cn(
                  'truncate text-xs',
                  typingNames.length || (other && online.has(other.user_id)) ? 'text-emerald-600' : 'text-slate-500'
                )}
              >
                {typingNames.length
                  ? `${typingNames.join(', ')} ${typingNames.length > 1 ? 'are' : 'is'} typing…`
                  : room.is_group
                    ? `${room.members.length} members · ${onlineCount} online`
                    : online.has(other?.user_id)
                      ? 'Online'
                      : 'Offline'}
              </p>
            </div>
          </button>
          <button
            className={cn('icon-btn', showInfo && 'bg-blue-50 text-blue-600')}
            onClick={() => setShowInfo((s) => !s)}
            aria-label="Chat info"
          >
            <InfoIcon />
          </button>
        </header>

        {/* messages */}
        <div ref={listRef} onScroll={onScroll} className="chat-bg min-h-0 flex-1 overflow-y-auto px-3 py-4 scroll-thin sm:px-6">
          {hasMore && (
            <div className="mb-4 flex justify-center">
              <button onClick={loadOlder} disabled={loadingMore} className="btn btn-outline px-3 py-1.5 text-xs">
                <ChevronUpIcon className="h-3.5 w-3.5" /> {loadingMore ? 'Loading…' : 'Load earlier messages'}
              </button>
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className={cn('flex', i % 2 ? 'justify-end' : 'justify-start')}>
                  <div className="h-10 w-48 animate-pulse rounded-2xl bg-slate-200/70" />
                </div>
              ))}
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Avatar name={title} color={other ? other.profile?.avatar_color : undefined} seed={room.id} size="lg" />
              <p className="mt-4 font-display text-lg text-slate-900">Say hello to {title} 👋</p>
              <p className="mt-1 text-sm text-slate-500">This is the start of your conversation.</p>
            </div>
          )}

          <div className="space-y-1">
            {items.map((it) =>
              it.type === 'day' ? (
                <div key={it.key} className="flex justify-center py-3">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
                    {it.label}
                  </span>
                </div>
              ) : (
                <div key={it.key} className={it.first ? 'pt-2' : ''}>
                  <MessageBubble
                    m={it.m}
                    mine={it.m.sender_id === user.id}
                    sender={profileOf(it.m.sender_id)}
                    isGroup={room.is_group}
                    showName={room.is_group && it.first}
                    showAvatar={it.first}
                    status={statusOf(it.m)}
                    onDelete={remove}
                    onRetry={retry}
                    onDiscard={discard}
                  />
                </div>
              )
            )}
          </div>

          {typingNames.length > 0 && (
            <div className="mt-3 flex items-center gap-2 pl-1">
              <span className="flex gap-1 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
              </span>
            </div>
          )}
        </div>

        <Composer onSend={send} onTyping={sendTyping} />
      </section>

      {showInfo && <InfoPanel room={room} onClose={() => setShowInfo(false)} />}
    </div>
  );
}
