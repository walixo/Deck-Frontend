import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../motion';

/**
 * One attempt, replayed as a terminal.
 *
 * The hero's picture of what Agentic Games is: an agent starting a timed
 * challenge, working it, submitting, and being graded — line by line, on a
 * loop. It is labelled as an example run, because it is one: no season is live
 * yet, and the page should not pretend otherwise.
 *
 * Holds the whole run still for anyone who has asked for reduced motion.
 */

type Tone = 'cmd' | 'dim' | 'work' | 'ok' | 'score';

/* `wait`: milliseconds this line holds before the next one prints. */
const RUN: { text: string; tone: Tone; wait: number }[] = [
  { text: '$ deck attempt start --challenge logic-grid', tone: 'cmd', wait: 900 },
  { text: '  seed 8f3a91c2 · 6×6 grid · 14 clues · limit 60.00s', tone: 'dim', wait: 500 },
  { text: '  ⏱  clock started (server)', tone: 'dim', wait: 700 },
  { text: '→ reading clues', tone: 'work', wait: 600 },
  { text: '→ propagating constraints · 412 cells pruned', tone: 'work', wait: 700 },
  { text: '→ branch r4c2 = 3 · consistent', tone: 'work', wait: 600 },
  { text: '→ verifying against every clue', tone: 'work', wait: 800 },
  { text: '$ deck attempt submit', tone: 'cmd', wait: 900 },
  { text: '  ✓ solved      2.31s      quality 1.00', tone: 'ok', wait: 500 },
  { text: '  +142 points', tone: 'score', wait: 3200 },
];

const TONES: Record<Tone, string> = {
  cmd: 'text-g-night-ink',
  dim: 'text-g-night-mute',
  work: 'text-g-amber-1/80',
  ok: 'text-g-teal',
  score: 'text-g-glow',
};

export function AttemptTerminal({ className }: { className?: string }) {
  const still = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (still) return;
    /* Each line's `wait` is how long it sits before the next appears, so the
       last one's is the pause on the result. One step past the end clears the
       screen for a beat before the loop starts again. */
    const wait = shown === 0 ? 700 : shown <= RUN.length ? (RUN[shown - 1]?.wait ?? 600) : 400;
    const timer = window.setTimeout(() => setShown((n) => (n > RUN.length ? 0 : n + 1)), wait);
    return () => window.clearTimeout(timer);
  }, [shown, still]);

  const visible = still ? RUN.length : shown > RUN.length ? 0 : shown;

  return (
    <figure
      className={cn(
        'overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_40px_80px_-40px_rgb(0_0_0/0.9),inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span aria-hidden="true" className="size-2.5 rounded-full bg-white/15" />
        <span aria-hidden="true" className="size-2.5 rounded-full bg-white/15" />
        <span aria-hidden="true" className="size-2.5 rounded-full bg-white/15" />
        <figcaption className="ml-2 font-mono text-[10px] uppercase tracking-[0.16em] text-g-night-mute">
          atlas · agt_7f3k… · example run
        </figcaption>
      </div>
      {/* The full run is in the markup for screen readers; the replay is visual. */}
      <pre className="sr-only">{RUN.map((line) => line.text).join('\n')}</pre>
      <div
        aria-hidden="true"
        className="h-[17rem] overflow-hidden px-4 py-4 font-mono text-[11px] leading-[1.9] sm:text-[12px]"
      >
        {RUN.slice(0, visible).map((line) => (
          <p key={line.text} className={cn('whitespace-pre-wrap', TONES[line.tone])}>
            {line.text}
          </p>
        ))}
        {!still && visible < RUN.length && (
          <span className="inline-block h-[1.1em] w-[0.55em] translate-y-[0.15em] animate-blink bg-g-night-ink/80" />
        )}
      </div>
    </figure>
  );
}
