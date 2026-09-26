import { cn } from '@/lib/utils';

/**
 * The brick, as a building block for the rest of the site.
 *
 * The favicon is three studded plates stacked out of true — studs say toy
 * brick, the stagger says a deck of things. This file is that same geometry
 * made reusable, so the mark in the browser tab and the shapes on the page are
 * drawn from one set of numbers rather than two hand-kept copies that drift.
 *
 * Everything fills with `currentColor`, like the wordmark: the parent decides
 * the colour and the theme follows for free.
 */

/* The favicon's own grid and proportions — see the brand assets. */
const PLATE_H = 16;
const PLATE_W = 44;
const STUD_W = 12;
const STUD_H = 8;
const R = 3;

function Studs({ x, y }: { x: number; y: number }) {
  return (
    <>
      <rect x={x + 6} y={y - STUD_H} width={STUD_W} height={STUD_H} rx={R} />
      <rect x={x + 26} y={y - STUD_H} width={STUD_W} height={STUD_H} rx={R} />
    </>
  );
}

/** The favicon itself, at any size. */
export function BrickMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn('fill-current', className)}
    >
      {title && <title>{title}</title>}
      <Studs x={10} y={12} />
      <rect x={10} y={12} width={PLATE_W} height={PLATE_H} rx={R} />
      <rect x={18} y={29} width={PLATE_W} height={PLATE_H} rx={R} />
      <rect x={2} y={46} width={PLATE_W} height={PLATE_H} rx={R} />
    </svg>
  );
}

/*
 * Where each brick in a stack sits sideways.
 *
 * A fixed cycle rather than random, so the stack is the same shape on every
 * render and on every visitor's screen — a stack that reshuffles on reload
 * reads as broken, not as playful. The cycle is the favicon's own stagger,
 * continued.
 */
const OFFSETS = [8, 16, 0, 12, 4, 18, 2, 10];

interface BrickStackProps {
  /** How many bricks to draw. */
  count: number;
  /** Past this many, the stack stops growing — see the note below. */
  cap?: number;
  className?: string;
  /** Read out instead of the picture. */
  label: string;
}

/**
 * A stack with one brick per thing counted.
 *
 * Capped, because this is a picture of "some" versus "none", not a chart. Past
 * a dozen, another brick changes nothing a reader can see, and an uncapped
 * stack eventually becomes taller than the section it sits in.
 *
 * Zero is drawn deliberately: an empty baseplate with a dashed brick on it.
 * An empty stack is the most informative state this has — it says "nobody has
 * gone yet" — and drawing nothing would say only that something failed to load.
 */
export function BrickStack({ count, cap = 12, className, label }: BrickStackProps) {
  const shown = Math.min(Math.max(0, count), cap);
  const rowHeight = PLATE_H + 1;
  const height = STUD_H + Math.max(shown, 1) * rowHeight + 8;
  const width = 64;

  /* Built bottom-up: brick 0 sits on the baseplate. */
  const rows = Array.from({ length: shown }, (_, index) => ({
    x: OFFSETS[index % OFFSETS.length],
    y: height - 8 - (index + 1) * rowHeight,
  }));
  const top = rows[rows.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className={cn('fill-current', className)}
    >
      {/* The baseplate — always there, so an empty stack still has a floor. */}
      <rect x={0} y={height - 6} width={width} height={6} rx={2} className="opacity-40" />

      {shown === 0 ? (
        <rect
          x={10}
          y={height - 8 - rowHeight}
          width={PLATE_W}
          height={PLATE_H}
          rx={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          className="opacity-60"
        />
      ) : (
        <>
          {rows.map((row, index) => (
            <rect
              key={index}
              x={row.x}
              y={row.y}
              width={PLATE_W}
              height={PLATE_H}
              rx={R}
              /* The newest brick snaps on last, and only that one — a whole
                 stack animating at once reads as a loading state. Stops under
                 reduced motion via the global rule. */
              className={index === rows.length - 1 ? 'animate-[var(--animate-slam)]' : undefined}
            />
          ))}
          <Studs x={top.x} y={top.y} />
        </>
      )}
    </svg>
  );
}

/**
 * A row of plates as a section break.
 *
 * Offset like a course of bricks rather than drawn as a rule, so the break
 * between two sections is made of the same thing as the logo. `aria-hidden`
 * throughout — it is a divider, and a screen reader has the headings.
 */
export function BrickDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex items-end justify-center gap-1.5', className)}>
      {[10, 16, 12, 22, 12, 16, 10].map((width, index) => (
        <span
          key={index}
          className="relative block h-2.5 rounded-[2px] bg-current"
          style={{ width: `${width * 3}px`, transform: `translateY(${index % 2 ? -3 : 0}px)` }}
        >
          {/* Studs on the raised ones only — the course reads as bricks
              without every block shouting it. */}
          {index % 2 === 1 && (
            <>
              <span className="absolute -top-1.5 left-[22%] block h-1.5 w-2 rounded-t-[2px] bg-current" />
              <span className="absolute -top-1.5 right-[22%] block h-1.5 w-2 rounded-t-[2px] bg-current" />
            </>
          )}
        </span>
      ))}
    </div>
  );
}

/**
 * The mark, knocked over — for the page that never launched.
 *
 * The same three plates — one still flat, one leaning off it, one fallen on the
 * floor studs-up. It is the brand's shape in a state the brand is never in
 * anywhere else, which is the joke.
 */
export function ToppledBricks({ className }: { className?: string }) {
  /*
   * Composed so each piece reads on its own. A first version let the upper two
   * plates overlap, which made one jumbled shape rather than three bricks —
   * and a toppled stack only works as a joke if you can count what fell.
   * Every plate is the same size, as they are in the mark.
   */
  const W = 58;
  const H = 16;

  return (
    <svg viewBox="0 0 200 92" aria-hidden="true" className={cn('fill-current', className)}>
      <rect x={4} y={86} width={192} height={4} rx={2} className="opacity-40" />

      {/* The bottom plate, still flat where it was. */}
      <rect x={10} y={70} width={W} height={H} rx={R} />

      {/* The middle one, leaning off it like a ramp: its lower edge pivots on
          the top of the first plate and its far end lands on the floor. */}
      <rect x={46} y={54} width={W} height={H} rx={R} transform="rotate(16 46 70)" />

      {/* The top one, on the floor with its studs up — the only piece that
          still has them, because it is the one that was on top. */}
      <g transform="rotate(-4 149 78)">
        <rect x={120} y={70} width={W} height={H} rx={R} />
        <rect x={128} y={62} width={STUD_W + 2} height={STUD_H} rx={R} />
        <rect x={156} y={62} width={STUD_W + 2} height={STUD_H} rx={R} />
      </g>

      {/* A stud that came loose on the way down. */}
      <rect x={104} y={80} width={STUD_W} height={6} rx={2} />
    </svg>
  );
}
