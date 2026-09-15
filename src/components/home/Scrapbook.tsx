import { cn } from '@/lib/utils';

/**
 * Stationery: the two pieces both scrapbook sections are pinned together with.
 *
 * They live here rather than in `components/ui` because they are not controls
 * and never will be — nothing about a strip of tape is reusable in a form. What
 * they are is a shared vocabulary for two sections that have to look like the
 * same hand made them, and the fastest way to lose that is to let each one
 * invent its own tape.
 *
 * Angles are inline styles, not classes. `rotate-[${n}deg]` assembled at
 * runtime compiles to nothing at all — Tailwind scans source text, so a class
 * that only exists once the component runs was never in the stylesheet.
 */

/**
 * A strip of tape holding something to the page.
 *
 * Positioned by the caller, because where a piece of tape goes is a property of
 * the thing being taped, not of the tape. No shadow: tape is flush with what it
 * is stuck to, and a floating strip reads as a sticker instead.
 */
export function Tape({ angle = -18, className }: { angle?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute block h-8 w-5 border border-edge bg-surface',
        className,
      )}
      style={{ transform: `rotate(${angle}deg)` }}
    />
  );
}

/**
 * A sticker label, hanging off an edge.
 *
 * The one fully-rounded shape on the site. Everything else takes the 6px slab,
 * and it stays that way — this is a label peeled off a sheet and stuck on at an
 * angle, and a slab-cornered one reads as another UI chip, which is the exact
 * thing it is not.
 */
export function Pill({
  children,
  angle = -4,
  className,
}: {
  children: React.ReactNode;
  angle?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'pointer-events-none inline-flex items-center whitespace-nowrap rounded-full',
        'border border-edge bg-pop px-3.5 py-1.5 text-on-pop',
        'font-mono text-[10px] font-bold uppercase tracking-[0.08em]',
        className,
      )}
      style={{ transform: `rotate(${angle}deg)` }}
    >
      {children}
    </span>
  );
}
