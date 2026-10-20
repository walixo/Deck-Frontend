import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * An icon set in a small pane of glass.
 *
 * `tone` is the colour behind the glass — a badge tone, say. With a tone the
 * pane is tinted: colour underneath, a soft highlight caught in one corner,
 * frosted glass with a lit top edge over it, and the icon in ink on top (every
 * badge tone carries ink at 9:1, so it reads through the frost). Without one
 * it is clear glass — the same `glass-secondary` surface as the buttons — for
 * things that are not lit up yet.
 */
const SIZES = {
  sm: 'size-6 rounded-[8px]',
  md: 'size-11 rounded-[14px]',
  lg: 'size-14 rounded-[18px]',
} as const;

export function GlassIcon({
  tone,
  size = 'md',
  className,
  children,
}: {
  tone?: string;
  size?: keyof typeof SIZES;
  className?: string;
  children: ReactNode;
}) {
  if (!tone) {
    return (
      <span
        aria-hidden="true"
        className={cn('glass-secondary grid shrink-0 place-items-center', SIZES[size], className)}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative isolate grid shrink-0 place-items-center overflow-hidden shadow-[0_8px_18px_-8px_rgb(0_0_0/0.4)]',
        SIZES[size],
        className,
      )}
    >
      {/* The colour, and light caught in it. */}
      <span className={cn('absolute inset-0 -z-20', tone)} />
      <span className="absolute -left-1/4 -top-1/3 -z-10 size-3/4 rounded-full bg-white/70 blur-md" />
      {/* The glass over it. */}
      <span className="absolute inset-0 -z-10 rounded-[inherit] border border-white/60 bg-white/15 shadow-[inset_0_1px_0_rgb(255_255_255/0.9),inset_0_-1px_0_rgb(0_0_0/0.08)] backdrop-blur-[2px]" />
      <span className="text-ink drop-shadow-[0_1px_0_rgb(255_255_255/0.5)]">{children}</span>
    </span>
  );
}
