import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { byRecent, roomTitle } from '../lib/utils';

const ChatContext = createContext(null);

const ROOM_SELECT = `
  room:rooms (
    id, name, is_group, created_by, created_at,
    last_message_at, last_message_preview, last_message_sender_id,
    members:room_members (
      user_id, role, last_read_at,
      profile:profiles ( id, display_name, email, avatar_color )
    )
  )
`;

export function ChatProvider({ activeRoomId, children }) {
  const { user } = useAuth();
  const uid = user.id;
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [unread, setUnread] = useState({});
  const [online, setOnline] = useState(() => new Set());
  const [toasts, setToasts] = useState([]);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Refs so realtime callbacks always see fresh values
  const activeRef = useRef(activeRoomId);
  const roomsRef = useRef(rooms);
  useEffect(() => {
    activeRef.current = activeRoomId;
    if (activeRoomId) setUnread((u) => (u[activeRoomId] ? { ...u, [activeRoomId]: 0 } : u));
  }, [activeRoomId]);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  /* ---------------------------------------------------------------- load */
  const loadRooms = useCallback(async () => {
    const [roomsRes, unreadRes] = await Promise.all([
      supabase.from('room_members').select(ROOM_SELECT).eq('user_id', uid),
      supabase.rpc('get_unread_counts')
    ]);
    if (roomsRes.error) {
      console.error('Failed to load rooms', roomsRes.error);
      setLoaded(true);
      return;
    }
    const list = (roomsRes.data || []).map((r) => r.room).filter(Boolean);
    list.sort(byRecent);
    setRooms(list);

    const map = {};
    (unreadRes.data || []).forEach((c) => {
      map[c.room_id] = Number(c.unread);
    });
    if (activeRef.current) delete map[activeRef.current];
    setUnread(map);
    setLoaded(true);
  }, [uid]);

  /* -------------------------------------------------------------- toasts */
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const pushToast = useCallback(
    (toast) => {
      const id = crypto.randomUUID();
      setToasts((t) => [...t.slice(-3), { id, ...toast }]);
      setTimeout(() => dismissToast(id), 6000);
    },
    [dismissToast]
  );

  const notify = useCallback(
    (room, msg) => {
      const sender = room.members?.find((m) => m.user_id === msg.sender_id)?.profile;
      const title = roomTitle(room, uid);
      const text = msg.content || (msg.attachment_name ? `📎 ${msg.attachment_name}` : 'New message');
      const body = room.is_group ? `${sender?.display_name || 'Someone'}: ${text}` : text;

      if (document.visibilityState === 'visible') {
        pushToast({ roomId: room.id, title, body, sender });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        const n = new Notification(title, { body, tag: room.id });
        n.onclick = () => {
          window.focus();
          navigate(`/app/${room.id}`);
          n.close();
        };
      }
    },
    [uid, pushToast, navigate]
  );

  // notify() depends on router navigation (whose identity changes per route),
  // so it is read through a ref to avoid re-subscribing the realtime channel.
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  /* ------------------------------------------------------------ realtime */
  useEffect(() => {
    loadRooms();

    let timer;
    const reloadSoon = () => {
      clearTimeout(timer);
      timer = setTimeout(loadRooms, 300);
    };

    const handleIncoming = (m) => {
      const room = roomsRef.current.find((r) => r.id === m.room_id);
      if (!room) {
        reloadSoon(); // we were just added to a new room
        return;
      }
      const preview = m.content || (m.attachment_name ? `📎 ${m.attachment_name}` : '');
      setRooms((rs) =>
        rs
          .map((r) =>
            r.id === m.room_id
              ? { ...r, last_message_at: m.created_at, last_message_preview: preview, last_message_sender_id: m.sender_id }
              : r
          )
          .sort(byRecent)
      );
      if (m.sender_id !== uid) {
        const viewing = activeRef.current === m.room_id && document.visibilityState === 'visible';
        if (!viewing) {
          setUnread((u) => ({ ...u, [m.room_id]: (u[m.room_id] || 0) + 1 }));
          notifyRef.current(room, m);
        }
      }
    };

    const channel = supabase
      .channel(`global-${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => handleIncoming(p.new))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_members' }, reloadSoon)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'room_members' }, (p) => {
        const n = p.new;
        setRooms((rs) =>
          rs.map((r) =>
            r.id === n.room_id
              ? { ...r, members: r.members.map((m) => (m.user_id === n.user_id ? { ...m, last_read_at: n.last_read_at } : m)) }
              : r
          )
        );
      })
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [uid, loadRooms]);

  /* ------------------------------------------------------------ presence */
  useEffect(() => {
    const channel = supabase.channel('online-users', { config: { presence: { key: uid } } });
    channel
      .on('presence', { event: 'sync' }, () => setOnline(new Set(Object.keys(channel.presenceState()))))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() });
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid]);

  /* ------------------------------------------------------------- actions */
  const markRead = useCallback(
    async (roomId) => {
      setUnread((u) => (u[roomId] ? { ...u, [roomId]: 0 } : u));
      const { error } = await supabase.rpc('mark_room_read', { rid: roomId });
      if (error) return;
      const now = new Date().toISOString();
      setRooms((rs) =>
        rs.map((r) =>
          r.id === roomId
            ? { ...r, members: r.members.map((m) => (m.user_id === uid ? { ...m, last_read_at: now } : m)) }
            : r
        )
      );
    },
    [uid]
  );

  const openDirect = useCallback(
    async (otherId) => {
      const { data, error } = await supabase.rpc('start_direct_chat', { other: otherId });
      if (error) throw error;
      await loadRooms();
      navigate(`/app/${data}`);
    },
    [loadRooms, navigate]
  );

  const createGroup = useCallback(
    async (name, memberIds) => {
      const { data, error } = await supabase.rpc('create_group', { group_name: name, member_ids: memberIds });
      if (error) throw error;
      await loadRooms();
      navigate(`/app/${data}`);
    },
    [loadRooms, navigate]
  );

  const addMembers = useCallback(
    async (roomId, memberIds) => {
      const { error } = await supabase.rpc('add_room_members', { rid: roomId, member_ids: memberIds });
      if (error) throw error;
      await loadRooms();
    },
    [loadRooms]
  );

  const leaveRoom = useCallback(
    async (roomId) => {
      const { error } = await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', uid);
      if (error) throw error;
      setRooms((rs) => rs.filter((r) => r.id !== roomId));
      navigate('/app');
    },
    [uid, navigate]
  );

  const requestNotifications = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.requestPermission();
  }, []);

  const value = useMemo(
    () => ({
      rooms,
      loaded,
      unread,
      online,
      toasts,
      dismissToast,
      newChatOpen,
      setNewChatOpen,
      settingsOpen,
      setSettingsOpen,
      loadRooms,
      markRead,
      openDirect,
      createGroup,
      addMembers,
      leaveRoom,
      requestNotifications
    }),
    [
      rooms,
      loaded,
      unread,
      online,
      toasts,
      dismissToast,
      newChatOpen,
      settingsOpen,
      loadRooms,
      markRead,
      openDirect,
      createGroup,
      addMembers,
      leaveRoom,
      requestNotifications
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
  return ctx;
}
