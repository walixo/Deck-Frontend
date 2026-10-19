import { useRef, useState } from 'react';
import { useReducedMotion } from '@/components/deckgames/motion';
import { cn } from '@/lib/utils';
import type { GameIdentity } from '@/types';
import { GameIdMark } from './GameIdMark';

/**
 * A player's GameID as a pane of frosted glass floating over coloured light.
 *
 * Glassmorphism only reads when there is something behind the glass to blur,
 * so the card comes with its own stage: soft orbs of ember, amber, violet and
 * teal drifting slowly underneath. The orbs are saturated enough that white
 * type on the glass holds up on the light page and the dark one alike — the
 * card brings its own background, like every other block in the system.
 *
 * It leans gently toward the pointer, and sits still for anyone who has asked
 * for reduced motion.
 */
export function GameIdCard({
  identity,
  className,
}: {
  identity: GameIdentity;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = (event: React.PointerEvent) => {
    if (reduced || event.pointerType !== 'mouse') return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 12 });
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      className={cn('relative isolate w-full [perspective:1200px]', className)}
    >
      {/* The light behind the glass. */}
      <div aria-hidden="true" className="pointer-events-none absolute -inset-[18%] -z-10">
        <span className="absolute left-[2%] top-[8%] size-[58%] animate-g-drift rounded-full bg-[#e8501f] opacity-95 blur-3xl [--g-tilt:0deg]" />
        <span className="absolute right-[0%] top-[0%] size-[52%] animate-g-drift rounded-full bg-[#e08a10] opacity-85 blur-3xl [--g-tilt:0deg] [animation-delay:-3s]" />
        <span className="absolute bottom-[0%] right-[14%] size-[50%] animate-g-drift rounded-full bg-[#6a44f0] opacity-90 blur-3xl [--g-tilt:0deg] [animation-delay:-6s]" />
        <span className="absolute bottom-[10%] left-[18%] size-[34%] animate-g-drift rounded-full bg-[#139e90] opacity-75 blur-3xl [--g-tilt:0deg] [animation-delay:-4.5s]" />
      </div>

      <div
        className="relative aspect-[1.586] w-full overflow-hidden rounded-[30px] border border-white/30 bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.55),inset_0_-1px_0_rgb(255_255_255/0.08),0_40px_90px_-30px_rgb(20_8_40/0.55)] backdrop-blur-2xl backdrop-saturate-150 transition-transform duration-500 ease-glide will-change-transform"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        {/* Sheen across the glass, and a little shade at the foot so the
            name always has something to stand on. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgb(255_255_255/0.38)_0%,rgb(255_255_255/0.08)_32%,transparent_55%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(170deg,rgb(24_10_36/0.06)_0%,rgb(24_10_36/0.22)_55%,rgb(16_6_26/0.42)_100%)]"
        />

        <div className="relative flex h-full flex-col justify-between p-[7%]">
          <div className="flex items-start justify-between">
            <span className="flex items-center gap-2.5">
              <GameIdMark className="size-[clamp(1.5rem,4vw,2rem)] drop-shadow-[0_1px_6px_rgb(0_0_0/0.25)]" />
              <span className="text-[clamp(1rem,2.6vw,1.35rem)] font-semibold tracking-[-0.045em] [text-shadow:0_1px_10px_rgb(0_0_0/0.18)]">
                GameID
              </span>
            </span>
            <span className="rounded-full border border-white/25 bg-black/20 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white backdrop-blur">
              Deck
            </span>
          </div>

          {/* A card chip, drawn — it reads as "something you carry". Hidden on a
              phone, where the card is too short to fit it above the handle. */}
          <span
            aria-hidden="true"
            className="absolute left-[7%] top-[34%] hidden h-[14%] w-[11%] sm:block rounded-[22%] border border-white/40 bg-[linear-gradient(135deg,rgb(255_255_255/0.55),rgb(255_255_255/0.15))] shadow-[inset_0_1px_0_rgb(255_255_255/0.6)]"
          >
            <span className="absolute inset-x-0 top-1/3 h-px bg-white/45" />
            <span className="absolute inset-x-0 top-2/3 h-px bg-white/45" />
            <span className="absolute inset-y-0 left-1/2 w-px bg-white/45" />
          </span>

          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-[clamp(1.6rem,5.5vw,2.6rem)] font-medium leading-none tracking-[-0.055em] [text-shadow:0_2px_16px_rgb(0_0_0/0.22)]">
                @{identity.handle}
              </p>
              <p className="mt-2 truncate text-[clamp(0.8rem,2vw,0.95rem)] text-white/90 [text-shadow:0_1px_8px_rgb(0_0_0/0.3)]">
                {identity.displayName}
              </p>
              <p className="mt-3 font-mono text-[clamp(0.7rem,1.8vw,0.85rem)] tracking-[0.22em] text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.3)]">
                {identity.code}
              </p>
            </div>
            <span className="grid size-[clamp(3.25rem,10vw,4.75rem)] shrink-0 place-items-center overflow-hidden rounded-[22px] border border-white/35 bg-white/15 shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] backdrop-blur">
              {identity.avatarUrl ? (
                <img src={identity.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="font-mono text-base uppercase">
                  {identity.displayName.slice(0, 2)}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
