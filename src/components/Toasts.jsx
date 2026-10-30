import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import { XIcon } from './Icons';
import { useChat } from '../context/ChatContext';

export default function Toasts() {
  const { toasts, dismissToast } = useChat();
  const navigate = useNavigate();
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex animate-slide-left cursor-pointer items-start gap-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200"
          onClick={() => {
            navigate(`/app/${t.roomId}`);
            dismissToast(t.id);
          }}
        >
          <Avatar name={t.sender?.display_name || t.title} color={t.sender?.avatar_color} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{t.title}</p>
            <p className="line-clamp-2 text-sm text-slate-600">{t.body}</p>
          </div>
          <button
            className="icon-btn -mr-1 -mt-1 h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(t.id);
            }}
            aria-label="Dismiss"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
