import { Link, useNavigate, useParams } from 'react-router-dom';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { CommentSection } from '@/components/items/CommentSection';
import { ItemGallery } from '@/components/items/ItemGallery';
import { ItemCard } from '@/components/items/ItemCard';
import { ItemLogo } from '@/components/items/ItemLogo';
import { ManageImages } from '@/components/items/ManageImages';
import { VoteButton } from '@/components/items/VoteButton';
import { Avatar } from '@/components/ui/Avatar';
import { Backdrop } from '@/components/ui/Ambient';
import { Badge } from '@/components/ui/Badge';
import { Button, ExternalButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { Stars } from '@/components/ui/Stars';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteItem, useItem } from '@/hooks/useItems';
import {
  CATEGORY_LABELS,
  colourFor,
  formatFullDate,
  PRICING_LABELS,
  prettyUrl,
  relativeTime,
} from '@/lib/utils';

export function ItemDetail() {
  const { slug = '' } = useParams();
  const { data: item, isLoading, isError, error, refetch } = useItem(slug);
  const { user } = useAuth();
  const deleteItem = useDeleteItem();
  const navigate = useNavigate();

  if (isLoading) return <ItemDetailSkeleton />;

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState message={error.message} onRetry={() => void refetch()} />
        <div className="mt-6 text-center">
          <Link
            to="/discover"
            className="font-mono text-[12px] font-bold uppercase underline-offset-4 hover:underline"
          >
            ← Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const isOwner = user?.id === item.submittedBy.id || user?.role === 'admin';
  const colour = colourFor(item.slug);

  return (
    <article>
      <header className="relative isolate overflow-hidden border-b-2 border-edge">
        <Backdrop pattern="halftone" />

        {item.coverUrl && (
          <div className="relative mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
            <img
              src={item.coverUrl}
              alt=""
              className="aspect-[3/1] w-full border-2 border-edge object-cover shadow-hard"
            />
          </div>
        )}

        <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 font-mono text-[11px] font-bold uppercase text-muted"
          >
            <Link to="/discover" className="hover:text-body">
              Discover
            </Link>
            <span aria-hidden="true">/</span>
            <Link to={`/discover?category=${item.category}`} className="hover:text-body">
              {CATEGORY_LABELS[item.category]}
            </Link>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <ItemLogo item={item} size="xl" className="animate-[var(--animate-slam)] shadow-hard" />

            <div className="min-w-0 flex-1 animate-[var(--animate-slide-up)]">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="display-tight text-4xl uppercase text-balance sm:text-5xl">
                  {item.name}
                </h1>
                {item.featured && <Badge tone="accent">★ Spotlight</Badge>}
              </div>

              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted text-pretty">
                {item.tagline}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
                <Link
                  to={`/discover?category=${item.category}`}
                  className="inline-flex items-center gap-1.5 text-body hover:text-cobalt"
                >
                  <CategoryIcon category={item.category} className="size-4" />
                  {CATEGORY_LABELS[item.category]}
                </Link>
                <span aria-hidden="true" className="text-muted/50">
                  /
                </span>
                <span>{PRICING_LABELS[item.pricing]}</span>
                <span aria-hidden="true" className="text-muted/50">
                  /
                </span>
                <span>Launched {relativeTime(item.launchDate)}</span>
              </div>

              {item.reviewCount > 0 && (
                <div className="mt-4 inline-flex items-center gap-2.5 border-2 border-edge bg-surface px-3 py-2 shadow-hard-sm">
                  <Stars value={item.ratingAvg} size="md" />
                  <span className="font-display text-sm tabular-nums">
                    {item.ratingAvg.toFixed(1)}
                  </span>
                  <span className="font-mono text-[11px] font-bold uppercase text-muted">
                    {item.reviewCount} {item.reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <VoteButton item={item} layout="inline" className="h-11 px-5" />
                <ExternalButtonLink href={item.websiteUrl} size="md">
                  Visit {prettyUrl(item.websiteUrl)} ↗
                </ExternalButtonLink>
                {item.repoUrl && (
                  <ExternalButtonLink href={item.repoUrl} variant="secondary" size="md">
                    Source ↗
                  </ExternalButtonLink>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Colour bar keyed to the item, sitting on the header's bottom edge. */}
        <div className={`h-2 border-t-2 border-edge ${colour.bg}`} />
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0">
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-xl uppercase">
                About {item.name}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-body text-pretty sm:text-base">
                {item.description
                  .split('\n')
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>

              {item.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/discover?tag=${encodeURIComponent(tag)}`}
                      className="border-2 border-edge px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-muted transition-colors duration-[120ms] hover:bg-acid hover:text-ink"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <ItemGallery images={item.gallery ?? []} name={item.name} />

            <CommentSection slug={item.slug} itemName={item.name} />
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <Card className="p-5">
              <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
                Launched by
              </h2>
              <Link
                to={`/u/${item.submittedBy.username}`}
                className="group mt-3 flex items-center gap-3"
              >
                <Avatar user={item.submittedBy} size="md" />
                <span className="min-w-0">
                  <span className="block truncate font-display text-sm uppercase group-hover:text-cobalt">
                    {item.submittedBy.name}
                  </span>
                  <span className="block truncate font-mono text-[11px] text-muted">
                    @{item.submittedBy.username}
                  </span>
                </span>
              </Link>

              {item.makers.length > 0 && (
                <div className="mt-5">
                  <h3 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
                    Makers
                  </h3>
                  <ul className="mt-2.5 space-y-1.5">
                    {item.makers.map((maker) => (
                      <li key={maker} className="text-sm text-body">
                        {maker}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <dl className="mt-5 space-y-2 border-t-2 border-edge pt-4 font-mono text-[11px] font-bold uppercase">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Votes</dt>
                  <dd className="tabular-nums">{item.voteCount}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Comments</dt>
                  <dd className="tabular-nums">{item.commentCount}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Launched</dt>
                  <dd>{formatFullDate(item.launchDate)}</dd>
                </div>
              </dl>

              {isOwner && (
                <div className="mt-5 space-y-3 border-t-2 border-edge pt-4">
                  <ManageImages item={item} />
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    loading={deleteItem.isPending}
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Delete "${item.name}"? This also removes its votes and comments, and cannot be undone.`,
                      );
                      if (confirmed) {
                        deleteItem.mutate(item.id, { onSuccess: () => navigate('/discover') });
                      }
                    }}
                  >
                    Delete this launch
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
                Links
              </h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href={item.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-body underline-offset-4 hover:text-cobalt hover:underline"
                  >
                    {prettyUrl(item.websiteUrl)} ↗
                  </a>
                </li>
                {item.repoUrl && (
                  <li>
                    <a
                      href={item.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-body underline-offset-4 hover:text-cobalt hover:underline"
                    >
                      {prettyUrl(item.repoUrl)} ↗
                    </a>
                  </li>
                )}
              </ul>
            </Card>
          </aside>
        </div>

        {item.related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-16">
            <h2 id="related-heading" className="mb-5 text-xl uppercase">
              More in {CATEGORY_LABELS[item.category]}
            </h2>
            <div className="space-y-3">
              {item.related.map((related) => (
                <ItemCard key={related.id} item={related} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function ItemDetailSkeleton() {
  return (
    <div>
      <div className="border-b-2 border-edge">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <Skeleton className="size-20" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-10 w-2/5" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-11 w-64" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl space-y-3 px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
