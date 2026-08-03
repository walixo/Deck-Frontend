import { cn, gradientFor } from '@/lib/utils';
import type { Item } from '@/types';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, string> = {
  sm: 'size-10 rounded-lg text-sm',
  md: 'size-14 rounded-xl text-lg',
  lg: 'size-16 rounded-2xl text-xl',
  xl: 'size-20 rounded-2xl text-2xl',
};

interface ItemLogoProps {
  item: Pick<Item, 'name' | 'slug' | 'logoUrl'>;
  size?: Size;
  className?: string;
}

/**
 * Items without a logo get a deterministic gradient monogram, so a fresh
 * launch with no assets still looks deliberate.
 */
export function ItemLogo({ item, size = 'md', className }: ItemLogoProps) {
  const shared = cn('shrink-0 ring-1 ring-black/5 dark:ring-white/10', SIZES[size], className);

  if (item.logoUrl) {
    return (
      <img
        src={item.logoUrl}
        alt=""
        loading="lazy"
        className={cn(shared, 'object-cover')}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        shared,
        'flex items-center justify-center bg-gradient-to-br font-semibold tracking-tight text-white',
        gradientFor(item.slug || item.name),
      )}
    >
      {item.name.slice(0, 2)}
    </span>
  );
}
