import { HeroAvatar } from '@/components/home/HeroAvatar';
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

export function Hero({ stats }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b-2 border-edge">
      <Backdrop pattern="grid" />

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
          <p className="mb-6 inline-flex animate-[var(--animate-slam)] items-center gap-2 border-2 border-edge bg-surface px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] shadow-hard-sm">
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
          <h1 className="display-tight text-[clamp(2.5rem,8vw,4.75rem)] uppercase text-balance">
            <span className="sr-only">Where new tech gets its first fans</span>

            <span aria-hidden="true">
              {HEADLINE.map((word, index) => (
                <span key={word} className="inline-block overflow-hidden align-bottom">
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
              <span
                className="relative inline-block animate-[var(--animate-slam)]"
                style={{ animationDelay: `${80 + HEADLINE.length * 70}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="absolute -inset-x-2 inset-y-1 -rotate-1 border-2 border-edge bg-deep"
                />
                <span className="relative text-on-deep">first fans</span>
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
    <div className={`border-2 border-edge px-3 py-4 shadow-hard ${tone}`}>
      <dd className="font-display text-2xl tabular-nums sm:text-3xl">{value}</dd>
      <dt className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] opacity-80">
        {label}
      </dt>
    </div>
  );
}
