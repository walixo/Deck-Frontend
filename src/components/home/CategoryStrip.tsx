import { Link } from 'react-router-dom';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCategories } from '@/hooks/useMeta';
import { CATEGORY_PLURAL, colourFor } from '@/lib/utils';

/** Horizontally scrollable category tiles — the fastest way into the catalogue. */
export function CategoryStrip() {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-40 shrink-0" />
        ))}
      </div>
    );
  }

  if (!categories?.length) return null;

  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 pt-1 sm:mx-0 sm:px-0">
      {categories.map((category, index) => {
        const colour = colourFor(category.slug);
        return (
          <Link
            key={category.slug}
            to={`/discover?category=${category.slug}`}
            style={{ animationDelay: `${index * 45}ms` }}
            className="group w-40 shrink-0 animate-[var(--animate-slide-up)] rounded-slab border-2 border-edge bg-surface p-4 shadow-hard transition-[transform,box-shadow] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg"
          >
            <span
              aria-hidden="true"
              className={`flex size-10 items-center justify-center border-2 border-edge ${colour.bg} ${colour.ink}`}
            >
              <CategoryIcon category={category.slug} className="size-5" />
            </span>
            <p className="mt-3 font-display text-sm uppercase leading-tight">
              {CATEGORY_PLURAL[category.slug]}
            </p>
            <p className="mt-1 font-mono text-[11px] font-bold uppercase tabular-nums text-muted">
              {category.count} {category.count === 1 ? 'launch' : 'launches'}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
