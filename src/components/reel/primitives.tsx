import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { kick, lerp, span } from './timing';

/*
 * The pieces every scene is built from.
 *
 * All of it is drawn in the 1920×1080 stage's own pixels (see `ReelStage`) and
 * coloured only through the theme's role tokens, so the reel is a light film
 * on the light canvas and a dark one on the dark canvas, and follows the
 * palette switcher on `/styleguide` like everything else. No hue is named
 * anywhere in this folder — design/CONTRACT.md rule 4.
 */

/**
 * A line of type rising out of its own clipped box.
 *
 * The reel's version of the hero's `rise` keyframe: the words appear to be
 * *set*, not to fade in, because nothing in this system fades. `progress` runs
 * 0 → 1 to bring it in; `out` runs 0 → 1 to send it on up and away, for the
 * cuts where one headline replaces another.
 */
export function Rise({
  progress,
  out = 0,
  children,
  className,
}: {
  progress: number;
  out?: number;
  children: ReactNode;
  className?: string;
}) {
  /* 110%, not 100%, for the same reason the keyframe travels that far: at
     100% subpixel rounding leaves a hairline of the glyph showing. */
  const y = (1 - progress) * 110 - out * 110;

  return (
    <span className={cn('block overflow-hidden pb-[0.08em]', className)}>
      <span className="block" style={{ transform: `translateY(${y}%)` }}>
        {children}
      </span>
    </span>
  );
}

/**
 * A headline's full stop, in the accent.
 *
 * The reference cut ends every line on a coloured period; this is the same
 * beat in Deck's terms. `accent` is the themed *mark* colour — legible on both
 * canvases — which is what a coloured glyph on the page has to be.
 */
export function Stop() {
  return <span className="text-accent">.</span>;
}

/**
 * A huge outlined word sitting behind a scene, drifting.
 *
 * Texture rather than content, which is why it is edge-coloured at a tenth
 * and outlined rather than filled: it should read as the stock the headline is
 * printed on. The drift is the one continuous motion in the reel, for the same
 * reason the hero's headline floats — nothing is reacting to anything here, so
 * a stepped move would read as a stutter.
 */
export function Ghost({
  word,
  t,
  start,
  end,
  className,
  style,
}: {
  word: string;
  t: number;
  start: number;
  end: number;
  className?: string;
  style?: CSSProperties;
}) {
  const drift = lerp(0, -80, span(t, start, end));

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute whitespace-nowrap font-display uppercase leading-none text-transparent opacity-[0.12] [-webkit-text-stroke:3px_var(--edge)]',
        className,
      )}
      style={{ transform: `translateX(${drift}px)`, ...style }}
    >
      {word}
    </div>
  );
}

/** A machine value: mono, bold, spaced out, muted unless told otherwise. */
export function Mono({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn(
        'font-mono text-[17px] font-bold uppercase tracking-[0.14em] text-muted',
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}

/*
 * The brick mark, one plate at a time.
 *
 * Same geometry as `BrickMark` (its 64-unit grid, plate and stud sizes), drawn
 * here as three separately movable plates so the logo can be *built* on screen
 * rather than shown. Kept in step with `ui/Bricks` by hand because there are
 * only three rectangles and a pair of studs; if that file's numbers ever
 * change, these change with them.
 */
const PLATES = [
  { x: 10, y: 12, studs: true },
  { x: 18, y: 29, studs: false },
  { x: 2, y: 46, studs: false },
];

/**
 * The mark, stacking itself.
 *
 * Plates drop in top to bottom, a beat apart, each on the `kick` curve so it
 * lands with the same overshoot as the site's `slam`. `start` is when the first
 * plate begins to fall.
 */
export function StackingMark({
  t,
  start,
  size,
  className,
}: {
  t: number;
  start: number;
  size: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('overflow-visible fill-current', className)}
    >
      {PLATES.map((plate, index) => {
        const landed = kick(span(t, start + index * 0.12, start + index * 0.12 + 0.34));
        const drop = (1 - landed) * -70;
        /* Hidden until its turn, rather than parked visibly above the frame. */
        if (t < start + index * 0.12) return null;

        return (
          <g key={index} transform={`translate(0 ${drop})`}>
            {plate.studs && (
              <>
                <rect x={plate.x + 6} y={plate.y - 8} width={12} height={8} rx={3} />
                <rect x={plate.x + 26} y={plate.y - 8} width={12} height={8} rx={3} />
              </>
            )}
            <rect x={plate.x} y={plate.y} width={44} height={16} rx={3} />
          </g>
        );
      })}
    </svg>
  );
}
