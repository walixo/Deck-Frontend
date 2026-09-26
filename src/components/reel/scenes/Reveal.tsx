import { Wordmark } from '@/components/layout/Wordmark';
import { WORDMARK_HEIGHT, WORDMARK_WIDTH } from '@/lib/wordmark';
import { Rise, StackingMark } from '../primitives';
import { lerp, snapIn } from '../timing';

const MARK = 190;
const WORD_H = 150;
const WORD_W = (WORD_H * WORDMARK_WIDTH) / WORDMARK_HEIGHT;
const GAP = 44;

/* Where the mark sits alone (centred) and once the wordmark joins it. */
const MARK_ALONE = 960 - MARK / 2;
const MARK_PAIRED = 960 - (MARK + GAP + WORD_W) / 2;

/**
 * The wordmark's tic, borrowed for one beat.
 *
 * On the site the logo flickers into the accent every fifteen seconds (see
 * `Logo`). The reveal does it once, with the same uneven stops — so the first
 * time somebody sees the mark in the film, it behaves the way it will in the
 * header.
 */
function flickering(t: number): boolean {
  return (t >= 6.9 && t < 6.94) || (t >= 6.99 && t < 7.02) || (t >= 7.06 && t < 7.6);
}

/**
 * 4.0–8.0s. The brick plates stack, the wordmark wipes in beside them, and the
 * tagline sets underneath.
 *
 * The reference bursts, then smears its logotype into place. The burst here is
 * the plates themselves landing; the smear is a pop block leading a hard wipe —
 * a moving edge rather than a blur.
 */
export function Reveal({ t }: { t: number }) {
  const slide = snapIn(t, 4.9, 0.45);
  const markX = lerp(MARK_ALONE, MARK_PAIRED, slide);
  const wipe = snapIn(t, 5.05, 0.55);
  const wordX = markX + MARK + GAP;

  return (
    <div className="absolute inset-0">
      {/* Frames opening out behind the mark: the reference's rings, squared. */}
      {[560, 820, 1080].map((size, index) => {
        const open = snapIn(t, 4.0 + index * 0.1, 0.5);
        if (open === 0) return null;
        return (
          <div
            key={size}
            className="absolute left-1/2 top-1/2 rounded-slab border-2 border-edge/15"
            style={{
              width: size,
              height: size * 0.62,
              transform: `translate(-50%, -50%) scale(${lerp(0.55, 1, open)})`,
            }}
          />
        );
      })}

      <div className="absolute text-body" style={{ left: markX, top: 540 - MARK / 2 - 60 }}>
        <StackingMark t={t} start={4.0} size={MARK} />
      </div>

      {t >= 5.05 && (
        <div
          className={flickering(t) ? 'absolute text-accent' : 'absolute text-body'}
          style={{
            left: wordX,
            top: 540 - WORD_H / 2 - 60,
            width: WORD_W,
            clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
          }}
        >
          <Wordmark className="h-[150px] w-auto" />
        </div>
      )}

      {/* The wipe's leading edge. */}
      {wipe > 0 && wipe < 1 && (
        <div
          className="absolute w-5 border-2 border-on-pop bg-pop"
          style={{
            left: wordX + wipe * WORD_W - 10,
            top: 540 - WORD_H / 2 - 76,
            height: WORD_H + 32,
          }}
        />
      )}

      <div className="absolute inset-x-0 top-[636px] text-center font-sans text-[44px] text-muted">
        <Rise progress={snapIn(t, 5.9, 0.4)}>
          Launch, share and <strong className="font-semibold text-body">discover new tech</strong>
          <span className="text-accent">.</span>
        </Rise>
      </div>
    </div>
  );
}
