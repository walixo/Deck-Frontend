import { cn } from '@/lib/utils';

type Pattern = 'grid' | 'halftone' | 'stripes';

interface BackdropProps {
  pattern?: Pattern;
  className?: string;
}

/*
 * Decorative background: a flat pattern, and nothing else.
 *
 * This used to scatter five rotated colour blocks behind the content as well.
 * They were removed rather than hidden. On a site whose pages are mostly other
 * people's logos, a scattering of saturated squares is one more thing competing
 * with the products for attention — and unlike the products, it says nothing.
 *
 * The pattern stays because it is texture rather than colour: `--edge` at 7%,
 * so it reads as paper stock behind the page and never as a coloured shape.
 */
export function Backdrop({ pattern = 'grid', className }: BackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div
        className={cn(
          'absolute inset-0 text-edge opacity-[0.07]',
          pattern === 'grid' && 'bg-gridlines',
          pattern === 'halftone' && 'bg-halftone',
          pattern === 'stripes' && 'bg-stripes',
        )}
      />
    </div>
  );
}

/** Thin banded strip for the top of a page header. */
export function PageBanner({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 overflow-hidden',
        className,
      )}
    >
      <div className="absolute inset-0 bg-halftone text-edge opacity-[0.09]" />
      {/* A hairline rule with no border of its own, so it takes the themed
          mark — a 6px lime bar on the bone canvas is 1.15:1 and reads as
          nothing at all. */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-accent" />
    </div>
  );
}
