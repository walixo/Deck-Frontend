import { Link, useNavigate, useParams } from 'react-router-dom';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { CommentSection } from '@/components/items/CommentSection';
import { ItemCard } from '@/components/items/ItemCard';
import { ItemLogo } from '@/components/items/ItemLogo';
import { VoteButton } from '@/components/items/VoteButton';
import { Avatar } from '@/components/ui/Avatar';
import { Ambient } from '@/components/ui/Ambient';
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
  formatFullDate,
  gradientFor,
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
            className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            ← Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const isOwner = user?.id === item.submittedBy.id || user?.role === 'admin';

  return (
    <article>
      {/* Header band: shared wash plus a tint from the item's own gradient. */}
      <header className="relative isolate overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800">
        <Ambient variant="halo" />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-gradient-to-br opacity-20 blur-3xl dark:opacity-25 ${gradientFor(item.slug)}`}
        />

        <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
            <Link to="/discover" className="hover:text-zinc-900 dark:hover:text-white">
              Discover
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              to={`/discover?category=${item.category}`}
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              {CATEGORY_LABELS[item.category]}
            </Link>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <ItemLogo item={item} size="xl" className="animate-[var(--animate-fade-in)]" />

            <div className="min-w-0 flex-1 animate-[var(--animate-fade-up)]">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  {item.name}
                </h1>
                {item.featured && <Badge tone="accent">✦ Spotlight</Badge>}
              </div>

              <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600 text-pretty dark:text-zinc-400">
                {item.tagline}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-500 dark:text-zinc-500">
                <Link
                  to={`/discover?category=${item.category}`}
                  className="inline-flex items-center gap-1.5 font-medium text-zinc-600 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
                >
                  <CategoryIcon category={item.category} />
                  {CATEGORY_LABELS[item.category]}
                </Link>
                <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
                  ·
                </span>
                <span>{PRICING_LABELS[item.pricing]}</span>
                <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
                  ·
                </span>
                <span>Launched {relativeTime(item.launchDate)}</span>
              </div>

              {item.reviewCount > 0 && (
                <div className="mt-4 inline-flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <Stars value={item.ratingAvg} size="md" />
                  <span className="text-sm font-medium tabular-nums">
                    {item.ratingAvg.toFixed(1)}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    {item.reviewCount} {item.reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <VoteButton item={item} layout="inline" className="h-11 px-5 text-base" />
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
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0">
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-xl font-semibold">
                About {item.name}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-700 text-pretty sm:text-base dark:text-zinc-300">
                {item.description.split('\n').filter(Boolean).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {item.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/discover?tag=${encodeURIComponent(tag)}`}
                      className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <CommentSection slug={item.slug} itemName={item.name} />
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <Card className="p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                Launched by
              </h2>
              <Link
                to={`/u/${item.submittedBy.username}`}
                className="group mt-3 flex items-center gap-3"
              >
                <Avatar user={item.submittedBy} size="md" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    {item.submittedBy.name}
                  </span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-500">
                    @{item.submittedBy.username}
                  </span>
                </span>
              </Link>

              {item.makers.length > 0 && (
                <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                    Makers
                  </h3>
                  <ul className="mt-2.5 space-y-1.5">
                    {item.makers.map((maker) => (
                      <li key={maker} className="text-sm text-zinc-700 dark:text-zinc-300">
                        {maker}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <dl className="mt-5 space-y-2.5 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-500">Votes</dt>
                  <dd className="font-medium tabular-nums">{item.voteCount}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-500">Comments</dt>
                  <dd className="font-medium tabular-nums">{item.commentCount}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-500">Launch date</dt>
                  <dd className="font-medium">{formatFullDate(item.launchDate)}</dd>
                </div>
              </dl>

              {isOwner && (
                <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
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
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                Links
              </h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href={item.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-700 underline-offset-4 hover:text-brand-600 hover:underline dark:text-zinc-300 dark:hover:text-brand-400"
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
                      className="text-sm text-zinc-700 underline-offset-4 hover:text-brand-600 hover:underline dark:text-zinc-300 dark:hover:text-brand-400"
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
            <h2 id="related-heading" className="mb-5 text-xl font-semibold">
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
      <div className="border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <Skeleton className="size-20 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-9 w-2/5" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-11 w-64 rounded-xl" />
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
