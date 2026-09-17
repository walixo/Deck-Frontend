import { cn } from '@/lib/utils';

interface SparklineProps {
  /** One value per day, oldest first. Zeroes are drawn, not skipped. */
  values: number[];
  /** What a screen reader hears instead of the picture. */
  label: string;
  className?: string;
}

/*
 * A fixed drawing space that the SVG stretches to fit its box.
 *
 * `preserveAspectRatio="none"` lets the line span whatever width it is given
 * without the component needing to measure anything, and
 * `vector-effect="non-scaling-stroke"` stops the stroke from being stretched
 * along with it — without that, a 300px-wide sparkline has a visibly fatter
 * line than a 120px one, which reads as emphasis nobody intended.
 */
const W = 100;
const H = 28;

/** Below this many views in a day, the line stays low rather than filling the
    box. See the scaling note in the component. */
const QUIET_CEILING = 5;

/**
 * A line, no axes, no labels, no grid.
 *
 * At this size a chart can answer exactly one question — "is this going up or
 * down" — and anything added in service of a second question makes it worse at
 * the first. The numbers beside it carry the magnitude.
 *
 * Colour comes from `currentColor`, so it inherits whatever the parent sets
 * and is correct in both themes without knowing which one it is in.
 */
export function Sparkline({ values, label, className }: SparklineProps) {
  /*
   * Scaled to its own peak, not to a shared one.
   *
   * These sit one per launch down a page, and a shared scale would flatten
   * every modest launch into a dead line beneath the one big one. The question
   * each line answers is about its own launch over time, so each gets its own
   * ceiling — and the counts printed next to it are what make two launches
   * comparable.
   *
   * The floor on the ceiling is what stops that from lying in the other
   * direction. Scaled purely to its own peak, a launch getting one view a day
   * draws the same dramatic mountain range as one getting two hundred —
   * because the peak is 1 and every non-zero day touches the top of the box.
   * Holding the ceiling at `QUIET_CEILING` keeps single-digit days down near
   * the baseline where they belong, and anything busier than that goes back to
   * scaling on its own numbers. It also happens to remove the divide-by-zero
   * on a week with no traffic at all.
   */
  const peak = Math.max(...values, QUIET_CEILING);

  const points = values.map((value, index) => {
    const x = values.length > 1 ? (index / (values.length - 1)) * W : W / 2;
    /* Inset by a pixel top and bottom so a peak or a flat zero is not drawn
       half-outside the box and clipped. */
    const y = H - 1 - (value / peak) * (H - 2);
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point}`).join(' ');
  const area = `${line} L${W} ${H} L0 ${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={cn('h-7 w-full overflow-visible', className)}
    >
      {values.length > 1 && <path d={area} className="fill-current opacity-[0.14]" />}
      <path
        d={values.length > 1 ? line : `M0 ${H - 1} L${W} ${H - 1}`}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="stroke-current"
      />
    </svg>
  );
}
