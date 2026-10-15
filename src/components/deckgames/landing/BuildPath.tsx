import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion, useScrollProgress } from '../motion';

/**
 * A developer's road from sign-up to payout, drawn in light as you scroll.
 *
 * The video's glowing life-line, re-pointed at the people who make the games.
 * Always set at night, whatever the theme — the curve is light, and light
 * needs the dark. Steps are numbered rather than dated: how long review takes
 * depends on the game, and a date here would be a promise.
 *
 * The SVG stretches to the stage (`preserveAspectRatio="none"`) with
 * non-scaling strokes, so the line keeps its weight at any size, and each
 * stop is placed by asking the path itself where that fraction of its length
 * falls — which is why the labels always sit on the line.
 */
const W = 1000;
const H = 600;
const PATH = 'M -40 560 C 160 560 260 110 470 290 S 760 560 860 300 S 960 40 1060 40';

const STOPS = [
  {
    at: 0.1,
    step: '01',
    title: 'Sign up',
    points: ['Your Deck account', 'Free, nothing to review yet'],
  },
  {
    at: 0.26,
    step: '02',
    title: 'Build in test mode',
    points: ['One script tag', 'Test purchases cost nothing'],
  },
  { at: 0.43, step: '03', title: 'Send it for review', points: ['Portrait, landscape or both'] },
  { at: 0.6, step: '04', title: 'Live in the arcade', points: ['Live keys switch on'] },
  { at: 0.76, step: '05', title: 'Your first sale', points: ['80% of every purchase is yours'] },
  {
    at: 0.92,
    step: '06',
    title: 'Paid out',
    points: ['To your own Bachs account', 'After a 14-day hold'],
  },
];

export function BuildPath() {
  const [sectionRef, progress] = useScrollProgress<HTMLElement>();
  const reduced = useReducedMotion();
  const pathRef = useRef<SVGPathElement>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [head, setHead] = useState<{ x: number; y: number } | null>(null);

  const drawn = reduced ? 1 : Math.min(1, progress * 1.08);

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    setPoints(
      STOPS.map((stop) => {
        const point = path.getPointAtLength(length * stop.at);
        return { x: point.x, y: point.y };
      }),
    );
  }, []);

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const point = path.getPointAtLength(path.getTotalLength() * drawn);
    setHead({ x: point.x, y: point.y });
  }, [drawn]);

  const flare = reduced ? 0.6 : Math.min(1, progress * 2);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="path-title"
      className="relative h-[320vh] bg-g-night text-g-night-ink"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Light leaking in at the edges. */}
        <div
          aria-hidden="true"
          className="absolute -left-[20vw] top-1/4 size-[50vw] rounded-full bg-[radial-gradient(circle,rgb(247_165_49/0.55),transparent_65%)] blur-3xl"
          style={{ opacity: flare * 0.7 }}
        />
        <div
          aria-hidden="true"
          className="absolute -right-[22vw] bottom-0 size-[55vw] rounded-full bg-[radial-gradient(circle,rgb(255_106_61/0.45),transparent_65%)] blur-3xl"
          style={{ opacity: flare * 0.6 }}
        />

        <h2
          id="path-title"
          className="relative z-10 mx-auto max-w-2xl px-6 pt-20 text-center text-[clamp(2rem,4.6vw,3.75rem)] font-medium leading-[1] tracking-[-0.05em] text-balance sm:pt-24"
        >
          Unlock everything your game can earn
        </h2>

        <div className="absolute inset-x-0 bottom-0 top-[30%] sm:top-[26%]">
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
          >
            <defs>
              <filter id="path-glow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>
            {/* Ghost of the whole road, so you can see where it goes. */}
            <path
              d={PATH}
              fill="none"
              stroke="rgb(255 255 255 / 0.08)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            {/* Glow, then the line itself. */}
            <path
              d={PATH}
              fill="none"
              stroke="#ff6a3d"
              strokeWidth="10"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - drawn}
              filter="url(#path-glow)"
              opacity="0.8"
              vectorEffect="non-scaling-stroke"
            />
            <path
              ref={pathRef}
              d={PATH}
              fill="none"
              stroke="url(#path-ink)"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - drawn}
              vectorEffect="non-scaling-stroke"
            />
            <linearGradient id="path-ink" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.55" stopColor="#ffd27a" />
              <stop offset="1" stopColor="#ff6a3d" />
            </linearGradient>
          </svg>

          {head && drawn > 0.01 && drawn < 0.999 && (
            <span
              aria-hidden="true"
              className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_20px_6px] shadow-g-glow"
              style={{ left: `${(head.x / W) * 100}%`, top: `${(head.y / H) * 100}%` }}
            />
          )}

          <ol>
            {STOPS.map((stop, index) => {
              const point = points[index];
              const reached = drawn >= stop.at;
              if (!point) return null;
              const right = point.x < W * 0.62;
              return (
                <li
                  key={stop.step}
                  className={cn(
                    'absolute transition-[opacity,transform] duration-700 ease-glide',
                    reached ? 'opacity-100' : 'translate-y-2 opacity-0',
                  )}
                  style={{ left: `${(point.x / W) * 100}%`, top: `${(point.y / H) * 100}%` }}
                >
                  <span className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-g-glow shadow-[0_0_12px_3px] shadow-g-glow/70" />
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-16 w-px -translate-y-full bg-white/15"
                  />
                  <div
                    className={cn(
                      'absolute bottom-6 w-40 sm:w-52',
                      right ? 'left-3' : 'right-3 text-right',
                    )}
                  >
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-g-glow">
                      ⌗ Step {stop.step}
                    </p>
                    <p className="mt-1 text-[13px] font-medium tracking-[-0.02em] sm:text-sm">
                      {stop.title}
                    </p>
                    <ul className="mt-1 hidden space-y-0.5 sm:block">
                      {stop.points.map((point) => (
                        <li key={point} className="text-[11px] text-g-night-mute">
                          › {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
