import { cn, colourFor, initialsOf } from '@/lib/utils';
import type { PublicUser } from '@/types';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, string> = {
  xs: 'size-6 text-[9px]',
  sm: 'size-8 text-[11px]',
  md: 'size-10 text-xs',
  lg: 'size-14 text-base',
  xl: 'size-20 text-2xl',
};

interface AvatarProps {
  user: Pick<PublicUser, 'name' | 'username' | 'avatarUrl'>;
  size?: Size;
  className?: string;
}

/** Falls back to a flat initials block, so profiles never look broken. */
export function Avatar({ user, size = 'md', className }: AvatarProps) {
  const shared = cn('shrink-0 overflow-hidden border-2 border-edge', SIZES[size], className);

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        loading="lazy"
        className={cn(shared, 'object-cover')}
      />
    );
  }

  const colour = colourFor(user.username || user.name);

  return (
    <span
      aria-hidden="true"
      className={cn(
        shared,
        'flex items-center justify-center font-display tracking-tight',
        colour.bg,
        colour.ink,
      )}
    >
      {initialsOf(user.name)}
    </span>
  );
}
