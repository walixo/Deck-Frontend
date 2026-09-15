import { useSearchParams } from 'react-router-dom';
import { AdSlot } from '@/components/ads/AdSlot';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { NoResultsIllustration } from '@/components/illustrations/Illustrations';
import { ItemCard } from '@/components/items/ItemCard';
import { PageBanner } from '@/components/ui/Ambient';
import { Button } from '@/components/ui/Button';
import { LaunchArchive } from '@/components/items/LaunchArchive';
import { NeoSelect } from '@/components/ui/NeoSelect';
import { ItemCardSkeletonList } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useItems } from '@/hooks/useItems';
import { useCategories } from '@/hooks/useMeta';
import { CategoryLabel } from '@/components/illustrations/CategoryIcon';
import { cn, PRICING_LABELS } from '@/lib/utils';
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
  /* The archive's selection. Empty means all time. */
  const on = params.get('on') ?? '';

  const query = useItems({ category, pricing, tag, sort, search, on: on || undefined, page, limit: PAGE_SIZE });

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

  const activeFilters = [category, pricing, tag, search, on].filter(Boolean).length;
  const total = query.data?.meta.total ?? 0;
  const pages = query.data?.meta.pages ?? 1;

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageBanner />

      {/*
       * Title and count on one line, and no standfirst.
       *
       * "Every launch on Deck, filterable by category, pricing and tag" was
       * describing the three controls sitting directly underneath it. A page
       * whose own filters are visible does not need a sentence explaining that
       * it has filters — and that sentence, its margin and the oversized title
       * were 112px of the 471px standing between arriving here and seeing a
       * launch.
       */}
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="display-tight text-3xl uppercase text-balance sm:text-4xl">Discover</h1>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
          {query.isLoading ? 'Loading' : `${total} ${total === 1 ? 'launch' : 'launches'}`}
        </p>
      </header>

      <AdSlot placement="discover" className="mb-6" />

      {/*
       * Content left, archive right.
       *
       * The rail is navigation through time and the list is the thing being
       * navigated, so it sits beside rather than above — and everything that
       * filters the list (search, categories, sort, pricing) collects on the
       * left with it, which is what moved the vote control into a rail down the
       * left edge of each row.
       *
       * Below xl the rail drops under the list rather than squeezing it: a
       * 14rem sidebar inside a 1024px container leaves the launches too narrow
       * to read, and the archive is the part somebody can scroll to.
       */}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="min-w-0">

      {/*
       * Search, sort and pricing on one line instead of three stacked blocks.
       *
       * They were 76px, 59px and 97px of vertical space — 232px of controls
       * above a list, for three inputs that between them are about forty
       * characters wide. Stacking them was never a layout decision, just the
       * order they were added in. The labels come off too: a search box with a
       * placeholder, a select reading "Trending" and one reading "Any" are each
       * self-describing, and `aria-label` carries what the eye no longer needs.
       */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get('search');
            update({ search: String(value ?? '').trim() || undefined });
          }}
          className="flex min-w-[16rem] flex-1 gap-2"
        >
          <label className="flex-1">
            <span className="sr-only">Search launches</span>
            {/* Uncontrolled and keyed to the URL: remounts when the query changes elsewhere. */}
            <input
              key={search}
              name="search"
              type="search"
              defaultValue={search}
              placeholder="SEARCH LAUNCHES"
              className="h-9 w-full rounded-slab border border-edge bg-surface px-3 font-mono text-[12px] font-bold uppercase tracking-[0.06em] shadow-[inset_2px_2px_0_var(--surface-2)] transition-[box-shadow,border-color] duration-[120ms] placeholder:text-muted/70 focus:border-accent focus:shadow-none focus:outline-none"
            />
          </label>
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>

        <NeoSelect
          label="Sort launches"
          value={sort}
          options={SORTS.map((option) => ({ value: option.value, label: option.label }))}
          onChange={(next) => update({ sort: next })}
          tone="grey"
          className="w-36"
        />

        <NeoSelect
          label="Filter by pricing"
          value={pricing ?? ''}
          /* An explicit "Any" row rather than relying on somebody knowing to
             click the selected chip again to clear it — which is what the
             previous chips required and nobody discovers. */
          options={[
            { value: '', label: 'Any price' },
            ...PRICING.map((option) => ({ value: option, label: PRICING_LABELS[option] })),
          ]}
          onChange={(next) => update({ pricing: next || undefined })}
          placeholder="Any price"
          tone="grey"
          className="w-36"
        />
      </div>

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
            <CategoryIcon category={entry.slug} className="size-3.5" />
            {entry.label}
            <span className="tabular-nums opacity-60">{entry.count}</span>
          </FilterPill>
        ))}
      </div>

      {on && (
        <p className="mb-4 flex flex-wrap items-center gap-2 border-b border-edge pb-3 font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
          <span className="text-muted">Showing</span>
          <span className="border border-edge bg-pop px-2 py-0.5 text-on-pop">
            {describeScope(on)}
          </span>
          <button
            type="button"
            onClick={() => update({ on: undefined })}
            className="text-muted underline-offset-2 hover:text-body hover:underline"
          >
            Clear
          </button>
        </p>
      )}

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
              <CategoryLabel slug={category} />
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
          {/*
           * A list of launches, with nothing drawn between them.
           *
           * No rules, no boxes — the separation is space alone, which is why the
           * rows carry generous vertical padding. Anything drawn between two
           * launches is a line the eye has to cross to get from one to the next,
           * and thirty of them turn a list into a ledger.
           */}
          {/*
           * Two columns from md, with nothing drawn between them.
           *
           * The separation is space alone — anything drawn between two launches
           * is a line the eye has to cross to get from one to the next, and
           * thirty of them turn a list into a ledger.
           *
           * Going two-up is what actually pays for the vertical space: a single
           * column showed four launches on a 900px screen, and no amount of
           * trimming chrome fixes that on its own. `measure` comes off with it —
           * it existed to stop the vote button being flung to the far edge of a
           * 900px column, and a half-width column does that job itself.
           */}
          <div className="grid gap-x-5 gap-y-1 md:grid-cols-2">
            {query.data.data.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                variant="plain"
                /* Hidden here for now. Commenting is unaffected — it lives on
                   the launch page, and the count is still in the metadata row. */
                showComment={false}
                className="animate-[var(--animate-slide-up)]"
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              />
            ))}
          </div>

          {pages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-10 flex items-center justify-between gap-4 border-t border-edge pt-6"
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

        {/* The rail. Sticky under the header so it stays reachable while the
            list scrolls — an archive you have to scroll back up to use is a
            list of dates, not navigation. */}
        <aside className="xl:sticky xl:top-20 xl:self-start">
          <LaunchArchive value={on} onPick={(next) => update({ on: next || undefined })} />
        </aside>
      </div>
    </div>
  );
}

/** "August 2026", "2026", or a full date — whichever depth was picked. */
function describeScope(on: string): string {
  const [year, month, day] = on.split('-');
  if (!month) return year;

  const name = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
  });
  return day ? `${Number(day)} ${name} ${year}` : `${name} ${year}`;
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
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border border-edge px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.04em]',
        'transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm',
        active ? 'bg-pop text-on-pop shadow-hard-sm' : 'bg-surface text-body',
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
    <span className="inline-flex items-center gap-1.5 border border-edge bg-surface-2 py-0.5 pl-2 pr-1 font-mono text-[11px] font-bold uppercase">
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
