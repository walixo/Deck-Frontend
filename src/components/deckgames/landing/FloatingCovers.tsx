import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { GameSummary } from '@/types';
import { CoverArt } from '../CoverArt';
import { useReducedMotion, useScrollProgress } from '../motion';

/**
 * Covers hanging in the air around a headline, turning slowly as you pass.
 *
 * The video's scattered, tilted tiles. Real games where there are games; where
 * there are not yet enough, plain warm cards without a title — never invented
 * games with invented names.
 */
const SLOTS = [
  'left-[4%] top-[6%] w-[30%] sm:w-[19%] aspect-[4/5] [--g-tilt:-9deg]',
  'left-[38%] top-[0%] w-[18%] sm:w-[11%] aspect-[3/4] [--g-tilt:5deg] [animation-delay:-2s]',
  'right-[4%] top-[8%] w-[34%] sm:w-[22%] aspect-[16/10] [--g-tilt:12deg] [animation-delay:-4s]',
  'left-[10%] bottom-[8%] w-[16%] sm:w-[10%] aspect-square [--g-tilt:6deg] [animation-delay:-6s] hidden sm:block',
  'right-[10%] bottom-[4%] w-[26%] sm:w-[14%] aspect-[3/4] [--g-tilt:-7deg] [animation-delay:-3s]',
  'left-[30%] bottom-[0%] w-[20%] sm:w-[12%] aspect-[4/3] [--g-tilt:-4deg] [animation-delay:-5s] hidden sm:block',
];

export function FloatingCovers({ games }: { games: GameSummary[] }) {
  const [ref, progress] = useScrollProgress<HTMLElement>();
  const reduced = useReducedMotion();

  return (
    <section
      ref={ref}
      aria-labelledby="covers-title"
      className="relative h-[150vh] bg-g-paper [perspective:1200px]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {SLOTS.map((slot, index) => {
          const game = games[index];
          /* Each card rises at its own rate — near ones faster than far. */
          const lift = reduced ? 0 : (progress - 0.5) * (80 + index * 30);
          return (
            <div
              key={slot}
              aria-hidden="true"
              className={cn('absolute', slot)}
              style={{ transform: `translateY(${-lift}px)` }}
            >
              <div className="size-full animate-g-drift overflow-hidden rounded-2xl shadow-[0_30px_60px_-24px_rgb(0_0_0/0.45)] [transform:rotateX(12deg)]">
                {game ? (
                  <CoverArt game={game} />
                ) : (
                  <CoverArt
                    game={{
                      slug: `slot-${index}`,
                      title: '',
                      coverUrl: '',
                      kind: 'external',
                      component: null,
                    }}
                    showTitle={false}
                  />
                )}
              </div>
            </div>
          );
        })}

        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          <div className="max-w-md rounded-3xl bg-g-paper/60 px-6 py-8 backdrop-blur-sm">
            <h2
              id="covers-title"
              className="text-[clamp(2rem,4.4vw,3.5rem)] font-medium leading-[1] tracking-[-0.05em] text-balance"
            >
              Every game, one tap away
            </h2>
            <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-g-mute">
              New games arrive every week, and a person reviews each one before it reaches you.
            </p>
            <Link
              to="/games#library"
              className="mt-6 inline-block font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-g-ember-ink underline-offset-[6px] hover:underline"
            >
              Browse the library ↓
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
