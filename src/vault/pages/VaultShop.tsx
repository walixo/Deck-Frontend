import { naira } from '../format';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Field';
import { EmptyState, InlineAlert } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { RequestError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useBuyCard, useShop, useStorefront } from '../useVault';

/** Every live merchant's shop. */
export function VaultShop() {
  const { data, isLoading } = useShop();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="display-tight text-3xl text-balance sm:text-4xl">Buy a gift card</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted text-pretty">
        For yourself, or send it to someone with a message. Cards are delivered the moment the
        payment clears.
      </p>

      {isLoading ? (
        <p className="mt-10 text-sm text-muted">Loading…</p>
      ) : data?.length ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((issuer) => (
            <Link key={issuer.slug} to={`/shop/${issuer.slug}`} className="group">
              <Card interactive className="h-full overflow-hidden">
                {/*
                 * Logos are other people's colours, so the tile they sit on is
                 * neutral — contract rule 1. The monogram fallback is grey for
                 * the same reason, never the accent.
                 */}
                <div className="flex h-28 items-center justify-center border-b border-line bg-surface-2">
                  {issuer.logoUrl ? (
                    <img
                      src={issuer.logoUrl}
                      alt=""
                      loading="lazy"
                      className="max-h-16 max-w-[60%] object-contain"
                    />
                  ) : (
                    <span className="font-display text-2xl text-muted">
                      {issuer.name.slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-display text-base">{issuer.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                    {issuer.tagline}
                  </p>
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                    {issuer.products.length} card{issuer.products.length === 1 ? '' : 's'}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            title="No shops are open yet"
            description="Merchants are still being approved. Check back shortly."
          />
        </div>
      )}
    </div>
  );
}

/** One merchant's shop, and the form that buys a card from it. */
export function VaultStorefront() {
  const { slug = '' } = useParams();
  const { data: shop, isLoading } = useStorefront(slug);
  const { isAuthenticated } = useAuth();
  const buy = useBuyCard(slug);

  const [productSlug, setProductSlug] = useState<string | null>(null);
  const [amountMinor, setAmountMinor] = useState<number | null>(null);
  const [gift, setGift] = useState({ recipientName: '', recipientEmail: '', giftMessage: '' });

  const error = buy.error instanceof RequestError ? buy.error : null;

  if (isLoading) return <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted">Loading…</p>;
  if (!shop) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="display-tight text-2xl">No shop at that address</h1>
        <Link to="/shop" className="mt-4 inline-block text-sm underline underline-offset-4">
          Back to the shop
        </Link>
      </div>
    );
  }

  const product = shop.products.find((entry) => entry.slug === productSlug) ?? shop.products[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/shop" className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted hover:text-body">
        ← All shops
      </Link>

      <header className="mt-6 flex items-start gap-4">
        {shop.logoUrl && (
          <img src={shop.logoUrl} alt="" className="size-14 rounded-2xl border border-line object-contain" />
        )}
        <div className="min-w-0">
          <h1 className="display-tight text-3xl">{shop.name}</h1>
          <p className="mt-1 text-sm text-muted">{shop.tagline}</p>
        </div>
      </header>

      {shop.description && (
        <p className="mt-6 text-sm leading-relaxed text-muted text-pretty">{shop.description}</p>
      )}

      <form
        className="mt-10 space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!product || !amountMinor) return;
          buy.mutate(
            {
              product: product.slug,
              amount: amountMinor / 100,
              recipientName: gift.recipientName.trim() || undefined,
              recipientEmail: gift.recipientEmail.trim() || undefined,
              giftMessage: gift.giftMessage.trim() || undefined,
            },
            { onSuccess: (result) => { window.location.href = result.checkoutUrl; } },
          );
        }}
      >
        {error && <InlineAlert>{error.message}</InlineAlert>}

        {shop.products.length > 1 && (
          <fieldset>
            <legend className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-body">
              Which card
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {shop.products.map((entry) => (
                <button
                  key={entry.slug}
                  type="button"
                  onClick={() => {
                    setProductSlug(entry.slug);
                    setAmountMinor(null);
                  }}
                  aria-pressed={product?.slug === entry.slug}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors',
                    product?.slug === entry.slug
                      ? 'border-line bg-deep text-on-deep'
                      : 'border-line bg-surface text-muted hover:text-body',
                  )}
                >
                  {entry.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {product && (
          <fieldset>
            <legend className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-body">
              Amount
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.denominationsMinor.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmountMinor(value)}
                  aria-pressed={amountMinor === value}
                  className={cn(
                    'rounded-2xl border px-4 py-2.5 font-display text-sm tabular-nums transition-colors',
                    amountMinor === value
                      ? 'border-line bg-deep text-on-deep'
                      : 'border-line bg-surface text-body hover:bg-surface-2',
                  )}
                >
                  {naira(value)}
                </button>
              ))}
            </div>
            {product.redeemInstructions && (
              <p className="mt-3 text-xs leading-relaxed text-muted">{product.redeemInstructions}</p>
            )}
          </fieldset>
        )}

        <div className="space-y-4 rounded-3xl border border-line bg-surface-2/40 p-5">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-body">
            Sending it to someone? (optional)
          </p>
          <Input
            label="Their name"
            value={gift.recipientName}
            onChange={(event) => setGift({ ...gift, recipientName: event.target.value })}
          />
          <Input
            label="Their email"
            type="email"
            value={gift.recipientEmail}
            onChange={(event) => setGift({ ...gift, recipientEmail: event.target.value })}
          />
          <Textarea
            label="Message"
            value={gift.giftMessage}
            onChange={(event) => setGift({ ...gift, giftMessage: event.target.value })}
            placeholder="Happy birthday — dinner's on me."
          />
        </div>

        {shop.terms && (
          <details className="rounded-2xl border border-line p-4">
            <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              Terms
            </summary>
            <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-muted">{shop.terms}</p>
          </details>
        )}

        {isAuthenticated ? (
          <Button type="submit" size="lg" disabled={!amountMinor} loading={buy.isPending}>
            {amountMinor ? `Pay ${naira(amountMinor)}` : 'Choose an amount'}
          </Button>
        ) : (
          <a
            href={`https://onedeck.africa/login?next=${encodeURIComponent(window.location.href)}`}
            className="inline-block rounded-xl bg-deep px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-on-deep"
          >
            Sign in to buy
          </a>
        )}
      </form>
    </div>
  );
}
