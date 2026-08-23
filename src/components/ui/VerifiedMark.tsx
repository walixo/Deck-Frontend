import { cn } from '@/lib/utils';

interface VerifiedMarkProps {
  /** Whose mark it is, so the label names them rather than saying "verified". */
  name?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * The blue check beside a name.
 *
 * Drawn here rather than pulled from an icon set, because no library's check
 * badge is the right shape — they are all a rounded square or a soft rosette,
 * and the mark people actually recognise is a nine-lobed scalloped disc.
 *
 * **The path is generated, not typed.** The first attempt at this was
 * hand-written and read as an ellipse: its vertices had drifted a fraction of a
 * unit each and the accumulated error showed as a squash. Every lobe centre
 * here sits on a circle by construction — `12 + 9.55·cos(2πi/9 − π/2)` — so the
 * shape is symmetric whether or not anyone eyeballs it. Outer radius works out
 * at 11.64, leaving 0.36 of margin inside the 24-unit box.
 *
 * The blue is a standing exemption from the palette (design/CONTRACT.md): a blue
 * check is a convention people read without being taught, and spending Deck's
 * own accent on it would both weaken the accent and make the mark ambiguous.
 *
 * Not `aria-hidden`. Verification is information about the account, not
 * decoration, so it carries a real label; without one a screen-reader user gets
 * no signal that anything is being claimed.
 */

/** Nine lobes, centres on a circle of radius 9.55, each scallop an r=3.6 arc. */
const BADGE_PATH =
  'M12 2.45 A3.6 3.6 0 0 1 18.14 4.68 A3.6 3.6 0 0 1 21.4 10.34 A3.6 3.6 0 0 1 20.27 16.77 ' +
  'A3.6 3.6 0 0 1 15.27 20.97 A3.6 3.6 0 0 1 8.73 20.97 A3.6 3.6 0 0 1 3.73 16.78 ' +
  'A3.6 3.6 0 0 1 2.6 10.34 A3.6 3.6 0 0 1 5.86 4.68 A3.6 3.6 0 0 1 12 2.45 Z';

export function VerifiedMark({ name, size = 'sm', className }: VerifiedMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={name ? `${name} is verified` : 'Verified account'}
      className={cn(
        'inline-block shrink-0 align-text-bottom',
        /* Bigger than it was. At size-4 beside display type the scallops
           disappeared and it read as a dot; these sizes keep the lobes legible
           at the two places it actually appears. */
        size === 'sm' ? 'size-[1.15em]' : 'size-6',
        className,
      )}
    >
      <path fill="var(--color-verified)" d={BADGE_PATH} />
      <path
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.9 12.3l2.8 2.8 5.4-5.6"
      />
    </svg>
  );
}
