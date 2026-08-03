import { Link } from 'react-router-dom';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { Hero } from '@/components/home/Hero';
import { LaunchWall } from '@/components/home/LaunchWall';
import { MakerLeaderboard } from '@/components/home/MakerLeaderboard';
import { ItemCard } from '@/components/items/ItemCard';
import { SpotlightSlider } from '@/components/items/SpotlightSlider';
import { ButtonLink } from '@/components/ui/Button';
import { Card, SectionHeading } from '@/components/ui/Card';
import { ItemCardSkeletonList } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useItems, useSpotlight } from '@/hooks/useItems';
import { useDailyLeaderboard } from '@/hooks/useLeaderboard';
import { useStats, useTags } from '@/hooks/useMeta';

export function Home() {
  const { data: stats } = useStats();
  const spotlight = useSpotlight();
  const today = useDailyLeaderboard();
  const trending = useItems({ sort: 'trending', limit: 6 });
  const wall = useItems({ sort: 'top', limit: 24 });
  const { data: tags } = useTags();

  return (
    <>
      <Hero stats={stats} />

      <LaunchWall items={wall.data?.data ?? []} isLoading={wall.isLoading} />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <section aria-labelledby="spotlight-heading" className="mb-16">
          <SectionHeading
            eyebrow="Spotlight"
            title="Hand-picked launches worth your afternoon"
            description="A rotating look at the products the community keeps coming back to."
          />
          <div id="spotlight-heading" className="sr-only">
            Spotlighted launches
          </div>
          {spotlight.isError ? (
            <ErrorState
              message={spotlight.error.message}
              onRetry={() => void spotlight.refetch()}
            />
          ) : (
            <SpotlightSlider items={spotlight.data ?? []} isLoading={spotlight.isLoading} />
          )}
        </section>

        <section aria-labelledby="categories-heading" className="mb-16">
          <h2 id="categories-heading" className="mb-5 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
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
                      className="animate-[var(--animate-fade-up)]"
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

            <section aria-labelledby="trending-heading">
              <SectionHeading
                eyebrow="Trending"
                title="Picking up momentum"
                description="Recent launches gaining votes and conversation fastest."
                action={
                  <ButtonLink to="/discover" variant="secondary" size="sm">
                    Discover all
                  </ButtonLink>
                }
              />
              <div id="trending-heading" className="sr-only">
                Trending launches
              </div>

              {trending.isLoading ? (
                <ItemCardSkeletonList count={4} />
              ) : trending.isError ? (
                <ErrorState
                  message={trending.error.message}
                  onRetry={() => void trending.refetch()}
                />
              ) : (
                <div className="space-y-3">
                  {trending.data?.data.map((item, index) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      className="animate-[var(--animate-fade-up)]"
                      style={{ animationDelay: `${index * 60}ms` }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="p-5">
              <h2 className="text-sm font-semibold">Top makers</h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                By votes received across their launches.
              </p>
              <div className="mt-4">
                <MakerLeaderboard />
              </div>
            </Card>

            {tags && tags.length > 0 && (
              <Card className="p-5">
                <h2 className="text-sm font-semibold">Popular tags</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.slice(0, 14).map((tag) => (
                    <Link
                      key={tag.tag}
                      to={`/discover?tag=${encodeURIComponent(tag.tag)}`}
                      className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
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
                className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br from-brand-300/40 to-brand-600/20 blur-2xl dark:from-brand-500/25 dark:to-brand-700/10"
              />
              <h2 className="relative text-sm font-semibold">Shipping something?</h2>
              <p className="relative mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
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
