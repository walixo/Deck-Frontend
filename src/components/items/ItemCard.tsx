import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Stars } from '@/components/ui/Stars';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { CATEGORY_LABELS, MEDAL_STYLES, cn, PRICING_LABELS } from '@/lib/utils';
import type { Item } from '@/types';
import { ItemLogo } from './ItemLogo';
import { VoteButton } from './VoteButton';

interface ItemCardProps {
  item: Item;
  rank?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ItemCard({ item, rank, className, style }: ItemCardProps) {
  return (
    <article
      style={style}
      className={cn(
        'group relative rounded-2xl border border-zinc-200/80 bg-white p-4 transition-all duration-300 sm:p-5',
        'hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[var(--shadow-lifted)]',
        'dark:border-zinc-800 dark:bg-[color:var(--color-surface-dark)] dark:hover:border-zinc-700',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {rank !== undefined && (
          <span
            className={cn(
              'mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ring-1',
              MEDAL_STYLES[rank] ??
                'bg-zinc-100 text-zinc-500 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700',
            )}
            aria-label={`Rank ${rank}`}
          >
            {rank}
          </span>
        )}

        <ItemLogo item={item} size="md" className="mt-0.5" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate text-base font-semibold">
              {/* The whole card is clickable via this stretched link. */}
              <Link to={`/item/${item.slug}`} className="hover:underline">
                <span className="absolute inset-0 z-0" aria-hidden="true" />
                <span className="relative">{item.name}</span>
              </Link>
            </h3>
            {item.featured && (
              <Badge tone="accent" className="relative z-10">
                Spotlight
              </Badge>
            )}
          </div>

          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600 text-pretty dark:text-zinc-400">
            {item.tagline}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-500">
            <Link
              to={`/discover?category=${item.category}`}
              className="relative z-10 inline-flex items-center gap-1.5 font-medium text-zinc-600 transition-colors hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
            >
              <CategoryIcon category={item.category} className="size-3.5" />
              {CATEGORY_LABELS[item.category]}
            </Link>

            <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
              ·
            </span>
            <span>{PRICING_LABELS[item.pricing]}</span>

            {item.reviewCount > 0 && (
              <>
                <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Stars value={item.ratingAvg} />
                  <span className="tabular-nums">{item.ratingAvg.toFixed(1)}</span>
                </span>
              </>
            )}

            {item.commentCount > 0 && (
              <>
                <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
                  ·
                </span>
                <span className="tabular-nums">
                  {item.commentCount} {item.commentCount === 1 ? 'comment' : 'comments'}
                </span>
              </>
            )}
          </div>
        </div>

        <VoteButton item={item} className="relative z-10 mt-0.5" />
      </div>
    </article>
  );
}
