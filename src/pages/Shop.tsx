import { Link, useSearchParams } from 'react-router-dom';
import { MerchCard } from '@/components/merch/MerchCard';
import { PageBanner } from '@/components/ui/Ambient';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useCart } from '@/hooks/useCart';
import { useMerchCategories, useMerchList } from '@/hooks/useMerch';
import { cn, formatMoney, MERCH_CATEGORY_LABELS } from '@/lib/utils';
import type { MerchCategory, MerchSort } from '@/types';

const SORTS: { value: MerchSort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price ↑' },
  { value: 'price-high', label: 'Price ↓' },
];

export function Shop() {
  const [params, setParams] = useSearchParams();
  const { data: categories } = useMerchCategories();
  const { count, subtotalMinor } = useCart();

  const category = (params.get('category') as MerchCategory | null) ?? undefined;
  const sort = (params.get('sort') as MerchSort | null) ?? 'featured';

  const query = useMerchList({ category, sort, limit: 24 });

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { preventScrollReset: true });
  };

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
            Shop
          </p>
          <h1 className="display-tight text-3xl text-balance sm:text-4xl">Deck merch</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted text-pretty">
            Small runs, printed properly. Every order helps keep the board free to use.
          </p>
        </div>

        {count > 0 && (
          <Link
            to="/cart"
            className="rounded-2xl flex items-center gap-3 border border-line bg-surface px-4 py-2.5 shadow-hard-sm transition-[transform,box-shadow] duration-300 ease-[var(--ease-snap)] hover:-translate-y-0.5 hover:shadow-hard"
          >
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em]">
              Cart · {count}
            </span>
            <span className="font-display text-sm">{formatMoney(subtotalMinor)}</span>
          </Link>
        )}
      </header>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill active={!category} onClick={() => update({ category: undefined })}>
            All
          </FilterPill>
          {categories?.map((entry) => (
            <FilterPill
              key={entry.slug}
              active={category === entry.slug}
              onClick={() => update({ category: entry.slug })}
            >
              {MERCH_CATEGORY_LABELS[entry.slug] ?? entry.slug}
              <span className="tabular-nums opacity-60">{entry.count}</span>
            </FilterPill>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
            Sort
          </span>
          {SORTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update({ sort: option.value })}
              aria-pressed={sort === option.value}
              className={cn(
                'rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.04em] transition-colors duration-300',
                sort === option.value ? 'glass-ink' : 'glass-secondary text-muted hover:text-body',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {query.isLoading ? (
        /* Eight placeholders for a four-wide grid: six left a ragged second row
           the real content never has. */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-80 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : query.data?.data.length ? (
        /* Four across at xl, three at lg. A fourth column inside the 1024px lg
           container gives each card ~240px, and a merch card carries a price, a
           name and a seller — below about 260px the name starts wrapping to
           three lines and the row loses its rhythm. */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {query.data.data.map((product, index) => (
            <MerchCard
              key={product.id}
              product={product}
              className="animate-[var(--animate-slide-up)]"
              style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing in this section yet"
          description="New drops land here first."
          action={
            <Button variant="secondary" onClick={() => setParams(new URLSearchParams())}>
              Show everything
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
        'rounded-full inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.04em]',
        'transition-[transform,box-shadow,background-color] duration-300 ease-[var(--ease-snap)] hover:-translate-y-0.5',
        active ? 'glass-ink' : 'glass-secondary',
      )}
    >
      {children}
    </button>
  );
}
