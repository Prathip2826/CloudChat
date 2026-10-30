import { useEffect, useRef, useState } from 'react';
import { PaperclipIcon, SendIcon, SmileIcon, XIcon, FileIcon } from './Icons';
import { MAX_FILE_BYTES } from '../lib/supabase';
import { formatBytes, isImageType } from '../lib/utils';

const EMOJIS = [
  '😀','😁','😂','🤣','😊','😍','😘','😎','🤩','🥳','😉','🙂',
  '🤔','😅','😢','😭','😡','😴','🤗','🙄','😇','🥺','😬','🤯',
  '👍','👎','👏','🙌','🙏','💪','👋','🤝','✌️','👌','🔥','✨',
  '❤️','💙','💜','💔','🎉','🎂','🚀','💡','✅','❌','⭐','💯'
];

export default function Composer({ onSend, onTyping, disabled }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef(null);
  const areaRef = useRef(null);
  const lastTyping = useRef(0);

  // Auto-grow textarea
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

  useEffect(() => {
    if (file && isImageType(file.type)) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  function pick(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size >= MAX_FILE_BYTES) return setError('File must be smaller than 10 MB.');
    setError('');
    setFile(f);
  }

  function submit(e) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (disabled || (!trimmed && !file)) return;
    onSend({ text: trimmed, file });
    setText('');
    setFile(null);
    setShowEmoji(false);
    areaRef.current?.focus();
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  function onChange(e) {
    setText(e.target.value);
    const now = Date.now();
    if (now - lastTyping.current > 2000) {
      lastTyping.current = now;
      onTyping?.();
    }
  }

  function onPaste(e) {
    const f = [...(e.clipboardData?.files || [])][0];
    if (f) {
      e.preventDefault();
      if (f.size >= MAX_FILE_BYTES) return setError('File must be smaller than 10 MB.');
      setError('');
      setFile(f);
    }
  }

  const canSend = (text.trim() || file) && !disabled;

  return (
    <form onSubmit={submit} className="relative border-t border-slate-200 bg-white px-3 pb-3 pt-2 sm:px-5 sm:pb-4">
      {showEmoji && (
        <div className="absolute bottom-full left-3 z-10 mb-2 w-72 animate-pop rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200 sm:left-5">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                className="rounded-lg p-1 text-xl transition hover:bg-slate-100"
                onClick={() => {
                  setText((t) => t + em);
                  areaRef.current?.focus();
                }}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {file && (
        <div className="mb-2 inline-flex items-center gap-3 rounded-2xl bg-slate-100 p-2 pr-3">
          {preview ? (
            <img src={preview} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <FileIcon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <p className="max-w-[12rem] truncate text-sm font-medium text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
          </div>
          <button type="button" className="icon-btn h-7 w-7" onClick={() => setFile(null)} aria-label="Remove file">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="flex items-end gap-1.5 sm:gap-2">
        <input ref={fileRef} type="file" hidden onChange={pick} />
        <button type="button" className="icon-btn h-10 w-10" onClick={() => fileRef.current?.click()} title="Attach file">
          <PaperclipIcon />
        </button>
        <button
          type="button"
          className="icon-btn h-10 w-10"
          onClick={() => setShowEmoji((s) => !s)}
          title="Emoji"
        >
          <SmileIcon />
        </button>
        <textarea
          ref={areaRef}
          rows={1}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          maxLength={4000}
          placeholder="Type a message"
          className="max-h-36 min-h-10 flex-1 resize-none rounded-3xl bg-slate-100 px-4 py-2.5 text-[15px] outline-none ring-blue-600 transition placeholder:text-slate-400 focus:bg-white focus:ring-1"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-500 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400"
          aria-label="Send"
        >
          <SendIcon className="h-[18px] w-[18px]" />
        </button>
      </div>
    </form>
  );
}
