import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyBoardIllustration, TrendMark } from '@/components/illustrations/Illustrations';
import { ItemCard } from '@/components/items/ItemCard';
import { PageGlow } from '@/components/ui/Ambient';
import { ButtonLink, Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ItemCardSkeletonList, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import {
  useDailyLeaderboard,
  useLeaderboardDates,
  usePeriodLeaderboard,
} from '@/hooks/useLeaderboard';
import { cn, dayPhrase, formatDay, formatNumber } from '@/lib/utils';

type Period = 'week' | 'month' | 'year' | 'all';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
];

export function Leaderboard() {
  const [params, setParams] = useSearchParams();
  const date = params.get('date') ?? undefined;
  const [period, setPeriod] = useState<Period>('week');

  const daily = useDailyLeaderboard(date);
  const dates = useLeaderboardDates();
  const periodBoard = usePeriodLeaderboard(period);

  const meta = daily.data?.meta;
  const items = daily.data?.data ?? [];

  const goToDate = (next?: string) => {
    const nextParams = new URLSearchParams(params);
    if (next) nextParams.set('date', next);
    else nextParams.delete('date');
    setParams(nextParams, { preventScrollReset: true });
  };

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PageGlow />

      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
          Leaderboard
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {meta ? formatDay(meta.date) : 'Today'} on Deck
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 text-pretty dark:text-zinc-400">
          Launches are ranked by community votes. Each board covers one UTC day and closes at
          midnight.
        </p>
      </header>

      {/* Day switcher */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => goToDate(meta?.previousDate)}
            disabled={!meta}
          >
            ← Previous day
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => goToDate(meta?.nextDate ?? undefined)}
            disabled={!meta?.nextDate}
          >
            Next day →
          </Button>
          {!meta?.isToday && (
            <Button variant="ghost" size="sm" onClick={() => goToDate(undefined)}>
              Jump to today
            </Button>
          )}
        </div>

        {meta && (
          <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-500">
            {meta.totalLaunches} {meta.totalLaunches === 1 ? 'launch' : 'launches'}{' '}
            {dayPhrase(meta.date)}
          </span>
        )}
      </div>

      {/* Recent days strip */}
      {dates.data && dates.data.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {dates.data.map((day) => {
            const active = meta?.date === day.date;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => goToDate(day.date)}
                aria-pressed={active}
                className={cn(
                  'shrink-0 rounded-xl border px-3.5 py-2 text-left transition-all',
                  active
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:-translate-y-0.5 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-zinc-700',
                )}
              >
                <span className="block whitespace-nowrap text-xs font-medium">
                  {formatDay(day.date)}
                </span>
                <span
                  className={cn(
                    'block whitespace-nowrap text-[11px] tabular-nums',
                    active ? 'opacity-70' : 'text-zinc-400 dark:text-zinc-600',
                  )}
                >
                  {day.launches} · ▲ {formatNumber(day.votes)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-label="Daily ranking">
          {daily.isLoading ? (
            <ItemCardSkeletonList count={6} />
          ) : daily.isError ? (
            <ErrorState message={daily.error.message} onRetry={() => void daily.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              illustration={<EmptyBoardIllustration />}
              title={`Nothing launched ${meta ? dayPhrase(meta.date) : 'on this day'}`}
              description={
                meta?.isToday
                  ? 'Today’s board is still empty — yours could be first.'
                  : 'Try another day, or check what is live right now.'
              }
              action={
                meta?.isToday ? (
                  <ButtonLink to="/submit">Launch your product</ButtonLink>
                ) : (
                  <Button variant="secondary" onClick={() => goToDate(undefined)}>
                    Jump to today
                  </Button>
                )
              }
            />
          ) : (
            <>
              {/* Podium for the top three */}
              {items.length >= 3 && (
                <div className="mb-6 grid gap-3 sm:grid-cols-3">
                  {[items[1], items[0], items[2]].map((item, position) => {
                    const heights = ['sm:mt-6', '', 'sm:mt-10'];
                    return (
                      <div
                        key={item.id}
                        className={cn('animate-[var(--animate-rise)]', heights[position])}
                        style={{ animationDelay: `${position * 90}ms` }}
                      >
                        <PodiumCard item={item} />
                      </div>
                    );
                  })}
                </div>
              )}

              <ol className="space-y-3">
                {items.map((item, index) => (
                  <li key={item.id}>
                    <ItemCard
                      item={item}
                      rank={item.rank}
                      className="animate-[var(--animate-fade-up)]"
                      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
                    />
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <h2 className="text-sm font-semibold">All-round favourites</h2>
            <div className="mt-3 flex flex-wrap gap-1">
              {PERIODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  aria-pressed={period === option.value}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                    period === option.value
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {periodBoard.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton key={index} className="h-11 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <ol className="space-y-0.5">
                  {periodBoard.data?.slice(0, 8).map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/item/${item.slug}`}
                        className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-zinc-400 dark:text-zinc-600">
                          {item.rank}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400">
                          {item.name}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-500">
                          ▲ {item.voteCount}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Card>

          <Card className="relative overflow-hidden p-5">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-gradient-to-br from-brand-300/40 to-brand-600/20 blur-2xl dark:from-brand-500/25 dark:to-brand-700/10"
            />
            <TrendMark className="relative mb-2 size-9" />
            <h2 className="relative text-sm font-semibold">How ranking works</h2>
            <ul className="relative mt-3 space-y-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              <li>· One upvote per person, per launch.</li>
              <li>· Boards are grouped by launch day in UTC.</li>
              <li>· Ties break toward more discussion, then earlier launch time.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function PodiumCard({ item }: { item: { rank: number; name: string; slug: string; voteCount: number; tagline: string } }) {
  const styles: Record<number, string> = {
    1: 'from-amber-300/30 to-amber-500/10 border-amber-400/40',
    2: 'from-zinc-300/30 to-zinc-500/10 border-zinc-400/40',
    3: 'from-orange-300/30 to-orange-500/10 border-orange-400/40',
  };

  return (
    <Link
      to={`/item/${item.slug}`}
      className={cn(
        'flex h-full flex-col rounded-2xl border bg-gradient-to-b p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lifted)]',
        styles[item.rank] ?? 'border-zinc-200 from-zinc-100/50 to-transparent dark:border-zinc-800',
      )}
    >
      <span className="text-2xl font-bold tabular-nums leading-none opacity-80">
        {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
      </span>
      <span className="mt-3 line-clamp-1 text-sm font-semibold">{item.name}</span>
      <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        {item.tagline}
      </span>
      <span className="mt-3 text-xs font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
        ▲ {item.voteCount} votes
      </span>
    </Link>
  );
}
