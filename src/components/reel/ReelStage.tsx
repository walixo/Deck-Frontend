import { Hud } from './Hud';
import { EndCard, Rollcall, Wall } from './scenes/Closing';
import { Globe } from './scenes/Globe';
import { Launch } from './scenes/Launch';
import { Midnight } from './scenes/Midnight';
import { Hook, Ignition } from './scenes/Opening';
import { Reveal } from './scenes/Reveal';
import { Route } from './scenes/Route';
import { REEL_DURATION } from './timing';

/** The stage's own coordinate space. Everything in the reel is drawn in it. */
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

interface Cue {
  from: number;
  to: number;
  Scene: (props: { t: number }) => React.ReactElement | null;
}

interface Act {
  chapter: string;
  cues: Cue[];
}

/*
 * The cut, act by act. Timings follow the reference reel beat for beat — same
 * thirty seconds, same scene lengths — so the pacing that makes it work is
 * kept even though every frame is Deck's.
 *
 * Scenes cut hard at their boundaries: a scene exists only while `t` is inside
 * its window, and the next one is simply there. Cross-fades would be
 * atmosphere, and the system has none.
 */
const ACTS: Act[] = [
  {
    chapter: '01 / Cold open',
    cues: [
      { from: 0, to: 1, Scene: Ignition },
      { from: 1, to: 4, Scene: Hook },
    ],
  },
  { chapter: '02 / The mark', cues: [{ from: 4, to: 8, Scene: Reveal }] },
  { chapter: '03 / The launch', cues: [{ from: 8, to: 12, Scene: Launch }] },
  { chapter: '04 / The day', cues: [{ from: 12, to: 15, Scene: Route }] },
  { chapter: '05 / Midnight UTC', cues: [{ from: 15, to: 19, Scene: Midnight }] },
  { chapter: '06 / Get seen', cues: [{ from: 19, to: 23, Scene: Globe }] },
  {
    chapter: '07 / Every category',
    cues: [
      { from: 23, to: 25, Scene: Wall },
      { from: 25, to: 27, Scene: Rollcall },
    ],
  },
  /* Open-ended by a hair so the final frame, t = 30 exactly, still has a
     scene — it is the frame the player rests on. */
  {
    chapter: '08 / onedeck.africa',
    cues: [{ from: 27, to: REEL_DURATION + 0.001, Scene: EndCard }],
  },
];

/**
 * One frame of the reel, at time `t`.
 *
 * Pure: the same `t` always draws the same picture, whatever was drawn before
 * it. The player owns the clock and the scaling; this owns only what is on
 * screen.
 */
export function ReelStage({ t }: { t: number }) {
  const actIndex = Math.max(
    0,
    ACTS.findIndex((act) => act.cues.some((cue) => t >= cue.from && t < cue.to)),
  );

  return (
    <div
      className="relative overflow-hidden bg-canvas text-body"
      style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
    >
      {/* Paper stock, the same flat halftone the site uses behind headers. */}
      <div aria-hidden="true" className="absolute inset-0 bg-halftone text-edge opacity-[0.05]" />

      {ACTS.flatMap((act) =>
        act.cues
          .filter((cue) => t >= cue.from && t < cue.to)
          .map((cue) => <cue.Scene key={cue.from} t={t} />),
      )}

      <Hud t={t} chapter={ACTS[actIndex].chapter} act={actIndex} acts={ACTS.length} />
    </div>
  );
}
