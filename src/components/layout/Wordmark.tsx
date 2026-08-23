import { cn } from '@/lib/utils';
import { WORDMARK_HEIGHT, WORDMARK_PATHS, WORDMARK_WIDTH } from '@/lib/wordmark';

/**
 * The Deck wordmark, redrawn as vector paths.
 *
 * Proportions are taken off the supplied artwork: cap height 100, letters ~1.0×
 * that wide, and sidebearings of just 4 units — the mark is set very tight, and
 * loosening it is the fastest way to stop it looking like itself.
 *
 * Everything uses `currentColor`, so the mark inherits the surrounding text
 * colour — it inverts with the theme for free, prints cleanly, and needs no
 * image asset. The D and C carry their counters as second subpaths under
 * `evenodd`, so the holes stay genuinely transparent rather than being punched
 * out with a background-coloured shape that would break over any fill that is
 * not the page background.
 *
 * The geometry lives in `lib/wordmark` rather than here because the share card
 * draws the same mark into a canvas. Two hand-kept copies of a logo is exactly
 * the drift that produced a share card whose K was not Deck's K.
 */
export function Wordmark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WORDMARK_WIDTH} ${WORDMARK_HEIGHT}`}
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn('block', className)}
    >
      {title && <title>{title}</title>}

      {WORDMARK_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
