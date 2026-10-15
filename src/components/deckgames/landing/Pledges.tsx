import { cn } from '@/lib/utils';
import { useInView } from '../motion';

/**
 * Three promises, threaded on one thin line.
 *
 * The video's numbered connector: a hairline down the middle of the page, a
 * small boxed number at each stop, a short heading and a dark panel of light.
 * Each panel is a little abstract instrument rather than a screenshot — the
 * point is the promise, not a UI that will be out of date next month.
 */
const STEPS = [
  {
    title: 'Tap, and you’re in',
    body: 'No downloads and no app store. Every game opens in a sandboxed player, right in the page.',
    visual: 'spectrum',
  },
  {
    title: 'Your scores follow you',
    body: 'One Deck account across every game: leaderboards, purchases and progress, wherever you play.',
    visual: 'bars',
  },
  {
    title: 'Pay the people who made it',
    body: 'Buy a level, a skin or a stack of coins and 80% goes to the developer’s own account.',
    visual: 'split',
  },
] as const;

export function Pledges() {
  return (
    <section aria-labelledby="promise-title" className="relative bg-g-paper px-4 pb-24 sm:px-6">
      <div aria-hidden="true" className="mx-auto h-16 w-px bg-g-line" />
      <h2
        id="promise-title"
        className="mx-auto max-w-2xl text-center text-[clamp(2rem,4.6vw,3.75rem)] font-medium leading-[1] tracking-[-0.05em] text-balance"
      >
        An arcade for people who want more from play
      </h2>
      <div aria-hidden="true" className="mx-auto mt-10 h-16 w-px bg-g-line" />

      <ol className="mx-auto max-w-3xl">
        {STEPS.map((step, index) => (
          <Step key={step.title} index={index + 1} {...step} />
        ))}
      </ol>
    </section>
  );
}

function Step({
  index,
  title,
  body,
  visual,
}: {
  index: number;
  title: string;
  body: string;
  visual: (typeof STEPS)[number]['visual'];
}) {
  const [ref, seen] = useInView<HTMLLIElement>();

  return (
    <li ref={ref} className={cn('relative pb-6 text-center opacity-0', seen && 'animate-g-rise')}>
      <h3 className="text-[clamp(1.25rem,2.4vw,1.75rem)] font-medium tracking-[-0.035em]">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-g-mute">{body}</p>

      <div className="relative mx-auto mt-8 max-w-xl">
        <Marker index={index} side="left" />
        <Marker index={index} side="right" />
        <div className="relative aspect-[16/8] overflow-hidden rounded-2xl bg-g-night shadow-[0_30px_60px_-30px_rgb(0_0_0/0.5)]">
          {visual === 'spectrum' && <Spectrum />}
          {visual === 'bars' && <Bars />}
          {visual === 'split' && <Split />}
        </div>
      </div>
      <div aria-hidden="true" className="mx-auto h-20 w-px bg-g-line" />
    </li>
  );
}

function Marker({ index, side }: { index: number; side: 'left' | 'right' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute top-1/2 hidden -translate-y-1/2 items-center gap-2 font-mono text-[10px] text-g-mute sm:flex',
        side === 'left' ? '-left-16 flex-row' : '-right-16 flex-row-reverse',
      )}
    >
      <span className="grid size-5 place-items-center rounded-[4px] border border-g-line">
        {index}
      </span>
      <span className="h-px w-6 bg-g-line" />
    </span>
  );
}

/** Rows of dots settling into colour — a game loading. */
function Spectrum() {
  const rows = ['bg-g-teal', 'bg-g-amber-2', 'bg-g-violet', 'bg-g-glow'];
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-3 bg-[radial-gradient(120%_120%_at_30%_100%,rgb(155_123_255/0.25),transparent_60%)] px-8">
      {rows.map((colour, row) => (
        <div key={colour} className="flex gap-1.5">
          {Array.from({ length: 28 }, (_, dot) => (
            <span
              key={dot}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                dot < 10 + row * 5 ? colour : 'bg-white/10',
                dot < 10 + row * 5 && 'animate-g-breathe',
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** A leaderboard as light: bars rising in order. */
function Bars() {
  const heights = [
    'h-[30%]',
    'h-[46%]',
    'h-[38%]',
    'h-[62%]',
    'h-[54%]',
    'h-[78%]',
    'h-[70%]',
    'h-[92%]',
  ];
  return (
    <div className="absolute inset-0 flex items-end justify-center gap-3 px-10 pb-8 pt-10">
      {heights.map((height, index) => (
        <span
          key={height}
          className={cn(
            'w-full max-w-10 rounded-t-md',
            height,
            index === heights.length - 1
              ? 'bg-g-glow shadow-[0_0_30px_4px] shadow-g-glow/50'
              : 'bg-white/15',
          )}
        />
      ))}
    </div>
  );
}

/** The 80/20 split, drawn as light. */
function Split() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-4 px-8 text-left">
      <div className="flex h-3 overflow-hidden rounded-full">
        <span className="w-4/5 bg-g-glow shadow-[0_0_24px_2px] shadow-g-glow/60" />
        <span className="w-1/5 bg-white/20" />
      </div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
        <span className="text-g-amber-1">80% · Developer</span>
        <span className="text-g-night-mute">20% · Deck</span>
      </div>
    </div>
  );
}
