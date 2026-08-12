import { cn, colourFor } from '@/lib/utils';
import type { Item } from '@/types';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, string> = {
  sm: 'size-9 text-[11px]',
  md: 'size-12 text-sm',
  lg: 'size-16 text-lg',
  xl: 'size-20 text-2xl',
};

interface ItemLogoProps {
  item: Pick<Item, 'name' | 'slug' | 'logoUrl'>;
  size?: Size;
  className?: string;
}

/**
 * Items without a logo get a flat colour monogram keyed to their slug, so a
 * fresh launch with no assets still looks deliberate.
 */
export function ItemLogo({ item, size = 'md', className }: ItemLogoProps) {
  const shared = cn('shrink-0 border-2 border-edge', SIZES[size], className);

  if (item.logoUrl) {
    return <img src={item.logoUrl} alt="" loading="lazy" className={cn(shared, 'object-cover')} />;
  }

  const colour = colourFor(item.slug || item.name);

  return (
    <span
      aria-hidden="true"
      className={cn(
        shared,
        'flex items-center justify-center font-display uppercase tracking-tight',
        colour.bg,
        colour.ink,
      )}
    >
      {item.name.slice(0, 2)}
    </span>
  );
}
