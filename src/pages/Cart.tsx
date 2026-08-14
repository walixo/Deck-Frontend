import { Link } from 'react-router-dom';
import { PageBanner } from '@/components/ui/Ambient';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { useCart } from '@/hooks/useCart';
import { useShippingQuote } from '@/hooks/useMerch';
import { cn, colourFor, formatMoney } from '@/lib/utils';

export function Cart() {
  const { lines, subtotalMinor, count, setQuantity, remove, clear } = useCart();
  const { data: quote } = useShippingQuote(subtotalMinor);

  const shippingMinor = quote?.shippingMinor ?? 0;
  const totalMinor = subtotalMinor + shippingMinor;
  const threshold = quote?.freeShippingThresholdMinor ?? 0;
  const awayFromFree = threshold - subtotalMinor;

  return (
    <div className="relative isolate mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8">
        <h1 className="display-tight text-4xl uppercase sm:text-5xl">Your cart</h1>
        {count > 0 && (
          <p className="mt-3 font-mono text-[12px] font-bold uppercase text-muted">
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        )}
      </header>

      {lines.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Nothing in here yet. The shop is one click away."
          action={<ButtonLink to="/shop">Browse merch</ButtonLink>}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <ul className="space-y-3">
            {lines.map((line) => {
              const colour = colourFor(line.slug);
              return (
                <li
                  key={line.sku}
                  className="flex items-start gap-4 rounded-slab border-2 border-edge bg-surface p-4 shadow-hard"
                >
                  {line.image ? (
                    <img
                      src={line.image}
                      alt=""
                      className="size-20 shrink-0 border-2 border-edge bg-surface-2 object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-20 shrink-0 items-center justify-center border-2 border-edge font-display text-xl uppercase',
                        colour.bg,
                        colour.ink,
                      )}
                    >
                      {line.name.slice(0, 2)}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base uppercase leading-tight">
                      <Link to={`/shop/${line.slug}`} className="hover:underline">
                        {line.name}
                      </Link>
                    </h2>
                    <p className="mt-1 font-mono text-[11px] font-bold uppercase text-muted">
                      {[line.size, line.colour].filter(Boolean).join(' · ') || line.sku}
                    </p>
                    <p className="mt-2 font-display text-sm">
                      {formatMoney(line.unitPriceMinor)}
                      <span className="ml-2 font-sans text-xs font-normal text-muted">each</span>
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center border-2 border-edge">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.sku, line.quantity - 1)}
                          aria-label={`Reduce quantity of ${line.name}`}
                          className="flex size-8 items-center justify-center font-mono text-sm font-bold transition-colors hover:bg-surface-2"
                        >
                          −
                        </button>
                        <span className="w-9 text-center font-mono text-sm font-bold tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.sku, line.quantity + 1)}
                          disabled={line.quantity >= Math.min(10, line.maxStock)}
                          aria-label={`Increase quantity of ${line.name}`}
                          className="flex size-8 items-center justify-center font-mono text-sm font-bold transition-colors hover:bg-surface-2 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(line.sku)}
                        className="font-mono text-[11px] font-bold uppercase text-muted transition-colors hover:bg-edge hover:px-1 hover:text-canvas"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className="shrink-0 font-display text-base tabular-nums">
                    {formatMoney(line.unitPriceMinor * line.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>

          <aside className="lg:sticky lg:top-24">
            <Card className="p-5">
              <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
                Summary
              </h2>

              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="font-medium tabular-nums">{formatMoney(subtotalMinor)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Shipping</dt>
                  <dd className="font-medium tabular-nums">
                    {shippingMinor === 0 ? 'Free' : formatMoney(shippingMinor)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t-2 border-edge pt-2.5">
                  <dt className="font-display uppercase">Total</dt>
                  <dd className="font-display text-lg tabular-nums">{formatMoney(totalMinor)}</dd>
                </div>
              </dl>

              {awayFromFree > 0 && (
                <p className="mt-4 border-2 border-edge bg-surface-2 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase leading-relaxed">
                  {formatMoney(awayFromFree)} more for free shipping
                </p>
              )}

              <ButtonLink to="/checkout" size="md" className="mt-5 w-full">
                Checkout
              </ButtonLink>

              <div className="mt-3 flex items-center justify-between gap-2">
                <Link
                  to="/shop"
                  className="font-mono text-[11px] font-bold uppercase underline-offset-4 hover:underline"
                >
                  Keep shopping
                </Link>
                <Button variant="ghost" size="sm" onClick={clear}>
                  Empty cart
                </Button>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-muted">
                Prices are confirmed by the server at checkout, so anything that changed while the
                cart sat here will be reflected before you pay.
              </p>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
