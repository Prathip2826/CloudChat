import { AVATAR_GRADIENTS, cn, hashToIndex, initials } from '../lib/utils';

const SIZES = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl'
};

const DOT = {
  xs: 'h-2 w-2',
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
  xl: 'h-5 w-5'
};

/**
 * name: text to take initials from
 * color: integer index (profile.avatar_color) – or pass `seed` to hash a string (rooms)
 * online: true | false | undefined (undefined hides the dot)
 */
export default function Avatar({ name, color, seed, size = 'md', online, className }) {
  const idx = typeof color === 'number' ? color % AVATAR_GRADIENTS.length : hashToIndex(seed || name || '');
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'inline-flex select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white',
          AVATAR_GRADIENTS[idx],
          SIZES[size]
        )}
      >
        {initials(name)}
      </span>
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            DOT[size],
            online ? 'bg-emerald-500' : 'bg-slate-300'
          )}
        />
      )}
    </span>
  );
}
