import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdSlot } from '@/components/ads/AdSlot';
import { EmptyBoardIllustration, TrendMark } from '@/components/illustrations/Illustrations';
import { ItemCard } from '@/components/items/ItemCard';
import { PageBanner } from '@/components/ui/Ambient';
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
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All time' },
];

/* Podium fills, brightest for first. */
const PODIUM: Record<number, string> = {
  1: 'bg-acid text-ink',
  2: 'bg-lavender text-ink',
  3: 'bg-edge text-canvas',
};

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
      <PageBanner />

      <header className="mb-8">
        <p className="mb-3 inline-block border-2 border-edge bg-lavender px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
          Leaderboard
        </p>
        <h1 className="display-tight text-4xl uppercase text-balance sm:text-5xl">
          {meta ? formatDay(meta.date) : 'Today'} on Deck
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted text-pretty">
          Launches are ranked by community votes. Each board covers one UTC day and closes at
          midnight.
        </p>
      </header>

      <AdSlot placement="board" className="mb-8" />

      {/* Day switcher */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => goToDate(meta?.previousDate)}
            disabled={!meta}
          >
            ← Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => goToDate(meta?.nextDate ?? undefined)}
            disabled={!meta?.nextDate}
          >
            Next →
          </Button>
          {!meta?.isToday && (
            <Button variant="ghost" size="sm" onClick={() => goToDate(undefined)}>
              Jump to today
            </Button>
          )}
        </div>

        {meta && (
          <span className="ml-auto font-mono text-[11px] font-bold uppercase text-muted">
            {meta.totalLaunches} {meta.totalLaunches === 1 ? 'launch' : 'launches'}{' '}
            {dayPhrase(meta.date)}
          </span>
        )}
      </div>

      {/* Recent days strip */}
      {dates.data && dates.data.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 pt-1 sm:mx-0 sm:px-0">
          {dates.data.map((day) => {
            const active = meta?.date === day.date;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => goToDate(day.date)}
                aria-pressed={active}
                className={cn(
                  'shrink-0 border-2 border-edge px-3 py-2 text-left transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm',
                  active ? 'bg-acid text-ink shadow-hard-sm' : 'bg-surface text-body',
                )}
              >
                <span className="block whitespace-nowrap font-display text-[12px] uppercase">
                  {formatDay(day.date)}
                </span>
                <span
                  className={cn(
                    'block whitespace-nowrap font-mono text-[10px] font-bold tabular-nums',
                    active ? 'opacity-70' : 'text-muted',
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
                        className={cn('animate-[var(--animate-slam)]', heights[position])}
                        style={{ animationDelay: `${position * 80}ms` }}
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
                      className="animate-[var(--animate-slide-up)]"
                      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                    />
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <h2 className="border-b-2 border-edge pb-2 font-display text-sm uppercase">
              All-round favourites
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PERIODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  aria-pressed={period === option.value}
                  className={cn(
                    'border-2 border-edge px-2 py-1 font-mono text-[10px] font-bold uppercase transition-colors duration-[120ms]',
                    period === option.value
                      ? 'bg-lavender text-ink'
                      : 'bg-surface text-muted hover:bg-surface-2 hover:text-body',
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
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <ol className="space-y-1">
                  {periodBoard.data?.slice(0, 8).map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/item/${item.slug}`}
                        className="group flex items-center gap-2.5 border-2 border-transparent px-2 py-1.5 transition-colors duration-[120ms] hover:border-edge hover:bg-surface-2"
                      >
                        <span className="w-4 shrink-0 font-mono text-[11px] font-bold tabular-nums text-muted">
                          {item.rank}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-display text-[13px] uppercase group-hover:text-lavender">
                          {item.name}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-muted">
                          ▲ {item.voteCount}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <TrendMark className="mb-2 size-9" />
            <h2 className="font-display text-sm uppercase">How ranking works</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
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

function PodiumCard({
  item,
}: {
  item: { rank: number; name: string; slug: string; voteCount: number; tagline: string };
}) {
  return (
    <Link
      to={`/item/${item.slug}`}
      className={cn(
        'flex h-full flex-col border-2 border-edge p-4 shadow-hard transition-[transform,box-shadow] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg',
        PODIUM[item.rank] ?? 'bg-surface',
      )}
    >
      <span className="font-display text-3xl leading-none tabular-nums">#{item.rank}</span>
      <span className="mt-3 line-clamp-1 font-display text-sm uppercase">{item.name}</span>
      <span className="mt-1 line-clamp-2 text-xs leading-relaxed opacity-80">{item.tagline}</span>
      <span className="mt-3 font-mono text-[11px] font-bold uppercase tabular-nums">
        ▲ {item.voteCount} votes
      </span>
    </Link>
  );
}
