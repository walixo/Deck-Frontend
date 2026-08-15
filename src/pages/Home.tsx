import { Link } from 'react-router-dom';
import { AdSlot } from '@/components/ads/AdSlot';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { Hero } from '@/components/home/Hero';
import { LaunchWall } from '@/components/home/LaunchWall';
import { MakerLeaderboard } from '@/components/home/MakerLeaderboard';
import { ItemCard } from '@/components/items/ItemCard';
import { ButtonLink } from '@/components/ui/Button';
import { Card, SectionHeading } from '@/components/ui/Card';
import { ItemCardSkeletonList } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useItems } from '@/hooks/useItems';
import { useDailyLeaderboard } from '@/hooks/useLeaderboard';
import { useStats, useTags } from '@/hooks/useMeta';

export function Home() {
  const { data: stats } = useStats();
  const today = useDailyLeaderboard();
  const wall = useItems({ sort: 'top', limit: 24 });
  const { data: tags } = useTags();

  return (
    <>
      <Hero stats={stats} />

      <LaunchWall items={wall.data?.data ?? []} isLoading={wall.isLoading} />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <AdSlot placement="home" className="mb-14" />

        <section aria-labelledby="categories-heading" className="mb-16">
          <h2
            id="categories-heading"
            className="mb-5 border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
          >
            Browse by category
          </h2>
          <CategoryStrip />
        </section>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-16">
            <section aria-labelledby="today-heading">
              <SectionHeading
                eyebrow="Today's board"
                title="Launching today"
                description="Ranked by votes. The board resets at midnight UTC."
                action={
                  <ButtonLink to="/leaderboard" variant="secondary" size="sm">
                    Full leaderboard
                  </ButtonLink>
                }
              />
              <div id="today-heading" className="sr-only">
                Today&apos;s launches
              </div>

              {today.isLoading ? (
                <ItemCardSkeletonList count={4} />
              ) : today.isError ? (
                <ErrorState message={today.error.message} onRetry={() => void today.refetch()} />
              ) : today.data?.data.length ? (
                <div className="space-y-3">
                  {today.data.data.slice(0, 5).map((item, index) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      rank={item.rank}
                      className="animate-[var(--animate-slide-up)]"
                      style={{ animationDelay: `${index * 60}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Nothing has launched yet today"
                  description="Be the first to put something on today's board."
                  action={<ButtonLink to="/submit">Launch your product</ButtonLink>}
                />
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="p-5">
              <h2 className="font-display text-sm uppercase">Top makers</h2>
              <p className="mt-1 font-mono text-[10px] font-bold uppercase text-muted">
                By votes received across their launches.
              </p>
              <div className="mt-4">
                <MakerLeaderboard />
              </div>
            </Card>

            {tags && tags.length > 0 && (
              <Card className="p-5">
                <h2 className="font-display text-sm uppercase">Popular tags</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.slice(0, 14).map((tag) => (
                    <Link
                      key={tag.tag}
                      to={`/discover?tag=${encodeURIComponent(tag.tag)}`}
                      className="border-2 border-edge px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-muted transition-colors duration-[120ms] hover:bg-acid hover:text-ink"
                    >
                      {tag.tag}
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            <Card className="relative overflow-hidden p-5">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-6 -top-6 size-24 rotate-12 border-2 border-edge bg-acid"
              />
              <h2 className="relative font-display text-sm uppercase">Shipping something?</h2>
              <p className="relative mt-2 text-xs leading-relaxed text-muted">
                Post it on Deck, get feedback from other makers, and land on the daily board.
              </p>
              <ButtonLink to="/submit" size="sm" className="relative mt-4 w-full">
                Launch on Deck
              </ButtonLink>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}
