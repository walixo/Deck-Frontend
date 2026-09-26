import { cn } from '@/lib/utils';
import { Mono } from './primitives';
import { REEL_DURATION, snapIn, timecode } from './timing';

/*
 * The frame around the film: corner brackets, a slate top left, a running
 * timecode top right, and a tick rule along the bottom with a playhead.
 *
 * It is the reference cut's most recognisable device, and it earns its place
 * for a reason beyond looks — it says "this is a piece of film" before a single
 * word has landed, which is what licenses a landing page to play thirty
 * seconds of motion at somebody.
 *
 * Decorative to assistive technology (the stage is `aria-hidden`); the player
 * has the real controls and the real time readout.
 */

const TICKS = 61;
const RULE_WIDTH = 760;

interface HudProps {
  t: number;
  /** "03 / The launch" — which act is on screen. */
  chapter: string;
  /** Zero-based act index, lighting that many slate pips. */
  act: number;
  acts: number;
}

export function Hud({ t, chapter, act, acts }: HudProps) {
  /* Snaps in as the opening streak passes, then stays for the whole film. */
  const shown = snapIn(t, 0.55, 0.3);
  const inset = 30 + (1 - shown) * 24;
  const played = t / REEL_DURATION;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {shown > 0 && (
        <>
          <Bracket style={{ left: inset, top: inset }} />
          <Bracket className="rotate-90" style={{ right: inset, top: inset }} />
          <Bracket className="rotate-180" style={{ right: inset, bottom: inset }} />
          <Bracket className="-rotate-90" style={{ left: inset, bottom: inset }} />

          <div className="absolute left-[72px] top-[62px] flex flex-col gap-2">
            <Mono className="text-body">Launch reel ’26</Mono>
            <Mono className="text-[14px]">Deck · new tech, first fans</Mono>
            <div className="mt-1 flex gap-1.5">
              {Array.from({ length: acts }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    'size-2.5 border border-edge',
                    index <= act ? 'bg-accent' : 'bg-transparent',
                  )}
                />
              ))}
            </div>
          </div>

          <div className="absolute right-[72px] top-[62px] flex flex-col items-end gap-2">
            <Mono className="tabular-nums text-body">{timecode(t)}</Mono>
            <Mono className="text-[14px]">30 sec · 1920×1080 · UTC</Mono>
          </div>

          <Mono className="absolute bottom-[58px] left-[72px] text-[14px] text-body">
            {chapter}
          </Mono>

          <div
            className="absolute bottom-[62px] left-1/2 flex h-5 -translate-x-1/2 items-end justify-between"
            style={{ width: RULE_WIDTH }}
          >
            {Array.from({ length: TICKS }, (_, index) => {
              const at = index / (TICKS - 1);
              const major = index % 10 === 0;
              return (
                <span
                  key={index}
                  className={cn('w-[2px]', at <= played ? 'bg-accent' : 'bg-edge/30')}
                  style={{ height: major ? 16 : 8 }}
                />
              );
            })}
            {/* The playhead: a pop block with its partner border, fixed in both
                themes like every block (CONTRACT rule 3). */}
            <span
              className="absolute -top-2 size-3.5 -translate-x-1/2 border-2 border-on-pop bg-pop"
              style={{ left: `${played * 100}%` }}
            />
          </div>

          <Mono className="absolute bottom-[58px] right-[72px] text-[14px] text-body">
            onedeck.africa
          </Mono>
        </>
      )}
    </div>
  );
}

function Bracket({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={cn('absolute size-9 border-l-[3px] border-t-[3px] border-edge', className)}
      style={style}
    />
  );
}
