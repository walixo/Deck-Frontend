import { Wordmark } from '@/components/layout/Wordmark';
import { cn } from '@/lib/utils';
import { WORDMARK_HEIGHT, WORDMARK_WIDTH } from '@/lib/wordmark';
import { Ghost, Mono, Rise, StackingMark, Stop } from '../primitives';
import { kickIn, lerp, snapIn } from '../timing';

/*
 * The board's categories, as seeded. The wall names only things a launch can
 * actually be filed under; one that is retired in the admin area would still be
 * listed here until somebody edits this, which is an acceptable lag for a film.
 */
const CATEGORIES = [
  'AI Models',
  'AI Tools',
  'Claude Skills',
  'Developer Tools',
  'Security & Privacy',
  'Mobile Apps',
  'Websites',
  'Hardware',
];

const ROWS = 7;
const ROW_H = 116;
const SPEED = 170;

/* Which word is lifted onto the pop block, and when. Deterministic, like
   everything else in the reel — the same word every playthrough. */
const HOPS = [
  { at: 23.12, row: 2, item: 4 },
  { at: 23.58, row: 0, item: 6 },
  { at: 24.04, row: 4, item: 3 },
  { at: 24.5, row: 1, item: 5 },
];

/**
 * 23.0–25.0s. Every category, in rows running opposite ways, one word at a
 * time stamped onto a pop block.
 *
 * The reference's wall of one verb in eight languages. The pace matters more
 * than the words: two seconds of the frame being *full* is the breath between
 * the explaining and the closing.
 */
export function Wall({ t }: { t: number }) {
  const hop = [...HOPS].reverse().find((entry) => t >= entry.at);
  const enter = snapIn(t, 23.0, 0.35);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: ROWS }, (_, row) => {
        const direction = row % 2 === 0 ? -1 : 1;
        const x = -420 - row * 140 + direction * (SPEED * (t - 23) + (1 - enter) * 360);
        const words = Array.from(
          { length: 24 },
          (_, index) => CATEGORIES[(index + row * 3) % CATEGORIES.length],
        );

        return (
          <div
            key={row}
            className="absolute left-0 flex w-max items-center gap-14 whitespace-nowrap"
            style={{ top: 132 + row * ROW_H, height: ROW_H, transform: `translateX(${x}px)` }}
          >
            {words.map((word, index) => {
              const lifted = hop && hop.row === row && hop.item === index;
              return (
                <span
                  key={index}
                  className={cn(
                    'shrink-0 font-display text-[72px] uppercase leading-none',
                    lifted
                      ? 'border-[3px] border-edge bg-pop px-5 py-2 text-on-pop shadow-hard-lg'
                      : 'text-muted/70',
                  )}
                  style={
                    lifted
                      ? {
                          transform: `scale(${lerp(0.85, 1, kickIn(t, hop.at, 0.28))}) rotate(-1.5deg)`,
                        }
                      : undefined
                  }
                >
                  {word}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const ROLL = [
  { from: 25.0, to: 26.0, word: 'AI tool', note: 'AI models · AI tools · Claude skills' },
  { from: 26.0, to: 27.01, word: 'Mobile app', note: 'Mobile apps · websites · hardware' },
];

/**
 * 25.0–27.0s. "Launch your AI tool. Launch your mobile app."
 *
 * The reference's "Translate from your terminal / AI assistant": a fixed lead
 * line, and the object of it swapped on the beat underneath — the old word
 * lifting out as the new one rises in, so the line is never empty.
 */
export function Rollcall({ t }: { t: number }) {
  return (
    <div className="absolute inset-0">
      <Ghost
        word="Launch"
        t={t}
        start={25}
        end={27}
        className="left-[40px] top-[250px] text-[430px]"
      />

      <div className="absolute left-[150px] top-[290px] font-sans text-[50px] text-body">
        <Rise progress={snapIn(t, 25.0, 0.3)}>Launch your</Rise>
      </div>

      <div className="absolute left-[150px] top-[370px] h-[220px] w-[1640px]">
        {ROLL.map((entry, index) => {
          const next = ROLL[index + 1];
          const out = next ? snapIn(t, next.from, 0.24) : 0;
          if (t < entry.from || out >= 1) return null;
          return (
            <div
              key={entry.word}
              className="absolute inset-x-0 top-0 font-display text-[200px] uppercase leading-none text-body display-tight"
            >
              <Rise progress={snapIn(t, entry.from + (index === 0 ? 0.08 : 0), 0.26)} out={out}>
                {entry.word}
                <Stop />
              </Rise>
            </div>
          );
        })}
      </div>

      <div className="absolute left-[150px] top-[620px] flex items-center gap-4">
        <span className="h-[2px] w-12 bg-edge/50" />
        {ROLL.map((entry) =>
          t >= entry.from && t < entry.to ? (
            <Mono key={entry.note} className="text-[18px] text-body">
              {entry.note}
            </Mono>
          ) : null,
        )}
      </div>
    </div>
  );
}

const MARK = 150;
const WORD_H = 104;
const WORD_W = (WORD_H * WORDMARK_WIDTH) / WORDMARK_HEIGHT;

/**
 * 27.0–30.0s. The mark stacks, the wordmark sets under it, then the line, the
 * address and the small print.
 *
 * The frame the film rests on when it ends, so it has to work as a still: it
 * is the one scene a visitor might look at for longer than it plays, and the
 * one a reduced-motion visitor sees instead of the film.
 */
export function EndCard({ t }: { t: number }) {
  const cross = snapIn(t, 27.0, 0.45);
  const pill = kickIn(t, 28.9, 0.3);

  return (
    <div className="absolute inset-0">
      <div
        className="absolute left-1/2 top-[534px] h-[2px] -translate-x-1/2 bg-edge/10"
        style={{ width: cross * 1920 }}
      />
      <div
        className="absolute left-1/2 top-0 w-[2px] -translate-x-1/2 bg-edge/10"
        style={{ height: cross * 1080 }}
      />

      <div className="absolute text-body" style={{ left: 960 - MARK / 2, top: 196 }}>
        <StackingMark t={t} start={27.05} size={MARK} />
      </div>

      <div
        className="absolute text-body"
        style={{ left: 960 - WORD_W / 2, top: 398, width: WORD_W }}
      >
        <Rise progress={snapIn(t, 27.7, 0.32)}>
          <Wordmark className="h-[104px] w-auto" />
        </Rise>
      </div>

      <div className="absolute inset-x-0 top-[566px] text-center font-sans text-[44px] text-body">
        <Rise progress={snapIn(t, 28.35, 0.32)}>
          Where new tech gets its{' '}
          <span className="border-[3px] border-edge bg-deep px-3 text-on-deep">first fans</span>
          <Stop />
        </Rise>
      </div>

      {pill > 0 && (
        <div className="absolute inset-x-0 top-[690px] flex justify-center">
          <span
            className="border-[3px] border-edge bg-pop px-7 py-3 font-mono text-[30px] font-bold tracking-[0.04em] text-on-pop shadow-hard"
            style={{ transform: `scale(${lerp(0.5, 1, pill)})` }}
          >
            onedeck.africa ↗
          </span>
        </div>
      )}

      <div className={cn('absolute inset-x-0 top-[820px] text-center', t < 29.2 && 'invisible')}>
        <Mono className="text-[15px]">New board every midnight UTC · one vote per launch</Mono>
      </div>
    </div>
  );
}
