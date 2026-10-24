import { useEffect, useState } from 'react';
import { Wordmark } from '@/components/layout/Wordmark';
import { cn } from '@/lib/utils';

/**
 * Three seconds of light before the arcade opens.
 *
 * On black, Deck's glass app icon surfaces with a rainbow running round its
 * rim, spins down into a bright lens, and the lens refracts out into the
 * wordmark — red, green and blue copies sliding together until they add up to
 * white — with "games" rising underneath. Then the curtain lifts on the page,
 * which has been loading behind it the whole time.
 *
 * Once per visit (session storage), skippable with a click or any key, and
 * never shown to anyone who has asked for reduced motion. Hidden from
 * assistive tech: the page title already says where you are.
 */

const SEEN_KEY = 'deck-games-intro';
const LENGTH_MS = 3400;

/* The "D" from Deck's favicon, on a 32-unit grid. */
const D_MARK =
  'M7 6h9c5 0 9 4 9 9v2c0 5-4 9-9 9H7V6Zm7 7v6h2.6c1.6 0 2.4-.8 2.4-2.4v-1.2c0-1.6-.8-2.4-2.4-2.4H14Z';

function shouldPlay(): boolean {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return sessionStorage.getItem(SEEN_KEY) !== '1';
  } catch {
    return false;
  }
}

export function GamesIntro() {
  const [playing, setPlaying] = useState(shouldPlay);

  useEffect(() => {
    if (!playing) return;
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* Private mode: it simply plays again next time. */
    }
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    const stop = () => setPlaying(false);
    const timer = window.setTimeout(stop, LENGTH_MS);
    window.addEventListener('keydown', stop);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', stop);
      root.style.overflow = previous;
    };
  }, [playing]);

  if (!playing) return null;

  return (
    <div
      aria-hidden="true"
      onClick={() => setPlaying(false)}
      className="fixed inset-0 z-[80] grid animate-[var(--animate-g-intro-out)] cursor-pointer place-items-center overflow-hidden bg-black"
    >
      {/* The icon: glass, with a rainbow running round the rim. */}
      <div className="absolute size-[clamp(8.5rem,22vw,12rem)] animate-[var(--animate-g-intro-icon)] rounded-[28%] p-[5px] opacity-0">
        <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute -inset-1/2 animate-[spin_1.6s_linear_infinite] bg-[conic-gradient(from_0deg,#ff5a5a,#ffd25a,#5affa0,#5ad7ff,#8a5aff,#ff5ad2,#ff5a5a)] blur-[2px]" />
        </div>
        <div className="relative grid size-full place-items-center rounded-[inherit] bg-[radial-gradient(circle_at_30%_25%,#2a2a3a,#07070b_70%)] shadow-[inset_0_0_34px_rgb(170_180_255/0.45),inset_0_0_0_1px_rgb(255_255_255/0.25),0_0_90px_rgb(140_150_255/0.45)]">
          <svg
            viewBox="0 0 32 32"
            className="size-[52%] drop-shadow-[0_0_12px_rgb(255_255_255/0.6)]"
          >
            <path fill="#fff" fillRule="evenodd" d={D_MARK} />
          </svg>
        </div>
      </div>

      {/* The lens it spins down into. */}
      <div className="absolute size-24 animate-[var(--animate-g-intro-lens)] rounded-full bg-[radial-gradient(circle,#fff_0%,rgb(220_225_255/0.85)_22%,transparent_62%)] opacity-0 shadow-[0_0_80px_20px_rgb(150_170_255/0.35)]">
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(#ff5a5a,#ffd25a,#5affa0,#5ad7ff,#8a5aff,#ff5ad2,#ff5a5a)] opacity-50 mix-blend-screen blur-md" />
      </div>

      {/* The wordmark, refracted: three colour copies that add up to white. */}
      <div className="relative flex flex-col items-center">
        <div className="relative h-[clamp(2.75rem,8vw,4.75rem)]">
          {(
            [
              ['text-[#ff2a2a]', '-46px'],
              ['text-[#2aff5a]', '0px'],
              ['text-[#2a5aff]', '46px'],
            ] as const
          ).map(([tone, dx], index) => (
            <span
              key={tone}
              className={cn(
                index === 0 ? 'relative' : 'absolute inset-0',
                'block h-full animate-[var(--animate-g-intro-split)] opacity-0 mix-blend-screen',
                tone,
              )}
              /* `--dx` sets where each copy starts; the keyframe brings it home. */
              style={{ '--dx': dx } as React.CSSProperties}
            >
              <Wordmark className="h-full w-auto" />
            </span>
          ))}
        </div>
        <span className="mt-[0.35em] flex animate-[var(--animate-g-intro-games)] items-center gap-2 text-[clamp(1.6rem,4.2vw,2.6rem)] font-normal tracking-[-0.04em] text-white/75 opacity-0">
          games
          <span className="size-[0.3em] rounded-full bg-g-glow shadow-[0_0_14px_3px] shadow-g-glow/70" />
        </span>
      </div>
    </div>
  );
}
