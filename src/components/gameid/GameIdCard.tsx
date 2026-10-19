import { cn } from '@/lib/utils';
import type { GameIdentity } from '@/types';
import { GameIdMark } from './GameIdMark';

/**
 * A player's GameID, drawn as the card it is: something you carry from game to
 * game. Set at night in both themes — it is an object with its own light, like
 * the arcade's developer road, not a surface that follows the page.
 */
export function GameIdCard({
  identity,
  className,
}: {
  identity: GameIdentity;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative isolate aspect-[1.586] w-full max-w-sm overflow-hidden rounded-[22px] bg-g-night p-5 text-g-night-ink shadow-[0_40px_80px_-30px_rgb(0_0_0/0.55)] sm:p-6',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-20 -z-10 size-64 rounded-full bg-[radial-gradient(circle,rgb(247_165_49/0.55),transparent_65%)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -left-10 -z-10 size-56 rounded-full bg-[radial-gradient(circle,rgb(255_106_61/0.35),transparent_65%)] blur-2xl"
      />

      <div className="flex items-start justify-between">
        <span className="flex items-center gap-2">
          <GameIdMark className="size-6 text-g-glow" />
          <span className="text-[15px] font-semibold tracking-[-0.04em]">GameID</span>
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-g-night-mute">
          Deck
        </span>
      </div>

      <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 sm:inset-x-6 sm:bottom-6">
        <div className="min-w-0">
          <p className="truncate text-[clamp(1.25rem,5vw,1.6rem)] font-medium leading-none tracking-[-0.045em]">
            @{identity.handle}
          </p>
          <p className="mt-1.5 truncate text-[13px] text-g-night-mute">{identity.displayName}</p>
          <p className="mt-3 font-mono text-[11px] tracking-[0.18em] text-g-amber-1">
            {identity.code}
          </p>
        </div>
        <span className="size-14 shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15">
          {identity.avatarUrl ? (
            <img src={identity.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center font-mono text-sm uppercase">
              {identity.displayName.slice(0, 2)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
