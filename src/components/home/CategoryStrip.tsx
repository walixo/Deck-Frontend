import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCategories } from '@/hooks/useMeta';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { CATEGORY_PLURAL, gradientFor } from '@/lib/utils';

/** Horizontally scrollable category tiles — the fastest way into the catalogue. */
export function CategoryStrip() {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-40 shrink-0 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!categories?.length) return null;

  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {categories.map((category, index) => (
        <Link
          key={category.slug}
          to={`/discover?category=${category.slug}`}
          style={{ animationDelay: `${index * 45}ms` }}
          className="group relative w-40 shrink-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 transition-all duration-300 animate-[var(--animate-fade-up)] hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[var(--shadow-lifted)] dark:border-zinc-800 dark:bg-[color:var(--color-surface-dark)] dark:hover:border-zinc-700"
        >
          <span
            aria-hidden="true"
            className={`absolute -right-6 -top-6 size-16 rounded-full bg-gradient-to-br opacity-15 blur-xl transition-all duration-500 group-hover:opacity-35 group-hover:blur-lg ${gradientFor(category.slug)}`}
          />
          <span
            aria-hidden="true"
            className="relative flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-brand-500/10 dark:group-hover:text-brand-400"
          >
            <CategoryIcon category={category.slug} className="size-[18px]" />
          </span>
          <p className="relative mt-3 text-sm font-medium leading-tight">
            {CATEGORY_PLURAL[category.slug]}
          </p>
          <p className="relative mt-0.5 text-xs tabular-nums text-zinc-500 dark:text-zinc-500">
            {category.count} {category.count === 1 ? 'launch' : 'launches'}
          </p>
        </Link>
      ))}
    </div>
  );
}
