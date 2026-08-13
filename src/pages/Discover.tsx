import { useSearchParams } from 'react-router-dom';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { NoResultsIllustration } from '@/components/illustrations/Illustrations';
import { ItemCard } from '@/components/items/ItemCard';
import { PageBanner } from '@/components/ui/Ambient';
import { Button } from '@/components/ui/Button';
import { ItemCardSkeletonList } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useItems } from '@/hooks/useItems';
import { useCategories } from '@/hooks/useMeta';
import { cn, CATEGORY_PLURAL, PRICING_LABELS } from '@/lib/utils';
import type { Category, PricingModel, SortOption } from '@/types';

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'top', label: 'Most voted' },
  { value: 'discussed', label: 'Discussed' },
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
      <PageBanner />

      <header className="mb-8">
        <h1 className="display-tight text-4xl uppercase text-balance sm:text-5xl">Discover</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted text-pretty">
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
        <label className="flex-1">
          <span className="sr-only">Search launches</span>
          {/* Uncontrolled and keyed to the URL: remounts when the query changes elsewhere. */}
          <input
            key={search}
            name="search"
            type="search"
            defaultValue={search}
            placeholder="SEARCH BY NAME, TAGLINE OR TAG"
            className="h-12 w-full rounded-slab border-2 border-edge bg-surface px-4 font-mono text-[12px] font-bold uppercase tracking-[0.06em] shadow-[inset_3px_3px_0_var(--surface-2)] transition-[box-shadow,border-color] duration-[120ms] placeholder:text-muted/70 focus:border-cobalt focus:shadow-none focus:outline-none"
          />
        </label>
        <Button type="submit" size="lg">
          Search
        </Button>
      </form>

      {/* Category pills */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-2 pt-1 sm:mx-0 sm:px-0">
        <FilterPill active={!category} onClick={() => update({ category: undefined })}>
          All
        </FilterPill>
        {categories?.map((entry) => (
          <FilterPill
            key={entry.slug}
            active={category === entry.slug}
            onClick={() => update({ category: entry.slug })}
          >
            <CategoryIcon category={entry.slug} className="size-4" />
            {CATEGORY_PLURAL[entry.slug]}
            <span className="tabular-nums opacity-60">{entry.count}</span>
          </FilterPill>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-edge pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            Sort
          </span>
          <div className="flex gap-1">
            {SORTS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => update({ sort: option.value })}
                aria-pressed={sort === option.value}
                className={cn(
                  'border-2 border-edge px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.04em] transition-colors duration-[120ms]',
                  sort === option.value
                    ? 'bg-cobalt text-white'
                    : 'bg-surface text-muted hover:bg-surface-2 hover:text-body',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            Pricing
          </span>
          {PRICING.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => update({ pricing: pricing === option ? undefined : option })}
              aria-pressed={pricing === option}
              className={cn(
                'border-2 border-edge px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.04em] transition-colors duration-[120ms]',
                pricing === option
                  ? 'bg-acid text-ink'
                  : 'bg-surface text-muted hover:bg-surface-2 hover:text-body',
              )}
            >
              {PRICING_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {activeFilters > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-bold uppercase text-muted">
            {query.isLoading ? 'Filtering' : `${total} ${total === 1 ? 'result' : 'results'}`}
          </span>
          {search && (
            <RemovableChip onRemove={() => update({ search: undefined })}>“{search}”</RemovableChip>
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
          {tag && <RemovableChip onRemove={() => update({ tag: undefined })}>#{tag}</RemovableChip>}
          <button
            type="button"
            onClick={() => setParams(new URLSearchParams({ sort }), { preventScrollReset: true })}
            className="font-mono text-[11px] font-bold uppercase text-muted underline-offset-2 hover:text-body hover:underline"
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
                className="animate-[var(--animate-slide-up)]"
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              />
            ))}
          </div>

          {pages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-10 flex items-center justify-between gap-4 border-t-2 border-edge pt-6"
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) }, false)}
              >
                ← Previous
              </Button>
              <span className="font-mono text-[11px] font-bold uppercase tabular-nums text-muted">
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
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-2 border-edge px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.04em]',
        'transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm',
        active ? 'bg-cobalt text-white shadow-hard-sm' : 'bg-surface text-body',
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
    <span className="inline-flex items-center gap-1.5 border-2 border-edge bg-surface-2 py-0.5 pl-2 pr-1 font-mono text-[11px] font-bold uppercase">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove filter"
        className="flex size-4 items-center justify-center text-muted transition-colors hover:bg-edge hover:text-canvas"
      >
        <span aria-hidden="true" className="text-[10px]">
          ✕
        </span>
      </button>
    </span>
  );
}
