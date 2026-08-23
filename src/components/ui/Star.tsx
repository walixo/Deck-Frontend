import { cn } from '@/lib/utils';

/**
 * Stars from the neobrutalism.dev star set.
 *
 * Traced off the published shapes rather than approximated, so Deck's stars are
 * the same stars the rest of the style world is using — the previous marker was
 * a text `★` glyph, which renders as a different shape in every font stack and
 * is a hair off-baseline in most of them.
 *
 * All of them sit in a 0–200 box, are drawn from a single closed path, and take
 * `currentColor` — so a star inherits the surrounding text colour and inverts
 * with the theme like every other mark on Deck. Filled rather than stroked, so
 * they hold at 12px in the navbar and at 120px on a page.
 *
 * Six of the forty are carried here. The set is not a library to import wholesale
 * — each one that turns up in the UI is a design decision, and forty unused
 * paths in the bundle is forty things nobody chose.
 */
const STARS = {
  /** Five points, deliberately uneven. The most "hand-cut" of the set. */
  burst: 'M158.682 195 100 127.008 41.219 195l43.344-79.687L5 77.551l85.5 18.732L100 5l9.5 91.283L195 77.65l-79.661 37.663z',
  /** Octagon. Reads as a seal or a stamp rather than a star. */
  seal: 'm100 5 67.175 27.825L195 100l-27.825 67.175L100 195l-67.175-27.825L5 100l27.825-67.175z',
  /** The conventional five-point star, squared off. */
  classic:
    'M158.727 195 100 150.193 41.273 195l22.353-72.545L5 77.545l72.546-.101L100 5l22.455 72.444 72.545.102-58.626 44.909z',
  /** Hexagon — a token, a chip, a badge back. */
  token: 'm100 5 82.272 47.5v95L100 195l-82.272-47.5v-95z',
  /** Four points with concave sides: the sparkle. This is the "new" marker. */
  sparkle: 'm100 5 25.659 69.341L195 100l-69.341 25.659L100 195l-25.659-69.341L5 100l69.341-25.659z',
  /** The same four points drawn thin — a glint rather than a sparkle. */
  glint: 'm100 5 6.718 88.283L195 100l-88.282 6.718L100 195l-6.718-88.282L5 100l88.283-6.718z',
} as const;

export type StarName = keyof typeof STARS;

interface StarProps {
  name?: StarName;
  className?: string;
  /**
   * Give a star a title only when it is the sole carrier of some meaning. Most
   * of Deck's stars sit beside a word that already says it, and announcing
   * "star" after "Future Gen" is noise — those stay `aria-hidden`.
   */
  title?: string;
  /** Degrees. Stars look intentional off-axis and generic square-on. */
  spin?: number;
}

export function Star({ name = 'sparkle', className, title, spin }: StarProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn('inline-block', className)}
      style={spin ? { transform: `rotate(${spin}deg)` } : undefined}
    >
      {title && <title>{title}</title>}
      <path d={STARS[name]} />
    </svg>
  );
}
