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
  /**
   * `app` — the default — is the superellipse with no border: the shape an icon
   * has on a phone home screen. It reads as *the product itself* rather than as
   * a picture of the product in a frame. The border comes off with it
   * deliberately: a stroke around a squircle turns it back into a framed thing
   * and undoes the point.
   *
   * `block` is the old bordered square, kept for the handful of places a logo
   * sits inside another bordered block and has to belong to it — the launch
   * form's preview card, where the mark is one item in a list of fields.
   */
  shape?: 'block' | 'app';
  className?: string;
}

/**
 * A launch's mark.
 *
 * Items without a logo get a flat colour monogram keyed to their slug, so a
 * fresh launch with no assets still looks deliberate.
 */
export function ItemLogo({ item, size = 'md', shape = 'app', className }: ItemLogoProps) {
  const app = shape === 'app';

  const shared = cn(
    'shrink-0',
    app ? 'squircle' : 'border border-edge',
    SIZES[size],
    className,
  );

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
