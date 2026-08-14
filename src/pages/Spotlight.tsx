import { ItemCard } from '@/components/items/ItemCard';
import { SpotlightSlider } from '@/components/items/SpotlightSlider';
import { PageBanner } from '@/components/ui/Ambient';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/Card';
import { ItemCardSkeletonList } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useItems, useSpotlight } from '@/hooks/useItems';

/* Room for twice what the home page had, now that nothing is competing with it. */
const TRENDING_LIMIT = 12;

/**
 * Spotlight and Trending, lifted off the home page onto their own route.
 *
 * The two belong together: one is what the team is pointing at, the other is
 * what the crowd is pointing at, and reading them side by side is the point.
 */
export function Spotlight() {
  const spotlight = useSpotlight();
  const trending = useItems({ sort: 'trending', limit: TRENDING_LIMIT });

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-10">
        <p className="mb-3 inline-block border-2 border-edge bg-acid px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
          Picks
        </p>
        <h1 className="display-tight text-4xl uppercase text-balance sm:text-5xl">
          What&apos;s worth your afternoon
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted text-pretty">
          Hand-picked launches the community keeps coming back to, and the ones gaining votes and
          conversation fastest right now.
        </p>
      </header>

      <section aria-labelledby="spotlight-heading" className="mb-16">
        <h2 id="spotlight-heading" className="sr-only">
          Spotlighted launches
        </h2>
        {spotlight.isError ? (
          <ErrorState message={spotlight.error.message} onRetry={() => void spotlight.refetch()} />
        ) : (
          <SpotlightSlider items={spotlight.data ?? []} isLoading={spotlight.isLoading} />
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
          <ItemCardSkeletonList count={6} />
        ) : trending.isError ? (
          <ErrorState message={trending.error.message} onRetry={() => void trending.refetch()} />
        ) : trending.data?.data.length ? (
          <div className="space-y-3">
            {trending.data.data.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                className="animate-[var(--animate-slide-up)]"
                style={{ animationDelay: `${index * 60}ms` }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing is trending yet"
            description="Once launches start collecting votes, the fastest movers show up here."
            action={<ButtonLink to="/submit">Launch your product</ButtonLink>}
          />
        )}
      </section>
    </div>
  );
}
