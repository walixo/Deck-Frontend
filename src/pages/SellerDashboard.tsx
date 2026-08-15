import { PageBanner } from '@/components/ui/Ambient';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import {
  useMyListings,
  useMyPayouts,
  useRetireListing,
  useSellerEarnings,
} from '@/hooks/useSeller';
import { formatMoney } from '@/lib/utils';
import type { MerchStatus } from '@/types';

/** How each review state reads. Rejection inverts, like every other refusal. */
const STATUS_TONE: Record<MerchStatus, string> = {
  draft: 'bg-surface-2 text-muted',
  pending: 'bg-grey text-ink',
  approved: 'bg-acid text-ink',
  rejected: 'bg-edge text-canvas',
};

const STATUS_LABEL: Record<MerchStatus, string> = {
  draft: 'Draft',
  pending: 'In review',
  approved: 'Live',
  rejected: 'Not accepted',
};

const dateOf = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/**
 * The seller's own page: what they are owed, what has been sent, and what they
 * have listed.
 *
 * Deck collects every payment, so "awaiting payout" is a debt on Deck's books
 * rather than money in anyone's bank. That distinction is the whole point of
 * this page and the copy states it outright — a figure labelled only "earnings"
 * would read as available cash.
 */
export function SellerDashboard() {
  const { data: earnings, isLoading: loadingEarnings } = useSellerEarnings();
  const { data: payouts } = useMyPayouts();
  const { data: listings, isLoading: loadingListings } = useMyListings();
  const retire = useRetireListing();

  if (loadingEarnings) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const nothingYet = earnings?.earnedMinor === 0 && !listings?.length;

  return (
    <div className="relative isolate mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 inline-block border-2 border-edge bg-lavender px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
            Selling
          </p>
          <h1 className="display-tight text-4xl uppercase text-balance">Your shop</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted text-pretty">
            Buyers pay Deck, and Deck pays you in regular disbursements. Shipping on your orders is
            yours too.
          </p>
        </div>
        <ButtonLink to="/sell/new">List a product</ButtonLink>
      </header>

      {nothingYet ? (
        <EmptyState
          title="Sell your own merch on Deck"
          description="List products alongside every other maker on the board. Nothing to set up first — put something up and Deck will review it."
          action={<ButtonLink to="/sell/new">List your first product</ButtonLink>}
        />
      ) : (
        <>
          {earnings && (
            <section aria-labelledby="ledger-heading" className="mb-12">
              <h2
                id="ledger-heading"
                className="mb-5 border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
              >
                Your money
              </h2>

              <dl className="grid gap-3 sm:grid-cols-3">
                <Figure
                  label="Earned"
                  value={formatMoney(earnings.earnedMinor, earnings.currency)}
                  note={
                    earnings.feePercent > 0
                      ? `After Deck's ${earnings.feePercent}% fee on goods`
                      : 'Deck takes no fee'
                  }
                  tone="bg-surface"
                />
                <Figure
                  label="Paid out"
                  value={formatMoney(earnings.paidOutMinor, earnings.currency)}
                  note={`${payouts?.data.length ?? 0} ${
                    payouts?.data.length === 1 ? 'disbursement' : 'disbursements'
                  }`}
                  tone="bg-surface"
                />
                <Figure
                  label="Awaiting payout"
                  value={formatMoney(earnings.owedMinor, earnings.currency)}
                  note="Held by Deck, sent in the next run"
                  tone="bg-lavender text-ink"
                />
              </dl>

              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <Figure
                  label="From merch"
                  value={formatMoney(earnings.merch.netMinor, earnings.currency)}
                  note={`${earnings.merch.orders} ${earnings.merch.orders === 1 ? 'order' : 'orders'}`}
                  tone="bg-surface-2"
                />
                <Figure
                  label="Of that, shipping"
                  value={formatMoney(earnings.merch.shippingMinor, earnings.currency)}
                  note="Passed through in full, no fee"
                  tone="bg-surface-2"
                />
                <Figure
                  label="From backers"
                  value={formatMoney(earnings.fundraise.netMinor, earnings.currency)}
                  note={`${earnings.fundraise.contributions} ${
                    earnings.fundraise.contributions === 1 ? 'contribution' : 'contributions'
                  }`}
                  tone="bg-surface-2"
                />
              </dl>
            </section>
          )}

          {payouts && payouts.data.length > 0 && (
            <section aria-labelledby="payouts-heading" className="mb-12">
              <h2
                id="payouts-heading"
                className="mb-5 border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
              >
                Disbursements
              </h2>
              <ul className="space-y-2">
                {payouts.data.map((payout) => (
                  <li
                    key={payout.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-2 border-edge bg-surface px-4 py-3"
                  >
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
                      {dateOf(payout.paidAt)} &middot; {payout.reference}
                    </span>
                    <span className="font-display text-base tabular-nums">
                      {formatMoney(payout.amountMinor, payout.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="listings-heading">
            <h2
              id="listings-heading"
              className="mb-5 border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
            >
              Your listings
            </h2>

            {loadingListings ? (
              <div className="space-y-3">
                {[0, 1, 2].map((row) => (
                  <Skeleton key={row} className="h-24 w-full" />
                ))}
              </div>
            ) : !listings?.length ? (
              <EmptyState
                title="Nothing listed yet"
                description="Put your first product up. Deck reviews new listings before they reach the shop."
                action={<ButtonLink to="/sell/new">List a product</ButtonLink>}
              />
            ) : (
              <ul className="space-y-3">
                {listings.map((product) => (
                  <li key={product.id}>
                    <Card className="flex flex-wrap items-center gap-4 p-4">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="size-16 shrink-0 border-2 border-edge object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex size-16 shrink-0 items-center justify-center border-2 border-edge bg-surface-2 font-display"
                        >
                          {product.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-base uppercase">{product.name}</p>
                          <span
                            className={`border-2 border-edge px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_TONE[product.status]}`}
                          >
                            {STATUS_LABEL[product.status]}
                          </span>
                          {!product.active && (
                            <span className="border-2 border-edge bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-muted">
                              Retired
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-mono text-[11px] font-bold tabular-nums text-muted">
                          {formatMoney(product.priceMinor, product.currency)} &middot;{' '}
                          {product.totalStock} in stock
                        </p>
                        {product.status === 'rejected' && product.rejectionReason && (
                          <p className="mt-1.5 text-xs leading-relaxed text-muted">
                            {product.rejectionReason}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <ButtonLink to={`/sell/${product.id}`} variant="secondary" size="sm">
                          Edit
                        </ButtonLink>
                        {product.active && (
                          <button
                            type="button"
                            onClick={() => retire.mutate(product.id)}
                            className="border-2 border-edge px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted transition-colors duration-[120ms] hover:bg-edge hover:text-canvas"
                          >
                            Retire
                          </button>
                        )}
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Figure({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <div className={`border-2 border-edge px-4 py-5 shadow-hard ${tone}`}>
      <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] opacity-80">
        {label}
      </dt>
      <dd className="mt-1.5 font-display text-2xl tabular-nums">{value}</dd>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] opacity-70">{note}</p>
    </div>
  );
}
