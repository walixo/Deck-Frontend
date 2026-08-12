import { Link } from 'react-router-dom';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { Badge } from '@/components/ui/Badge';
import { Stars } from '@/components/ui/Stars';
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
        'group relative rounded-slab border-2 border-edge bg-surface p-4 shadow-hard',
        'transition-[transform,box-shadow] duration-[120ms] ease-[var(--ease-snap)]',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg',
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        {rank !== undefined && (
          <span
            className={cn(
              'mt-0.5 flex size-7 shrink-0 items-center justify-center border-2 border-edge font-mono text-xs font-bold tabular-nums',
              MEDAL_STYLES[rank] ?? 'bg-surface-2 text-muted',
            )}
            aria-label={`Rank ${rank}`}
          >
            {rank}
          </span>
        )}

        <ItemLogo item={item} size="md" className="mt-0.5" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate text-base uppercase leading-tight">
              {/* The whole card is clickable via this stretched link. */}
              <Link to={`/item/${item.slug}`} className="hover:underline">
                <span className="absolute inset-0 z-0" aria-hidden="true" />
                <span className="relative">{item.name}</span>
              </Link>
            </h3>
            {item.featured && (
              <Badge tone="accent" className="relative z-10">
                ★ Spotlight
              </Badge>
            )}
          </div>

          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted text-pretty">
            {item.tagline}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
            <Link
              to={`/discover?category=${item.category}`}
              className="relative z-10 inline-flex items-center gap-1.5 text-body transition-colors hover:text-cobalt"
            >
              <CategoryIcon category={item.category} className="size-3.5" />
              {CATEGORY_LABELS[item.category]}
            </Link>

            <span aria-hidden="true" className="text-muted/50">
              /
            </span>
            <span>{PRICING_LABELS[item.pricing]}</span>

            {item.reviewCount > 0 && (
              <>
                <span aria-hidden="true" className="text-muted/50">
                  /
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Stars value={item.ratingAvg} />
                  <span className="tabular-nums">{item.ratingAvg.toFixed(1)}</span>
                </span>
              </>
            )}

            {item.commentCount > 0 && (
              <>
                <span aria-hidden="true" className="text-muted/50">
                  /
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
