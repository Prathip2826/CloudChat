import { useEffect } from 'react';
import { XIcon } from './Icons';
import { cn } from '../lib/utils';

export default function Modal({ title, onClose, children, className }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'flex max-h-[90dvh] w-full max-w-md animate-slide-up flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl',
          className
        )}
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-5">
          <h2 className="font-display text-lg text-slate-900">{title}</h2>
          <button type="button" className="icon-btn -mr-2" onClick={onClose} aria-label="Close">
            <XIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-2 scroll-thin">{children}</div>
      </div>
    </div>
  );
}
