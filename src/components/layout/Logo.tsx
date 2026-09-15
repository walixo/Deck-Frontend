import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Wordmark } from './Wordmark';

interface LogoProps {
  onClick?: () => void;
  /** Height of the wordmark. Defaults to the navbar size. */
  className?: string;
  /**
   * Turns off the colour cycle.
   *
   * The mark flickers wherever it appears as *the brand* — the header, the
   * footer, the auth pages. Anywhere it is being used as an illustration or a
   * decoration instead, the tic is a distraction, so it can be stopped.
   */
  still?: boolean;
}

/**
 * The brand link.
 *
 * The wordmark carries the identity on its own — no accompanying icon — so it
 * is set at a generous size and left to breathe. It shifts a hair on hover,
 * matching how every other block in the UI responds.
 *
 * **The tic.** Every fifteen seconds the mark flickers, holds lavender for five
 * seconds, then flickers back to the theme's ink. It is on the link rather than
 * inside the SVG because `Wordmark` fills with `currentColor` — animating the
 * colour on the ancestor drives all four letterforms with one property, and
 * keeps the SVG a dumb shape that anything can colour.
 *
 * It stops entirely under `prefers-reduced-motion`, via the global rule: the
 * duration collapses and the mark rests on the 0% keyframe, which is the normal
 * ink. Somebody who has asked for less movement gets a logo that simply sits
 * there, in the right colour.
 */
export function Logo({ onClick, className, still = false }: LogoProps) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="Deck — home"
      className={cn(
        'group inline-flex items-center transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-y-0.5',
        !still && 'animate-[var(--animate-wordmark)]',
      )}
    >
      <Wordmark className={cn('h-6 w-auto', className)} />
    </Link>
  );
}
