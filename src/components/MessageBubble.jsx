import Avatar from './Avatar';
import { AlertIcon, CheckIcon, DoubleCheckIcon, FileIcon, TrashIcon } from './Icons';
import { useSignedUrl } from '../hooks/useSignedUrl';
import { cn, formatBytes, formatTime, isImageType } from '../lib/utils';

function Attachment({ m, mine }) {
  const url = useSignedUrl(m.attachment_path);
  const src = url || m.localPreview;

  if (isImageType(m.attachment_type)) {
    return (
      <a
        href={url || undefined}
        target="_blank"
        rel="noreferrer"
        className={cn('mb-1 block overflow-hidden rounded-xl', !url && 'pointer-events-none')}
      >
        {src ? (
          <img
            src={src}
            alt={m.attachment_name}
            className={cn('max-h-72 w-full max-w-[18rem] object-cover', m.pending && 'opacity-60')}
          />
        ) : (
          <div className="h-40 w-56 animate-pulse rounded-xl bg-slate-200/70" />
        )}
      </a>
    );
  }

  return (
    <a
      href={url || undefined}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'mb-1 flex items-center gap-3 rounded-xl p-2.5 transition',
        mine ? 'bg-white/15 hover:bg-white/25' : 'bg-white ring-1 ring-slate-200 hover:bg-slate-50'
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          mine ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
        )}
      >
        <FileIcon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block max-w-[12rem] truncate text-sm font-medium">{m.attachment_name}</span>
        <span className={cn('block text-xs', mine ? 'text-blue-100' : 'text-slate-500')}>
          {formatBytes(m.attachment_size)}
        </span>
      </span>
    </a>
  );
}

function Status({ status }) {
  if (status === 'sending') return <span className="ml-1 text-[10px] opacity-80">sending…</span>;
  if (status === 'seen') return <DoubleCheckIcon className="ml-1 h-3.5 w-3.5 text-sky-200" />;
  if (status === 'sent') return <CheckIcon className="ml-1 h-3.5 w-3.5 opacity-80" />;
  return null;
}

export default function MessageBubble({
  m,
  mine,
  sender,
  showName,
  showAvatar,
  isGroup,
  status,
  onDelete,
  onRetry,
  onDiscard
}) {
  const deleted = Boolean(m.deleted_at);
  const hasAttachment = Boolean(m.attachment_name) && !deleted;

  return (
    <div className={cn('group flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
      {!mine && isGroup && (
        <div className="w-7 shrink-0">
          {showAvatar && <Avatar name={sender?.display_name} color={sender?.avatar_color} size="xs" />}
        </div>
      )}

      {mine && !deleted && !m.pending && !m.failed && (
        <button
          onClick={() => onDelete(m)}
          title="Delete message"
          className="mb-1 hidden h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-red-600 group-hover:flex"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}

      <div
        className={cn(
          'relative max-w-[82%] px-3.5 py-2 text-[15px] shadow-sm sm:max-w-[70%]',
          mine ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 ring-1 ring-slate-200/70',
          'rounded-2xl',
          mine ? 'rounded-br-md' : 'rounded-bl-md',
          m.failed && 'bg-red-50 text-red-900 ring-1 ring-red-200'
        )}
      >
        {showName && !mine && (
          <p className="mb-0.5 text-xs font-semibold text-blue-600">{sender?.display_name || 'Unknown'}</p>
        )}

        {deleted ? (
          <p className={cn('flex items-center gap-1.5 italic', mine ? 'text-blue-100' : 'text-slate-400')}>
            <TrashIcon className="h-3.5 w-3.5" /> This message was deleted
          </p>
        ) : (
          <>
            {hasAttachment && <Attachment m={m} mine={mine} />}
            {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
          </>
        )}

        <div
          className={cn(
            'mt-0.5 flex items-center justify-end text-[10.5px]',
            mine && !m.failed ? 'text-blue-100' : 'text-slate-400'
          )}
        >
          {formatTime(m.created_at)}
          {mine && !deleted && !m.failed && <Status status={status} />}
        </div>

        {m.failed && (
          <div className="mt-1 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-medium text-red-600">
              <AlertIcon className="h-3.5 w-3.5" /> Not sent
            </span>
            <button onClick={() => onRetry(m)} className="font-semibold text-blue-600 hover:underline">
              Retry
            </button>
            <button onClick={() => onDiscard(m)} className="text-slate-500 hover:underline">
              Discard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
