import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { cn, colourFor, formatMoney, MERCH_CATEGORY_LABELS } from '@/lib/utils';
import type { MerchProduct } from '@/types';

interface MerchCardProps {
  product: MerchProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function MerchCard({ product, className, style }: MerchCardProps) {
  const colour = colourFor(product.slug);
  const image = product.images[0];

  return (
    <article
      style={style}
      className={cn(
        'group relative flex flex-col rounded-slab border-2 border-edge bg-surface shadow-hard',
        'transition-[transform,box-shadow] duration-[120ms] ease-[var(--ease-snap)]',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg',
        className,
      )}
    >
      <div className="relative border-b-2 border-edge">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="aspect-square w-full bg-surface-2 object-cover"
          />
        ) : (
          // No photography yet: a flat colour plate with the product initials.
          <div
            aria-hidden="true"
            className={cn(
              'flex aspect-square w-full items-center justify-center',
              colour.bg,
              colour.ink,
            )}
          >
            <span className="font-display text-5xl uppercase tracking-tight">
              {product.name.slice(0, 2)}
            </span>
          </div>
        )}

        {product.soldOut && (
          <span className="absolute left-3 top-3">
            <Badge tone="invert">Sold out</Badge>
          </span>
        )}
        {!product.soldOut && product.featured && (
          <span className="absolute left-3 top-3">
            <Badge tone="accent">★ Pick</Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base uppercase leading-tight">
          <Link to={`/shop/${product.slug}`} className="hover:underline">
            <span className="absolute inset-0 z-0" aria-hidden="true" />
            <span className="relative">{product.name}</span>
          </Link>
        </h3>

        {/* Who is selling it. Deck's own stock says so; a maker's links to
            their profile, which is the point of a marketplace — the seller is
            a person on the board, not an anonymous warehouse. The link sits
            above the card's full-bleed overlay so it stays clickable. */}
        <p className="relative z-10 mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
          {product.seller ? (
            <Link
              to={`/u/${product.seller.username}`}
              className="hover:text-body hover:underline underline-offset-2"
            >
              by {product.seller.name}
            </Link>
          ) : (
            'by Deck'
          )}
        </p>

        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted text-pretty">
          {product.tagline}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-display text-lg">
            {formatMoney(product.priceMinor, product.currency)}
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-muted">
            {MERCH_CATEGORY_LABELS[product.category] ?? product.category}
          </span>
        </div>
      </div>
    </article>
  );
}
