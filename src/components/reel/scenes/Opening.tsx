import { cn } from '@/lib/utils';
import { Ghost, Mono, Rise, Stop } from '../primitives';
import { lerp, snap, snapIn, span } from '../timing';

/**
 * 0.0–1.0s. A pop bar streaks across the frame and the film begins.
 *
 * The reference opens on a light streak; a streak of light is atmosphere, and
 * brutalism has none, so here it is a solid block with a hard border — the same
 * object as a primary button, travelling.
 */
export function Ignition({ t }: { t: number }) {
  const travel = snap(span(t, 0.08, 0.8));
  const x = lerp(-520, 1920, travel);

  return (
    <div className="absolute inset-0">
      {/* The trail it leaves: a hairline, cut rather than faded at the end. */}
      <div
        className="absolute top-[539px] h-[2px] bg-edge/25"
        style={{ left: 0, width: Math.max(0, x) }}
      />
      <div
        className="absolute top-[532px] h-4 w-[520px] border-2 border-on-pop bg-pop"
        style={{ transform: `translateX(${x}px)` }}
      />
    </div>
  );
}

/*
 * The hook's lines. In the reference, one phrase lands in three languages and
 * resolves into the tagline; here the categories take turns — each one a real
 * category on the board — and resolve into the hero's own line.
 */
const CYCLE = [
  { from: 1.0, to: 1.75, line: 'AI tools', ghost: 'AI', key: 'ai-tool', of: '1 / 4' },
  { from: 1.75, to: 2.5, line: 'Mobile apps', ghost: 'App', key: 'mobile-app', of: '2 / 4' },
  { from: 2.5, to: 3.1, line: 'Claude skills', ghost: 'Skill', key: 'claude-skill', of: '3 / 4' },
];

/**
 * 1.0–4.0s. "AI tools. Mobile apps. Claude skills." — then "New tech. First
 * fans."
 *
 * Each line cuts hard to the next, the way the reference does: a new word
 * rises into place while the old one is simply gone. The rules and labels that
 * frame the text draw once and stay, so the frame is steady while the words
 * change inside it.
 */
export function Hook({ t }: { t: number }) {
  const rules = snapIn(t, 1.0, 0.3);
  const current = CYCLE.find((beat) => t >= beat.from && t < beat.to);
  const resolved = t >= 3.1;

  return (
    <div className="absolute inset-0">
      {current && (
        <Ghost
          word={current.ghost}
          t={t}
          start={current.from}
          end={current.to}
          className="left-1/2 top-1/2 -ml-[330px] -mt-[270px] text-[520px]"
        />
      )}
      {resolved && (
        <Ghost
          word="Deck"
          t={t}
          start={3.1}
          end={4.0}
          className="left-1/2 top-1/2 -ml-[640px] -mt-[270px] text-[520px]"
        />
      )}

      {/* Top rule and its labels. */}
      <div
        className="absolute left-1/2 top-[352px] h-[2px] -translate-x-1/2 bg-edge/40"
        style={{ width: rules * 1240 }}
      />
      <div
        className={cn(
          'absolute left-[340px] right-[340px] top-[322px] flex justify-between',
          rules < 1 && 'invisible',
        )}
      >
        <Mono className="text-[14px]">Category · {resolved ? 'all of them' : current?.key}</Mono>
        <Mono className="text-[14px]">Board · today</Mono>
      </div>

      <div className="absolute inset-x-0 top-[390px] text-center">
        {current && (
          <Rise
            key={current.line}
            progress={snapIn(t, current.from, 0.24)}
            className="display-tight font-display text-[150px] uppercase text-body"
          >
            {current.line}
            <Stop />
          </Rise>
        )}

        {resolved && (
          <div className="display-tight font-display text-[132px] uppercase text-body">
            <Rise progress={snapIn(t, 3.1, 0.26)}>
              New tech
              <Stop />
            </Rise>
            {/* The hero's device: the payoff phrase on a solid deep block, text
                in the block's partner colour so it holds in both themes. */}
            <Rise progress={snapIn(t, 3.3, 0.26)} className="mt-2">
              <span className="inline-block border-[3px] border-edge bg-deep px-6 text-on-deep shadow-hard-lg">
                First fans.
              </span>
            </Rise>
          </div>
        )}
      </div>

      {/* Bottom rule. */}
      <div
        className="absolute left-1/2 top-[748px] h-[2px] -translate-x-1/2 bg-edge/40"
        style={{ width: rules * 1240 }}
      />
      <div
        className={cn(
          'absolute left-[340px] right-[340px] top-[766px] flex justify-between',
          rules < 1 && 'invisible',
        )}
      >
        <Mono className="flex items-center gap-2 text-[14px]">
          <span className="size-2.5 bg-accent" />
          One board · every kind of launch
        </Mono>
        <Mono className="text-[14px]">{resolved ? '4 / 4' : current?.of}</Mono>
      </div>
    </div>
  );
}
