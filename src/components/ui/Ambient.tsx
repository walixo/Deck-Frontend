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
          'absolute inset-0 text-edge opacity-[0.035]',
          pattern === 'grid' && 'bg-gridlines',
          pattern === 'halftone' && 'bg-halftone',
          pattern === 'stripes' && 'bg-stripes',
        )}
      />
    </div>
  );
}

/** Warm light at the top of a page — the arcade's amber, kept faint. */
export function PageBanner({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden',
        className,
      )}
    >
      <div className="absolute -top-40 left-1/2 h-80 w-[min(1100px,140%)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(247_165_49/0.16),transparent)] blur-2xl dark:bg-[radial-gradient(closest-side,rgb(255_106_61/0.12),transparent)]" />
    </div>
  );
}
