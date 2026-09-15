import { HeroAvatar } from '@/components/home/HeroAvatar';
import { PixelSky } from '@/components/home/PixelSky';
import { Backdrop } from '@/components/ui/Ambient';
import { ButtonLink } from '@/components/ui/Button';
import { formatNumber } from '@/lib/utils';
import type { PlatformStats } from '@/types';

interface HeroProps {
  stats?: PlatformStats;
}

/*
 * The launch/maker/vote tiles are parked, not deleted — flip this back to true
 * to bring them home. Typed as `boolean` rather than left to infer `false` so
 * the branch below stays live code to the compiler.
 */
const SHOW_STATS: boolean = false;

/* The mascots, parked the same way. `HeroAvatar` keeps its whole implementation
   — the rAF loop, the drag handling, the sphere-projected eyes — so bringing
   them back is this one flag, not a rebuild. */
const SHOW_MASCOTS: boolean = false;

/** The headline, minus the highlighted phrase, which animates separately. */
const HEADLINE = ['Where', 'new', 'tech', 'gets', 'its'];

/*
 * The drift, once the line has finished landing.
 *
 * Per word rather than on the `h1`, for two reasons. A single element bobbing
 * moves like a signboard on a hinge; six moving on their own periods move like
 * things suspended, which is what the sky behind them is already doing. And a
 * transform on a child leaves the `h1`'s own box where it is, so `PixelSky` —
 * which measures that box once per resize to decide where it may not draw —
 * keeps a stable keep-out band instead of one that breathes.
 *
 * The periods are deliberately co-prime-ish. Equal ones would stay locked
 * together forever and the whole line would rise and fall as a slab.
 *
 * Travel is in `em`, not pixels. The headline runs from 40px to 76px across the
 * clamp, and a fixed 8px that reads as a drift on a desktop is a fifth of the
 * cap height on a phone — which reads as a line that has come apart rather than
 * one that is floating.
 */
const DRIFT = [
  { span: '6.4s', lift: '-0.09em' },
  { span: '7.6s', lift: '-0.065em' },
  { span: '5.8s', lift: '-0.105em' },
  { span: '8.2s', lift: '-0.08em' },
  { span: '6.9s', lift: '-0.065em' },
];

/* The block travels furthest — it is the heaviest mark on the page, and giving
   it the same distance as a small word would read as the line failing to
   agree. */
const DRIFT_HIGHLIGHT = { span: '7.2s', lift: '-0.13em' };

/*
 * When the drift takes over: after the last word has risen (80 + 4x70 + 500 =
 * 780ms) and the block has stamped (430 + 320 = 750ms). Overlapping the two
 * would fight the entry's easing mid-flight and soften the stamp, which is the
 * one beat in the hero that is meant to be hard.
 */
const DRIFT_START = '900ms';

/**
 * Period, phase and travel for one word.
 *
 * `animation-duration` is set here rather than folded into `--animate-float`,
 * because a `var()` inside that shorthand resolves against `:root` — where no
 * word has set anything — and all six would quietly run at the fallback. An
 * inline longhand beats the shorthand the utility class writes. `--float-lift`
 * has no such problem: keyframes are resolved against the animating element.
 */
function drift({ span, lift }: { span: string; lift: string }) {
  return {
    animationDelay: DRIFT_START,
    animationDuration: span,
    '--float-lift': lift,
  } as React.CSSProperties;
}

export function Hero({ stats }: HeroProps) {
  return (
    /*
     * The hero is night, in both themes.
     *
     * `dark` here is the same class ThemeProvider puts on `<html>`, and it is a
     * plain class selector — so putting it on this section redeclares `--canvas`,
     * `--surface`, `--edge`, `--body-ink`, `--muted-ink` and `--accent` for
     * everything inside it. The section becomes a dark island: the badge, the
     * paragraph, both buttons and the backdrop grid are all written against
     * those tokens and correct themselves, and in dark mode the class is simply
     * redundant rather than doubled.
     *
     * That is the whole reason it is a class and not a hand-picked set of
     * on-dark colours. A starfield on white is not outer space, but neither is
     * a hero where the shadows are `--edge` — near-black in light mode — and
     * therefore invisible the moment the ground goes dark. The token layer
     * already knows every answer for a dark ground; this borrows all of them at
     * once instead of re-deciding six of them by hand.
     *
     * `bg-canvas` and `text-body` are both required, and for different reasons.
     * The section previously painted nothing and let the page show through,
     * which would now be the page's light canvas. And `color` inherits as a
     * resolved colour, not as the variable it came from — `body` had already
     * turned `var(--color-body)` into near-black before this subtree existed,
     * so redeclaring the token here changes nothing until something asks for it
     * again. Without `text-body` the headline is black on black.
     */
    <section className="dark relative isolate overflow-hidden border-b border-edge bg-canvas text-body">
      <Backdrop pattern="grid" />

      {/* Over the grid, under the words. `inset-0` rather than a fixed height
          so the lower band always finds the actual floor of the hero. */}
      <PixelSky className="pointer-events-none absolute inset-0 h-full w-full" />

      {/*
       * Deliberately shallow. This block was proportioned around two mascots
       * standing in the gutters and three stat tiles below the buttons; with
       * all five gone, the same padding just left the headline marooned in
       * whitespace. A launch board should get you to the launches quickly, so
       * the hero says its piece and hands over to the wall.
       */}
      <div className="relative mx-auto max-w-6xl px-4 pb-11 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
        {/*
         * A pair, one in each gutter — which only exist once the centred column
         * stops filling the container, hence lg and up. They are also the one
         * thing here that wants a cursor to point at it, and below lg there
         * usually isn't one. Positioned with `top` rather than a translate
         * utility: the component drives `transform` itself, frame by frame.
         *
         * They face each other by default and both turn to watch the cursor
         * when it comes near, so the hero is never quite still.
         */}
        {SHOW_MASCOTS && (
          <>
            <HeroAvatar
              facing="right"
              className="absolute left-2 top-[calc(30%-3rem)] z-10 hidden lg:block xl:left-6 xl:top-[calc(30%-3.8rem)]"
            />
            <HeroAvatar
              facing="left"
              ears
              tone="fill-deep"
              eye="fill-pop"
              className="absolute right-2 top-[calc(30%-3rem)] z-10 hidden lg:block xl:right-6 xl:top-[calc(30%-3.8rem)]"
            />
          </>
        )}

        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-6 inline-flex animate-[var(--animate-slam)] items-center gap-2 border border-edge bg-surface px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] shadow-hard-sm">
            {/* An 8px dot on a white surface: the themed mark, not lime. */}
            <span className="size-2 bg-accent" aria-hidden="true" />
            {stats?.todayLaunches
              ? `${stats.todayLaunches} ${stats.todayLaunches === 1 ? 'launch' : 'launches'} today`
              : 'New launches every day'}
          </p>

          {/*
           * The headline arrives a word at a time.
           *
           * One block sliding in reads as a page loading. Words landing in
           * sequence reads as something being said — and it suits the style,
           * where nothing eases and everything arrives with a stamp.
           *
           * The whole line is one accessible string: the per-word spans are
           * `aria-hidden` and a visually hidden copy carries the real text, so a
           * screen reader gets a sentence rather than six separate words. All of
           * it stops under `prefers-reduced-motion` via the global rule, which
           * collapses the durations to nothing and leaves the words in place.
           */}
          {/* `data-sky-keepout` is read by PixelSky, which measures this box and
              refuses to draw anything inside its vertical band. An explicit
              contract rather than the canvas guessing where the words are. */}
          <h1
            data-sky-keepout
            className="display-tight text-[clamp(2.5rem,8vw,4.75rem)] uppercase text-balance"
          >
            <span className="sr-only">Where new tech gets its first fans</span>

            <span aria-hidden="true">
              {HEADLINE.map((word, index) => (
                <span
                  key={word}
                  /* The clip box drifts, taking the word with it, so nothing is
                     ever clipped by its own float — only by the entry. */
                  className="inline-block animate-[var(--animate-float)] overflow-hidden align-bottom"
                  style={drift(DRIFT[index])}
                >
                  <span
                    className="inline-block animate-[var(--animate-rise)]"
                    style={{ animationDelay: `${80 + index * 70}ms` }}
                  >
                    {word}
                  </span>
                  {'\u00A0'}
                </span>
              ))}

              {/* The highlight is a solid block behind the words, not a
                  gradient. It stamps in last, after the line has finished
                  arriving, so it reads as the emphasis rather than as part of
                  the sentence appearing. */}
              {/* Two elements, because one cannot both stamp and drift: the
                  outer carries the endless float, the inner the entry. */}
              <span
                className="inline-block animate-[var(--animate-float)]"
                style={drift(DRIFT_HIGHLIGHT)}
              >
                <span
                  className="relative inline-block animate-[var(--animate-slam)]"
                  style={{ animationDelay: `${80 + HEADLINE.length * 70}ms` }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -inset-x-2 inset-y-1 -rotate-1 border border-edge bg-deep"
                  />
                  <span className="relative text-on-deep">first fans</span>
                </span>
              </span>
            </span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl animate-[var(--animate-slide-up)] text-base leading-relaxed text-muted text-pretty sm:text-lg"
            style={{ animationDelay: '140ms' }}
          >
            Launch and discover AI models, tools, Claude skills, mobile apps and websites. Vote on
            what ships today, and see who tops the daily board.
          </p>

          <div
            className="mt-8 flex animate-[var(--animate-slide-up)] flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: '220ms' }}
          >
            <ButtonLink to="/submit" size="lg">
              Launch your product
            </ButtonLink>
            <ButtonLink to="/discover" variant="secondary" size="lg">
              Explore launches
            </ButtonLink>
          </div>

          {SHOW_STATS && stats && (
            <dl
              className="mx-auto mt-14 grid max-w-xl animate-[var(--animate-slide-up)] grid-cols-3 gap-3"
              style={{ animationDelay: '300ms' }}
            >
              <Stat label="Launches" value={formatNumber(stats.launches)} tone="bg-surface" />
              <Stat label="Makers" value={formatNumber(stats.makers)} tone="bg-pop text-on-pop" />
              <Stat label="Votes cast" value={formatNumber(stats.votes)} tone="bg-grey text-ink" />
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`border border-edge px-3 py-4 shadow-hard ${tone}`}>
      <dd className="font-display text-2xl tabular-nums sm:text-3xl">{value}</dd>
      <dt className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] opacity-80">
        {label}
      </dt>
    </div>
  );
}
