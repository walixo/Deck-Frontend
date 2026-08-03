import { useSearchParams } from 'react-router-dom';
import { ItemCard } from '@/components/items/ItemCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ItemCardSkeletonList } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useItems } from '@/hooks/useItems';
import { useCategories } from '@/hooks/useMeta';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { NoResultsIllustration } from '@/components/illustrations/Illustrations';
import { PageGlow } from '@/components/ui/Ambient';
import { cn, CATEGORY_PLURAL, PRICING_LABELS } from '@/lib/utils';
import type { Category, PricingModel, SortOption } from '@/types';

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'top', label: 'Most voted' },
  { value: 'discussed', label: 'Most discussed' },
];

const PRICING: PricingModel[] = ['free', 'freemium', 'paid', 'open-source'];

const PAGE_SIZE = 12;

export function Discover() {
  const [params, setParams] = useSearchParams();
  const { data: categories } = useCategories();

  const category = (params.get('category') as Category | null) ?? undefined;
  const pricing = (params.get('pricing') as PricingModel | null) ?? undefined;
  const tag = params.get('tag') ?? undefined;
  const sort = (params.get('sort') as SortOption | null) ?? 'trending';
  const search = params.get('search') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? 1));

  const query = useItems({ category, pricing, tag, sort, search, page, limit: PAGE_SIZE });

  /** Writes a filter to the URL — the URL is the single source of truth here. */
  const update = (changes: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (resetPage) next.delete('page');
    setParams(next, { preventScrollReset: true });
  };

  const activeFilters = [category, pricing, tag, search].filter(Boolean).length;
  const total = query.data?.meta.total ?? 0;
  const pages = query.data?.meta.pages ?? 1;

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PageGlow />

      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Discover
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 text-pretty dark:text-zinc-400">
          Every launch on Deck, filterable by category, pricing and tag.
        </p>
      </header>

      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get('search');
          update({ search: String(value ?? '').trim() || undefined });
        }}
        className="mb-6 flex gap-2"
      >
        <label className="relative flex-1">
          <span className="sr-only">Search launches</span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          >
            ⌕
          </span>
          {/* Uncontrolled and keyed to the URL: remounts when the query changes elsewhere. */}
          <input
            key={search}
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Search by name, tagline or tag"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3.5 text-sm transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900/60 dark:placeholder:text-zinc-500 dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:ring-white/5"
          />
        </label>
        <Button type="submit" size="md">
          Search
        </Button>
      </form>

      {/* Category pills */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <FilterPill active={!category} onClick={() => update({ category: undefined })}>
          All
        </FilterPill>
        {categories?.map((entry) => (
          <FilterPill
            key={entry.slug}
            active={category === entry.slug}
            onClick={() => update({ category: entry.slug })}
          >
            <CategoryIcon category={entry.slug} className="mr-1.5 inline size-4 align-[-3px]" />
            {CATEGORY_PLURAL[entry.slug]}
            <span className="ml-1.5 text-xs tabular-nums opacity-60">{entry.count}</span>
          </FilterPill>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Sort</span>
          <div className="flex rounded-xl border border-zinc-200 p-0.5 dark:border-zinc-800">
            {SORTS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => update({ sort: option.value })}
                aria-pressed={sort === option.value}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  sort === option.value
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Pricing</span>
          {PRICING.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => update({ pricing: pricing === option ? undefined : option })}
              aria-pressed={pricing === option}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                pricing === option
                  ? 'border-brand-500/40 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700',
              )}
            >
              {PRICING_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {activeFilters > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-500">
            {query.isLoading ? 'Filtering' : `${total} ${total === 1 ? 'result' : 'results'}`}
          </span>
          {search && (
            <RemovableChip onRemove={() => update({ search: undefined })}>
              “{search}”
            </RemovableChip>
          )}
          {category && (
            <RemovableChip onRemove={() => update({ category: undefined })}>
              {CATEGORY_PLURAL[category]}
            </RemovableChip>
          )}
          {pricing && (
            <RemovableChip onRemove={() => update({ pricing: undefined })}>
              {PRICING_LABELS[pricing]}
            </RemovableChip>
          )}
          {tag && (
            <RemovableChip onRemove={() => update({ tag: undefined })}>#{tag}</RemovableChip>
          )}
          <button
            type="button"
            onClick={() => setParams(new URLSearchParams({ sort }), { preventScrollReset: true })}
            className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-white"
          >
            Clear all
          </button>
        </div>
      )}

      {query.isLoading ? (
        <ItemCardSkeletonList count={6} />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : query.data?.data.length ? (
        <>
          <div className="space-y-3">
            {query.data.data.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                className="animate-[var(--animate-fade-up)]"
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              />
            ))}
          </div>

          {pages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-10 flex items-center justify-between gap-4 border-t border-zinc-200/80 pt-6 dark:border-zinc-800"
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) }, false)}
              >
                ← Previous
              </Button>
              <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-500">
                Page {page} of {pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pages}
                onClick={() => update({ page: String(page + 1) }, false)}
              >
                Next →
              </Button>
            </nav>
          )}
        </>
      ) : (
        <EmptyState
          illustration={<NoResultsIllustration />}
          title="No launches match those filters"
          description="Try widening your search or clearing a filter."
          action={
            <Button variant="secondary" onClick={() => setParams(new URLSearchParams())}>
              Clear filters
            </Button>
          }
        />
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
        active
          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

function RemovableChip({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <Badge tone="neutral" className="gap-1.5 pr-1.5">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove filter"
        className="flex size-4 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-300/60 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-white"
      >
        <span aria-hidden="true" className="text-[10px]">
          ✕
        </span>
      </button>
    </Badge>
  );
}
