export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-sky-600',
  'from-fuchsia-500 to-pink-600',
  'from-lime-500 to-green-600'
];

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0] || '';
  const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + second).toUpperCase();
}

export function hashToIndex(str = '', mod = AVATAR_GRADIENTS.length) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

export function formatTime(value) {
  const d = new Date(value);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function formatDayLabel(value) {
  const d = new Date(value);
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatListTime(value) {
  if (!value) return '';
  const d = new Date(value);
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diff === 0) return formatTime(d);
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function sanitizeFileName(name = 'file') {
  return name.replace(/[^\w.\-]+/g, '_').slice(-80) || 'file';
}

export const isImageType = (type) => Boolean(type && type.startsWith('image/'));

export const byCreated = (a, b) => new Date(a.created_at) - new Date(b.created_at);

export const byRecent = (a, b) => new Date(b.last_message_at) - new Date(a.last_message_at);

/** The "other" person in a 1:1 room. */
export function otherMember(room, myId) {
  return room.members?.find((m) => m.user_id !== myId) || null;
}

export function roomTitle(room, myId) {
  if (room.is_group) return room.name || 'Group';
  return otherMember(room, myId)?.profile?.display_name || 'Chat';
}
