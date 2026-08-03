import { Ambient } from '@/components/ui/Ambient';
import { ButtonLink } from '@/components/ui/Button';
import { formatNumber } from '@/lib/utils';
import type { PlatformStats } from '@/types';

interface HeroProps {
  stats?: PlatformStats;
}

export function Hero({ stats }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800">
      <Ambient blobs grid />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-6 inline-flex animate-[var(--animate-fade-in)] items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-zinc-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-500 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-brand-500" />
            </span>
            {stats?.todayLaunches
              ? `${stats.todayLaunches} ${stats.todayLaunches === 1 ? 'launch' : 'launches'} today`
              : 'New launches every day'}
          </p>

          <h1
            className="text-4xl font-semibold leading-[1.08] tracking-tight text-balance animate-[var(--animate-fade-up)] sm:text-6xl"
            style={{ animationDelay: '60ms' }}
          >
            Where new tech gets its{' '}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent dark:from-brand-300 dark:to-brand-500">
                first fans
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 h-2.5 w-full text-brand-400/50 dark:text-brand-500/40"
              >
                <path
                  d="M2 8c60-5 120-6 180-4s80 3 116 1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-600 text-pretty animate-[var(--animate-fade-up)] sm:text-lg dark:text-zinc-400"
            style={{ animationDelay: '140ms' }}
          >
            Launch and discover AI models, tools, Claude skills, mobile apps and websites. Vote on
            what ships today, and see who tops the daily board.
          </p>

          <div
            className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-[var(--animate-fade-up)]"
            style={{ animationDelay: '220ms' }}
          >
            <ButtonLink to="/submit" size="lg">
              Launch your product
            </ButtonLink>
            <ButtonLink to="/discover" variant="secondary" size="lg">
              Explore launches
            </ButtonLink>
          </div>

          {stats && (
            <dl
              className="mx-auto mt-14 grid max-w-lg grid-cols-3 gap-4 animate-[var(--animate-fade-up)]"
              style={{ animationDelay: '300ms' }}
            >
              <Stat label="Launches" value={formatNumber(stats.launches)} />
              <Stat label="Makers" value={formatNumber(stats.makers)} />
              <Stat label="Votes cast" value={formatNumber(stats.votes)} />
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white/60 px-4 py-3.5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/40">
      <dd className="font-display text-xl font-semibold tabular-nums sm:text-2xl">{value}</dd>
      <dt className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">{label}</dt>
    </div>
  );
}
