import { cn, gradientFor, initialsOf } from '@/lib/utils';
import type { PublicUser } from '@/types';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, string> = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
};

interface AvatarProps {
  user: Pick<PublicUser, 'name' | 'username' | 'avatarUrl'>;
  size?: Size;
  className?: string;
}

/** Falls back to a deterministic initials tile, so profiles never look broken. */
export function Avatar({ user, size = 'md', className }: AvatarProps) {
  const shared = cn(
    'shrink-0 overflow-hidden rounded-full ring-1 ring-black/5 dark:ring-white/10',
    SIZES[size],
    className,
  );

  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.name} loading="lazy" className={cn(shared, 'object-cover')} />;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        shared,
        'flex items-center justify-center bg-gradient-to-br font-semibold text-white',
        gradientFor(user.username || user.name),
      )}
    >
      {initialsOf(user.name)}
    </span>
  );
}
