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

export function Hero({ stats }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b-2 border-edge">
      <Backdrop pattern="grid" blocks />

      {/* Bottom padding is deliberately shorter than the top: with the stat
          tiles parked, this is what pulls the launch wall up into their slot. */}
      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-24 lg:px-8">
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
        <HeroAvatar
          facing="right"
          className="absolute left-2 top-[calc(30%-3rem)] z-10 hidden lg:block xl:left-6 xl:top-[calc(30%-3.8rem)]"
        />
        <HeroAvatar
          facing="left"
          ears
          tone="fill-acid"
          className="absolute right-2 top-[calc(30%-3rem)] z-10 hidden lg:block xl:right-6 xl:top-[calc(30%-3.8rem)]"
        />

        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-7 inline-flex animate-[var(--animate-slam)] items-center gap-2 border-2 border-edge bg-surface px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] shadow-hard-sm">
            <span className="size-2 bg-cobalt" aria-hidden="true" />
            {stats?.todayLaunches
              ? `${stats.todayLaunches} ${stats.todayLaunches === 1 ? 'launch' : 'launches'} today`
              : 'New launches every day'}
          </p>

          <h1
            className="display-tight animate-[var(--animate-slam)] text-[clamp(2.5rem,8vw,4.75rem)] uppercase text-balance"
            style={{ animationDelay: '60ms' }}
          >
            Where new tech gets its{' '}
            {/* The highlight is a solid block behind the words, not a gradient. */}
            <span className="relative inline-block">
              <span
                aria-hidden="true"
                className="absolute -inset-x-2 inset-y-1 -rotate-1 border-2 border-edge bg-acid"
              />
              <span className="relative text-ink">first fans</span>
            </span>
          </h1>

          <p
            className="mx-auto mt-7 max-w-xl animate-[var(--animate-slide-up)] text-base leading-relaxed text-muted text-pretty sm:text-lg"
            style={{ animationDelay: '140ms' }}
          >
            Launch and discover AI models, tools, Claude skills, mobile apps and websites. Vote on
            what ships today, and see who tops the daily board.
          </p>

          <div
            className="mt-9 flex animate-[var(--animate-slide-up)] flex-wrap items-center justify-center gap-3"
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
              <Stat label="Makers" value={formatNumber(stats.makers)} tone="bg-cobalt text-white" />
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
