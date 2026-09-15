import { Pill, Tape } from '@/components/home/Scrapbook';
import { cn } from '@/lib/utils';

/**
 * Three steps, staggered down the page with a line drawn between them.
 *
 * The stagger is the argument. Three equal columns say "three features"; three
 * panels stepping down and to the right, strung on one wandering line, say
 * "this happens, then this, then this" — which is the only thing this section
 * is for. The line is what makes it a route rather than a list, so it is drawn
 * first and behind everything.
 *
 * Below `lg` the stagger and the line both go. A route needs somewhere to
 * wander and a phone column has nowhere; there the panels stack, which is what
 * a route looks like from directly above.
 */

const ON_POP = 'var(--color-on-pop)';

interface Step {
  title: string;
  body: string;
  sticker: string;
  /** How far along the row this panel starts, at lg and up. */
  indent: string;
  angle: number;
  mark: () => React.ReactElement;
}

const STEPS: Step[] = [
  {
    title: 'Post it',
    body: 'A name, a tagline, a logo and a link. Nothing waits for approval — your launch is on the board the moment you publish it.',
    sticker: 'Two minutes',
    indent: 'lg:mr-40',
    angle: -1,
    mark: PostMark,
  },
  {
    title: 'The board votes',
    body: 'Everyone signed in gets one vote per launch, and the order is whatever those votes say. The board clears at midnight UTC, so every day starts level.',
    sticker: 'One each',
    indent: 'lg:ml-28 lg:mr-12',
    angle: 0.8,
    mark: VoteMark,
  },
  {
    title: 'Leave with the artwork',
    body: 'However the day goes, you keep the share cards, a badge you can embed on your own site, and the text to paste. Yours, not ours.',
    sticker: 'Yours to keep',
    indent: 'lg:ml-52',
    angle: -0.6,
    mark: ShareMark,
  },
];

export function HowItWorks() {
  return (
    <section className="relative isolate overflow-hidden border-b border-edge py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Heading />

        <div className="relative mt-12 sm:mt-16">
          <Route className="pointer-events-none absolute inset-0 -z-10 hidden size-full text-pop lg:block" />

          <ol className="space-y-8 lg:space-y-10">
            {STEPS.map((step, index) => (
              <li key={step.title} className={cn('relative', step.indent)}>
                <Tape angle={-14} className="-top-3 left-10 z-10" />

                <div
                  className={cn(
                    'relative rounded-slab border border-edge bg-surface p-5 shadow-hard sm:p-6',
                    'transition-[transform,box-shadow] duration-[140ms] ease-[var(--ease-snap)]',
                    '[transform:rotate(var(--tilt))] hover:[transform:rotate(0deg)]',
                    'hover:shadow-hard-lg',
                  )}
                  style={{ '--tilt': `${step.angle}deg` } as React.CSSProperties}
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                    {/* The figure, in the block it belongs to. Fixed size in
                        both directions so the three panels agree on where
                        their text column starts. */}
                    <div className="grid size-24 shrink-0 place-items-center rounded-slab border border-edge bg-pop sm:size-28">
                      <step.mark />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3">
                        <span
                          aria-hidden="true"
                          className="font-mono text-[11px] font-bold tabular-nums text-muted"
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="display-tight text-xl uppercase sm:text-2xl">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted text-pretty">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hangs off the right edge, on the outside of the panel. */}
                <Pill angle={6} className="absolute -bottom-3 right-6 z-10 shadow-hard-sm sm:right-10">
                  {step.sticker}
                </Pill>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/**
 * "How a launch actually works" — with the qualifier sitting on a blob.
 *
 * The small word is the reason the shape is there. Set at the same size as the
 * rest it is a hedge; sitting on a lozenge at a third the size, it reads as an
 * aside the sentence carries on past, which is what it is.
 */
function Heading() {
  return (
    <h2 className="display-tight max-w-2xl text-3xl uppercase text-balance sm:text-4xl">
      How a launch{' '}
      <span className="relative inline-block align-middle">
        <Lozenge className="absolute -inset-x-3 -inset-y-1 -z-10 h-[calc(100%+0.5rem)] w-[calc(100%+1.5rem)] text-pop" />
        <span className="px-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-on-pop">
          actually
        </span>
      </span>{' '}
      works
      <span aria-hidden="true" className="inline-block text-accent [transform:rotate(8deg)]">
        !
      </span>
    </h2>
  );
}

/** The lozenge behind the aside — two lobes, so it reads as drawn not boxed. */
function Lozenge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 40"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M18 8c14-9 30-6 44-2 12 3 24-4 38 0 16 5 22 24 10 30-14 7-32 2-48 3-14 1-26 5-40 0C8 34 4 17 18 8Z" />
    </svg>
  );
}

/**
 * The wandering line the panels are strung on.
 *
 * Stretched across the whole block rather than tucked into a gutter, because
 * the negative space the stagger creates is not in one place — it is the strip
 * to the right of the first panel, the wedges to the left of the other two, and
 * the gaps between all three. A line confined to a 160px column had 24px of
 * itself showing and the rest behind panel one.
 *
 * Passing behind the panels is the point rather than a compromise: a route that
 * disappears under one card and comes out the other side reads as continuous,
 * which a line that stops at every edge does not.
 *
 * `preserveAspectRatio="none"` so it always spans the block whatever the
 * panels' heights come to, and `vector-effect` so the stroke stays 6px while
 * that stretching happens — otherwise a tall page draws a fatter line than a
 * short one.
 */
function Route({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M975 55C880 210 520 150 300 300 90 440 20 520 60 640c50 140 260 120 240 220-15 80-120 80-180 125"
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ----------------------------------------------------------------- marks --- */

/*
 * Three figures, kept here rather than in `Illustrations.tsx`.
 *
 * That file holds scenes — the empty deck, the lost card — drawn at 150x116 to
 * fill an empty state. These are marks: one idea each, drawn square to sit in a
 * 96px tile. They also draw in `on-pop` throughout rather than in `--edge`,
 * because they live *inside* a block that does not flip with the theme, and an
 * edge-coloured mark in there is guaranteed to vanish in one theme or the
 * other.
 */

const MARK = {
  fill: 'none',
  stroke: ON_POP,
  strokeWidth: 3,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};

/** A card being posted: a form, and it going up. */
function PostMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-14">
      <rect x="8" y="18" width="34" height="38" rx="2" {...MARK} />
      <path d="M16 30h18M16 38h18M16 46h10" {...MARK} />
      <path d="M46 26l10-10M56 16v10M56 16h-10" {...MARK} strokeWidth={3.5} />
      <rect x="40" y="34" width="16" height="16" rx="2" fill={ON_POP} stroke="none" />
      <path d="M48 38l5 7h-10z" fill="var(--color-pop)" stroke="none" />
    </svg>
  );
}

/** Votes stacking up: three bars and a caret. */
function VoteMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-14">
      <path d="M32 6l10 13H22z" fill={ON_POP} stroke="none" />
      <rect x="10" y="40" width="12" height="16" rx="1.5" {...MARK} />
      <rect x="26" y="30" width="12" height="26" rx="1.5" fill={ON_POP} stroke="none" />
      <rect x="42" y="46" width="12" height="10" rx="1.5" {...MARK} />
    </svg>
  );
}

/** The card leaving with you: a frame, and a copy peeling off it. */
function ShareMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-14">
      <rect x="8" y="14" width="34" height="28" rx="2" {...MARK} />
      <path d="M8 34l9-8 8 7 6-5 11 9" {...MARK} />
      <circle cx="32" cy="23" r="3.5" {...MARK} />
      {/* Spread first, then the fill: `MARK` carries `fill: none`, and the
          copy in front has to be opaque or the frame behind shows through it. */}
      <rect x="24" y="30" width="34" height="28" rx="2" {...MARK} fill="var(--color-pop)" />
      <path d="M32 44h18M32 51h12" {...MARK} />
    </svg>
  );
}
