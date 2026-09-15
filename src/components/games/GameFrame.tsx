import type { ReactNode, RefObject } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * The furniture every game in the arcade shares.
 *
 * Three games had the same HUD row, the same canvas box, the same
 * press-to-start overlay and the same mute button, and keeping three copies in
 * step is how two of them quietly end up different. The games keep their own
 * loops and their own state; this owns the chrome around them.
 */

export type GamePhase = 'idle' | 'playing' | 'over';

export interface Readout {
  label: string;
  value: string;
}

interface GameFrameProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  phase: GamePhase;
  readouts: Readout[];
  /** Right-hand HUD slot: lives, length, whatever the game counts. */
  status?: Readout;
  /**
   * Aspect for the play area, as `"w/h"`.
   *
   * Applied as an inline style, not a class. `aspect-[${aspect}]` looks like it
   * works and does not: Tailwind generates utilities by scanning source text,
   * so a class assembled at runtime is never in the stylesheet. The canvas
   * silently fell back to its intrinsic 300x150 — every game the same shape,
   * and `fitCanvas` sizing a board nobody could see.
   */
  aspect: string;
  title: string;
  idleBlurb: string;
  overTitle: string;
  overBlurb: ReactNode;
  hint: string;
  onStart: () => void;
  muted: boolean;
  onToggleMute: () => void;
  /**
   * Rendered beside the board on a wide screen, under it on a narrow one.
   *
   * The leaderboard lives here rather than after the frame because "board on
   * the left, scores on the right" is a layout decision, and four games each
   * expressing it themselves is four chances to disagree.
   */
  aside?: ReactNode;
  /** Painted behind the canvas — each game brings its own ground colour. */
  boardClassName?: string;
  /**
   * Overlay backdrop. Sets the text colour too — a board with its own palette
   * (Snake's green LCD) must be able to put readable ink on its own scrim
   * rather than inheriting a theme colour that may sit on top of it at 2:1.
   */
  scrimClassName?: string;
}

export function GameFrame({
  canvasRef,
  phase,
  readouts,
  status,
  aspect,
  title,
  idleBlurb,
  overTitle,
  overBlurb,
  hint,
  onStart,
  muted,
  onToggleMute,
  aside,
  boardClassName = 'bg-surface-2',
  scrimClassName = 'bg-canvas/85 text-body',
}: GameFrameProps) {
  return (
    /*
     * Board and scores side by side from xl, stacked below it.
     *
     * `items-start` so the scores sit at the top of their column rather than
     * stretching to the board's height — a ten-row list centred against a
     * 420px board leaves a gap above it that reads as a mistake.
     */
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {readouts.map((readout) => (
              <Readout key={readout.label} {...readout} />
            ))}
          </div>
          <div className="flex items-center gap-4">
            {status && <Readout {...status} />}
            <button
              type="button"
              onClick={onToggleMute}
              aria-pressed={muted}
              /* Labelled rather than iconographic: a crossed-out speaker is the
               one control everybody has to click twice to understand. */
              aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
              className="border border-edge bg-surface px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-colors hover:bg-surface-2"
            >
              {muted ? 'Sound off' : 'Sound on'}
            </button>
          </div>
        </div>

        <div
          className={cn(
            'relative overflow-hidden rounded-slab border border-edge shadow-hard',
            boardClassName,
          )}
        >
          <canvas
            ref={canvasRef}
            className="block w-full touch-none"
            style={{ imageRendering: 'pixelated', aspectRatio: aspect.replace('/', ' / ') }}
            aria-label={`${title}. ${idleBlurb}`}
            role="img"
          />

          {phase !== 'playing' && (
            <div
              className={cn(
                'absolute inset-0 grid place-items-center p-6 text-center',
                scrimClassName,
              )}
            >
              <div>
                <h3 className="display-tight text-2xl uppercase sm:text-3xl">
                  {phase === 'over' ? overTitle : title}
                </h3>
                {/* Inherits from the scrim rather than naming a theme colour, so
                  a custom board's ink carries through. */}
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed opacity-80 text-pretty">
                  {phase === 'over' ? overBlurb : idleBlurb}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Button onClick={onStart}>{phase === 'over' ? 'Play again' : 'Start'}</Button>
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                    or press space
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">{hint}</p>
      </div>

      {aside}
    </div>
  );
}

function Readout({ label, value }: Readout) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
        {label}
      </span>
      <span className="font-display text-lg tabular-nums">{value}</span>
    </div>
  );
}
