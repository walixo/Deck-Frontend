import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MerchCard } from '@/components/merch/MerchCard';
import { Backdrop } from '@/components/ui/Ambient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState, InlineAlert } from '@/components/ui/States';
import { useCart } from '@/hooks/useCart';
import { useMerchProduct } from '@/hooks/useMerch';
import { cn, colourFor, formatMoney, MERCH_CATEGORY_LABELS } from '@/lib/utils';
import type { MerchVariant } from '@/types';

export function MerchDetail() {
  const { slug = '' } = useParams();
  const { data: product, isLoading, isError, error, refetch } = useMerchProduct(slug);
  const { add } = useCart();
  const navigate = useNavigate();

  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState message={error.message} onRetry={() => void refetch()} />
        <div className="mt-6 text-center">
          <Link
            to="/shop"
            className="font-mono text-[12px] font-bold uppercase underline-offset-4 hover:underline"
          >
            ← Back to the shop
          </Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const colour = colourFor(product.slug);
  const image = product.images[activeImage];

  // A product with one unlabelled variant needs no picker — preselect it.
  const singleVariant = product.variants.length === 1 ? product.variants[0] : undefined;
  const selected: MerchVariant | undefined =
    singleVariant ?? product.variants.find((variant) => variant.sku === selectedSku);

  const needsChoice = !singleVariant && !selected;
  const canAdd = Boolean(selected?.inStock);

  const addToCart = () => {
    if (!selected) return;
    add({
      sku: selected.sku,
      slug: product.slug,
      name: product.name,
      size: selected.size,
      colour: selected.colour,
      unitPriceMinor: product.priceMinor,
      image: product.images[0],
      maxStock: selected.stock,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="relative isolate">
      <Backdrop pattern="halftone" />

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 font-mono text-[11px] font-bold uppercase text-muted"
        >
          <Link to="/shop" className="hover:text-body">
            Shop
          </Link>
          <span aria-hidden="true">/</span>
          <Link to={`/shop?category=${product.category}`} className="hover:text-body">
            {MERCH_CATEGORY_LABELS[product.category] ?? product.category}
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Imagery */}
          <div>
            <div className="border-2 border-edge shadow-hard">
              {image ? (
                <img
                  src={image}
                  alt={product.name}
                  className="aspect-square w-full bg-surface-2 object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex aspect-square w-full items-center justify-center',
                    colour.bg,
                    colour.ink,
                  )}
                >
                  <span className="font-display text-7xl uppercase tracking-tight">
                    {product.name.slice(0, 2)}
                  </span>
                </div>
              )}
            </div>

            {product.images.length > 1 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.images.map((entry, index) => (
                  <li key={entry}>
                    <button
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-current={index === activeImage}
                      aria-label={`Show image ${index + 1}`}
                      className={cn(
                        'block border-2 transition-transform duration-[120ms] hover:-translate-y-0.5',
                        index === activeImage
                          ? 'border-cobalt'
                          : 'border-edge opacity-60 hover:opacity-100',
                      )}
                    >
                      <img src={entry} alt="" className="size-16 bg-surface-2 object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Detail + buy */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {product.featured && <Badge tone="accent">★ Pick</Badge>}
              {product.soldOut && <Badge tone="invert">Sold out</Badge>}
            </div>

            <h1 className="display-tight mt-3 text-4xl uppercase text-balance">{product.name}</h1>
            <p className="mt-3 text-base leading-relaxed text-muted text-pretty">
              {product.tagline}
            </p>

            <p className="mt-5 font-display text-3xl">
              {formatMoney(product.priceMinor, product.currency)}
            </p>

            {/* Variants */}
            {!singleVariant && (
              <fieldset className="mt-6">
                <legend className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em]">
                  {product.variants.some((variant) => variant.size) ? 'Size' : 'Option'}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const label = variant.size ?? variant.colour ?? variant.sku;
                    const isSelected = selected?.sku === variant.sku;
                    return (
                      <button
                        key={variant.sku}
                        type="button"
                        disabled={!variant.inStock}
                        onClick={() => setSelectedSku(variant.sku)}
                        aria-pressed={isSelected}
                        className={cn(
                          'min-w-12 border-2 border-edge px-3 py-2 font-mono text-[12px] font-bold uppercase transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)]',
                          !variant.inStock
                            ? // Sold-out options stay visible but struck through.
                              'cursor-not-allowed bg-surface-2 text-muted line-through opacity-60'
                            : isSelected
                              ? 'bg-cobalt text-white shadow-hard-sm'
                              : 'bg-surface hover:-translate-y-0.5 hover:bg-acid hover:text-ink hover:shadow-hard-sm',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {selected && selected.inStock && selected.stock <= 5 && (
              <p className="mt-3 inline-block border-2 border-edge bg-acid px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-ink">
                Only {selected.stock} left
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                disabled={!canAdd}
                onClick={addToCart}
                title={needsChoice ? 'Choose an option first' : undefined}
              >
                {product.soldOut
                  ? 'Sold out'
                  : needsChoice
                    ? 'Choose an option'
                    : canAdd
                      ? 'Add to cart'
                      : 'Unavailable'}
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/cart')}>
                View cart
              </Button>
            </div>

            {added && (
              <div className="mt-4">
                <InlineAlert tone="success">
                  Added to your cart. <Link to="/cart" className="underline">Check out →</Link>
                </InlineAlert>
              </div>
            )}

            <div className="mt-8 space-y-4 border-t-2 border-edge pt-6 text-sm leading-relaxed text-body text-pretty">
              {product.description
                .split('\n')
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
          </div>
        </div>

        {product.related.length > 0 && (
          <section aria-labelledby="related-merch" className="mt-16">
            <h2 id="related-merch" className="mb-5 text-xl uppercase">
              More {MERCH_CATEGORY_LABELS[product.category] ?? product.category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.related.map((entry) => (
                <MerchCard key={entry.id} product={entry} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
