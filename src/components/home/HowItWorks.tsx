import { useEffect, useState } from 'react';
import { Pill, Tape } from '@/components/home/Scrapbook';
import { cn } from '@/lib/utils';

/**
 * A launch day, hour by hour — staggered down the page on one line.
 *
 * Every beat here is a real mechanic, not marketing: the board is keyed to UTC
 * days (`launchDateKey`), ranks are whatever the votes say, the podium takes
 * the medals, and the share kit and the badge are what a launch leaves with.
 * It needs no launches to exist to be true, which is why it is on the landing
 * page of a board that has none yet.
 *
 * It is also *live*. The beat happening right now in UTC is marked, and the
 * voting beat counts down to the lock — so the section answers "when does
 * today's board close" as well as "how does this work", and a reader who
 * arrives at 22:40 UTC learns they have eighty minutes.
 *
 * Originally three steps, staggered down the page with a line drawn between them.
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

/** Which part of the UTC day a beat covers, for the "now" marker. */
type Phase = 'open' | 'voting' | 'locking' | 'after';

interface Step {
  phase: Phase;
  title: string;
  body: string;
  /** The time, as it appears on the pill hanging off the panel. */
  when: string;
  /** How far along the row this panel starts, at lg and up. */
  indent: string;
  angle: number;
  mark: () => React.ReactElement;
}

const STEPS: Step[] = [
  {
    phase: 'open',
    title: 'The board opens',
    body: 'A new board starts at midnight UTC. Everything launched today competes on it, and every launch starts on zero — yesterday’s winners get no head start.',
    when: '00:00 UTC',
    indent: 'lg:mr-44',
    angle: -1,
    mark: PostMark,
  },
  {
    phase: 'voting',
    title: 'The board votes',
    body: 'Everyone signed in gets one vote per launch, and the order is exactly what those votes say. Nothing is featured into first place.',
    when: 'All day',
    indent: 'lg:ml-24 lg:mr-20',
    angle: 0.8,
    mark: VoteMark,
  },
  {
    phase: 'locking',
    title: 'Ranks lock',
    body: 'At the end of the UTC day the order is final. The top three take the podium, and every launch keeps its place in the archive for good.',
    when: '23:59 UTC',
    indent: 'lg:ml-44 lg:mr-6',
    angle: -0.7,
    mark: LockMark,
  },
  {
    phase: 'after',
    title: 'Leave with the artwork',
    body: 'However the day went, you keep the share cards, a badge to embed on your own site, and the text to paste. Yours, not ours.',
    when: 'Tomorrow',
    indent: 'lg:ml-12 lg:mr-32',
    angle: 0.6,
    mark: ShareMark,
  },
];

/**
 * Where the UTC day is, re-read every thirty seconds.
 *
 * Thirty seconds rather than one: the smallest unit on screen is a minute, and
 * redrawing a countdown every second to change a digit a reader will not see
 * change is sixty renders a minute for nothing. The interval is torn down with
 * the section, so a reader who scrolls on is not paying for it.
 */
function useUtcNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

/** Which beat is happening at this moment of the UTC day. */
function currentPhase(now: Date): Phase {
  const hour = now.getUTCHours();
  if (hour === 0) return 'open';
  if (hour === 23) return 'locking';
  return 'voting';
}

/** "5h 12m" until the board locks at the end of the UTC day. */
function untilLock(now: Date): string {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const minutes = Math.max(0, Math.floor((end - now.getTime()) / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export function HowItWorks() {
  const now = useUtcNow();
  const live = currentPhase(now);

  return (
    <section className="relative isolate overflow-hidden border-b border-edge py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Heading />

        <div className="relative mt-12 sm:mt-16">
          <Route className="pointer-events-none absolute inset-0 -z-10 hidden size-full text-pop lg:block" />

          <ol className="space-y-8 lg:space-y-10">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className={cn('relative', step.indent)}
                aria-current={step.phase === live ? 'step' : undefined}
              >
                <Tape angle={-14} className="-top-3 left-10 z-10" />

                <div
                  className={cn(
                    'relative rounded-slab border bg-surface p-5 shadow-hard sm:p-6',
                    /* The live beat gets the accent edge — the only panel that
                       changes, so the eye finds "now" without reading. */
                    step.phase === live ? 'border-accent' : 'border-edge',
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

                      {step.phase === live && (
                        <p className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-accent">
                          {/* A shape as well as a colour, so "now" survives
                              greyscale — per the house rule. */}
                          <span aria-hidden="true" className="size-2 animate-pulse bg-accent" />
                          {live === 'open'
                            ? 'Happening now — the board just opened'
                            : `Happening now — locks in ${untilLock(now)}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hangs off the right edge, on the outside of the panel. */}
                <Pill
                  angle={6}
                  className="absolute -bottom-3 right-6 z-10 shadow-hard-sm sm:right-10"
                >
                  {step.when}
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
      How your launch day{' '}
      <span className="relative inline-block align-middle">
        <Lozenge className="absolute -inset-x-3 -inset-y-1 -z-10 h-[calc(100%+0.5rem)] w-[calc(100%+1.5rem)] text-pop" />
        <span className="px-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-on-pop">
          actually
        </span>
      </span>{' '}
      goes
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
 * to the right of the first panel, the wedges either side of the ones below it,
 * and the gaps between every one of them. A line confined to a 160px column had 24px of
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
        d="M975 40C880 150 560 110 330 220 110 320 60 360 180 450c140 100 560 80 700 180 110 80 40 150-140 200-170 45-420 30-520 130"
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
 * Four figures, kept here rather than in `Illustrations.tsx`.
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

/** The day closing: a padlock over a podium. */
function LockMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-14">
      <path d="M22 26v-6a10 10 0 0 1 20 0v6" {...MARK} />
      <rect x="16" y="26" width="32" height="20" rx="2" fill={ON_POP} stroke="none" />
      <circle cx="32" cy="35" r="3" fill="var(--color-pop)" />
      <path d="M32 37v4" stroke="var(--color-pop)" strokeWidth={3} strokeLinecap="round" />
      {/* The podium under it: second, first, third. */}
      <rect x="8" y="52" width="14" height="6" rx="1" {...MARK} />
      <rect x="25" y="49" width="14" height="9" rx="1" fill={ON_POP} stroke="none" />
      <rect x="42" y="54" width="14" height="4" rx="1" {...MARK} />
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
