import { cn } from '../lib/utils';

export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#2563eb" />
      <path
        d="M20 10c-5.5 0-10 3.9-10 8.8 0 2.4 1.1 4.6 2.9 6.2-.2 1.6-.9 3-1.9 4 2.1-.1 4-.8 5.4-1.9 1.1.3 2.4.5 3.6.5 5.5 0 10-3.9 10-8.8S25.5 10 20 10z"
        fill="#fff"
      />
      <circle cx="15.500" cy="18.800" r="1.400" fill="#2563eb" />
      <circle cx="20" cy="18.800" r="1.400" fill="#2563eb" />
      <circle cx="24.500" cy="18.800" r="1.400" fill="#2563eb" />
    </svg>
  );
}

export default function Logo({ className, light = false, size = 'h-9 w-9' }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={size} />
      <span className={cn('font-display text-xl font-medium tracking-tight', light ? 'text-white' : 'text-slate-900')}>
        Glow<span className={light ? 'text-blue-200' : 'text-blue-600'}>chat</span>
      </span>
    </span>
  );
}
