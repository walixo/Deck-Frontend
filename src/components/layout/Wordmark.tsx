import { cn } from '@/lib/utils';

/**
 * The Deck wordmark, redrawn as vector paths.
 *
 * Proportions are taken off the supplied artwork: cap height 100, letters ~1.0×
 * that wide, and sidebearings of just 4 units — the mark is set very tight, and
 * loosening it is the fastest way to stop it looking like itself.
 *
 * Everything uses `currentColor` and one path per letter, so the mark inherits
 * the surrounding text colour — it inverts with the theme for free, prints
 * cleanly, and needs no image asset. The D and C carry their counters as second
 * subpaths under `evenodd`, so the holes stay genuinely transparent rather than
 * being punched out with a background-coloured shape that would break over any
 * fill that is not the page background.
 */
export function Wordmark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 421 100"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn('block', className)}
    >
      {title && <title>{title}</title>}

      {/* D — heavy stem, large radius on the right, rounded-rect counter */}
      <path d="M0 0H62C89 0 110 21 110 48V52C110 79 89 100 62 100H0V0ZM42 29V71H60C66 71 70 67 70 61V39C70 33 66 29 60 29H42Z" />

      {/* E — stem plus three arms; the middle arm stops short of the outer two */}
      <path d="M114 0H215V30H154V37H211V63H154V70H215V100H114V0Z" />

      {/* C — rounded left, squared aperture cut clean out of the right */}
      <path d="M263 0H323V30H259V70H323V100H263C239 100 219 82 219 58V42C219 18 239 0 263 0Z" />

      {/* K — stem, then a wide chevron whose vertex is cut flat, not pointed */}
      <path d="M327 0H367V33L394 0H421L369 47V53L421 100H394L367 67V100H327V0Z" />
    </svg>
  );
}
