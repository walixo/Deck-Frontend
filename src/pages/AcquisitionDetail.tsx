import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CategoryLabel } from '@/components/illustrations/CategoryIcon';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Field';
import { Money } from '@/components/ui/Money';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState, InlineAlert } from '@/components/ui/States';
import { VerifiedMark } from '@/components/ui/VerifiedMark';
import { useAuth } from '@/hooks/useAuth';
import {
  useAcceptBid,
  useAcquisition,
  useBid,
  useWithdrawAcquisition,
  useWithdrawBid,
} from '@/hooks/useAcquisitions';
import { useWallColour } from '@/hooks/useDominantColour';
import { RequestError } from '@/lib/api';
import { cn, formatMoney, formatNumber, relativeTime, profilePath } from '@/lib/utils';
import { ASSET_LABELS, type AcquisitionDetail as Listing, type Bid } from '@/types';

/**
 * One listing, in full: the terms, and the way to make an offer.
 *
 * The page is deliberately explicit about what Deck is doing, in the panel
 * under the offer form. Deck lists, takes offers and records the agreed price
 * and its commission — it does not hold anybody's money. A marketplace that
 * lets a buyer assume there is escrow when there is not is one dispute away
 * from being the defendant.
 */
export function AcquisitionDetail() {
  const { slug = '' } = useParams();
  const { data: listing, isLoading, isError, error, refetch } = useAcquisition(slug);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const withdraw = useWithdrawAcquisition(slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState message={error.message} onRetry={() => void refetch()} />
        <div className="mt-6 text-center">
          <Link
            to="/acquisitions"
            className="font-mono text-[12px] font-bold uppercase underline-offset-4 hover:underline"
          >
            ← All listings
          </Link>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const isSeller = user?.id === listing.seller?.id;
  const isStaff = user?.role === 'admin';
  const sold = listing.status === 'sold';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 font-mono text-[11px] font-bold uppercase text-muted"
      >
        <Link to="/acquisitions" className="hover:text-body">
          Acquisitions
        </Link>
        {listing.item && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/item/${listing.item.slug}`} className="hover:text-body">
              {listing.item.name}
            </Link>
          </>
        )}
      </nav>

      <Header listing={listing} />

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="why-heading">
            <h2 id="why-heading" className="text-lg uppercase">
              Why it is for sale
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-body text-pretty">
              {listing.reason
                .split('\n')
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
          </section>

          <section aria-labelledby="included-heading">
            <h2 id="included-heading" className="text-lg uppercase">
              What is included
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {listing.assets.map((asset) => (
                <li
                  key={asset}
                  className="border border-edge bg-surface px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] shadow-hard-sm"
                >
                  {ASSET_LABELS[asset]}
                </li>
              ))}
            </ul>

            {listing.notes && (
              <p className="mt-4 border border-edge bg-surface-2 px-3 py-2.5 text-xs leading-relaxed text-muted text-pretty">
                {listing.notes}
              </p>
            )}
          </section>

          {/* Offers, to the people entitled to read them. */}
          {(isSeller || isStaff) && (
            <BidList listing={listing} canAccept={isSeller && !sold} slug={slug} />
          )}
        </div>

        <aside className="space-y-6">
          <Card className="p-5">
            <h2 className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
              {sold ? 'Sold' : 'Make an offer'}
            </h2>

            {sold ? (
              <div className="mt-4 space-y-3">
                <p className="border border-edge bg-success px-3 py-2 font-mono text-[11px] font-bold uppercase text-ink">
                  Sold for {formatMoney(listing.soldMinor, listing.currency)}
                </p>
                <p className="text-xs leading-relaxed text-muted text-pretty">
                  {listing.soldAt && `Agreed ${relativeTime(listing.soldAt)}.`} Deck&apos;s{' '}
                  {listing.feePercent}% on this sale was{' '}
                  {formatMoney(listing.soldFeeMinor, listing.currency)}.
                </p>
              </div>
            ) : isSeller ? (
              <p className="mt-4 text-xs leading-relaxed text-muted text-pretty">
                This is your listing. Offers appear on the left as they come in — you decide which
                one to accept, and nothing happens until you do.
              </p>
            ) : !isAuthenticated ? (
              <p className="mt-4 border border-edge bg-surface-2 px-3 py-2.5 text-sm text-muted">
                <Link to="/login" className="font-bold underline underline-offset-2">
                  Sign in
                </Link>{' '}
                to make an offer.
              </p>
            ) : (
              <OfferForm listing={listing} slug={slug} />
            )}

            {/*
             * What Deck is actually doing, said plainly.
             *
             * Present on every state including sold. A buyer needs to know
             * before they offer that nothing is held, and a seller needs to
             * know that accepting is an agreement rather than a payout.
             */}
            <dl className="mt-5 space-y-2 border-t border-edge pt-4 text-xs leading-relaxed text-muted">
              <div className="flex justify-between gap-3">
                <dt>Deck&apos;s commission</dt>
                <dd className="font-mono font-bold tabular-nums text-body">
                  {listing.feePercent}%
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>At the asking price</dt>
                <dd className="font-mono tabular-nums">
                  {formatMoney(listing.feeMinor, listing.currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Seller keeps</dt>
                <dd className="font-mono tabular-nums">
                  {formatMoney(listing.netMinor, listing.currency)}
                </dd>
              </div>
              <p className="pt-2 text-pretty">
                Deck lists the product, carries the offers and records what was agreed. Deck does
                not hold the money — payment and handover happen between buyer and seller, and Deck
                invoices its commission against the accepted offer.
              </p>
            </dl>
          </Card>

          {listing.seller && (
            <Card className="p-5">
              <h2 className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
                Seller
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <Avatar user={listing.seller} size="md" />
                <div className="min-w-0">
                  <Link
                    to={profilePath(listing.seller.username)}
                    className="flex items-center gap-1 font-display text-sm uppercase hover:underline"
                  >
                    {listing.seller.name}
                    {listing.seller.verified && <VerifiedMark name={listing.seller.name} />}
                  </Link>
                  {listing.seller.headline && (
                    <p className="mt-0.5 truncate text-xs text-muted">{listing.seller.headline}</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {(isSeller || isStaff) && !sold && (
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              loading={withdraw.isPending}
              onClick={() => {
                const confirmed = window.confirm(
                  'Take this listing down? Every open offer is declined with it.',
                );
                if (confirmed) {
                  withdraw.mutate(undefined, { onSuccess: () => navigate('/acquisitions') });
                }
              }}
            >
              {isSeller ? 'Withdraw listing' : 'Remove listing'}
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
}

/** The product, and the asking price at the size it deserves. */
function Header({ listing }: { listing: Listing }) {
  const item = listing.item;
  const swatch = useWallColour(item?.wallColour, item?.logoUrl);

  return (
    <header className="overflow-hidden rounded-slab border border-edge shadow-hard-lg">
      <div className="flex flex-wrap items-start gap-4 bg-surface p-5 sm:p-6">
        {item?.logoUrl ? (
          <img
            src={item.logoUrl}
            alt=""
            className="size-16 shrink-0 border border-edge bg-bone object-contain p-1.5"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="display-tight text-3xl uppercase sm:text-4xl">
              {item?.name ?? listing.slug}
            </h1>
            {listing.status === 'pending' && (
              <span className="border border-edge bg-warning px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink">
                Awaiting review
              </span>
            )}
            {listing.status === 'rejected' && (
              <span className="border border-edge bg-edge px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-canvas">
                Not approved
              </span>
            )}
          </div>

          {item?.tagline && (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted text-pretty">
              {item.tagline}
            </p>
          )}

          <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-muted">
            {item?.category && <CategoryLabel slug={item.category} />}
            <span aria-hidden="true">/</span>
            <span>{formatNumber(item?.voteCount ?? 0)} votes on Deck</span>
            <span aria-hidden="true">/</span>
            <span>listed {relativeTime(listing.createdAt)}</span>
          </p>
        </div>
      </div>

      {listing.status === 'rejected' && listing.reviewNote && (
        <p className="border-t border-edge bg-surface-2 px-5 py-3 text-xs leading-relaxed text-muted text-pretty">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-body">
            Deck&apos;s note
          </span>
          <br />
          {listing.reviewNote}
        </p>
      )}

      <div
        className="flex flex-wrap items-end justify-between gap-4 border-t border-edge px-5 py-4 sm:px-6"
        style={
          swatch
            ? {
                background: `linear-gradient(135deg, ${swatch.hex}, ${swatch.gradientTo})`,
                color: swatch.ink,
              }
            : undefined
        }
      >
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] opacity-80">
            Asking price {listing.negotiable ? '· open to offers' : '· firm'}
          </p>
          <p className="font-display text-[clamp(2.25rem,7vw,3.75rem)] leading-none tabular-nums">
            <Money
              minor={listing.askingMinor}
              approxClassName="!text-current text-base font-normal opacity-75"
            />
          </p>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] opacity-90">
          <div>
            <dt className="opacity-70">Revenue / mo</dt>
            <dd className="font-display text-sm tabular-nums">
              {formatMoney(listing.monthlyRevenueMinor, listing.currency)}
            </dd>
          </div>
          <div>
            <dt className="opacity-70">Costs / mo</dt>
            <dd className="font-display text-sm tabular-nums">
              {formatMoney(listing.monthlyCostMinor, listing.currency)}
            </dd>
          </div>
          <div>
            <dt className="opacity-70">Users</dt>
            <dd className="font-display text-sm tabular-nums">
              {formatNumber(listing.activeUsers)}
            </dd>
          </div>
          <div>
            <dt className="opacity-70">Offers</dt>
            <dd className="font-display text-sm tabular-nums">{listing.bidCount}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}

/**
 * The offer form.
 *
 * Prefilled with the asking price, because that is the offer most people mean
 * to make and typing it again is friction with no purpose. Shows what Deck
 * would take on *your* number, live, so neither side is doing percentages in
 * their head.
 */
function OfferForm({ listing, slug }: { listing: Listing; slug: string }) {
  const bid = useBid(slug);
  const withdrawBid = useWithdrawBid(slug);

  const existing = listing.yourBid;
  const [amount, setAmount] = useState<number | ''>(
    existing ? existing.amountMinor / 100 : listing.askingMinor / 100,
  );
  const [message, setMessage] = useState(existing?.message ?? '');

  const error = bid.error instanceof RequestError ? bid.error : null;
  const offerMinor = typeof amount === 'number' ? Math.round(amount * 100) : 0;
  const feeMinor = Math.round((offerMinor * listing.feePercent) / 100);

  const below = offerMinor > 0 && offerMinor < listing.askingMinor;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        bid.mutate({ amount: Number(amount) || 0, message: message.trim() });
      }}
      className="mt-4 space-y-4"
      noValidate
    >
      {existing && (
        <p className="border border-edge bg-surface-2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.06em]">
          Your offer: {formatMoney(existing.amountMinor, existing.currency)}
        </p>
      )}

      {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

      <Input
        label="Your offer"
        type="number"
        inputMode="numeric"
        required
        min={50_000}
        step={10_000}
        value={amount}
        onChange={(event) =>
          setAmount(event.target.value === '' ? '' : Number(event.target.value))
        }
        error={error?.fieldError('amount')}
        hint={`In whole ${listing.currency}.`}
      />

      {/* Live arithmetic, so nobody is surprised by the split later. */}
      {offerMinor > 0 && (
        <dl className="space-y-1 border border-edge bg-surface-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
          <div className="flex justify-between gap-2">
            <dt>Deck&apos;s {listing.feePercent}%</dt>
            <dd className="tabular-nums">{formatMoney(feeMinor, listing.currency)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Seller receives</dt>
            <dd className="tabular-nums text-body">
              {formatMoney(offerMinor - feeMinor, listing.currency)}
            </dd>
          </div>
        </dl>
      )}

      {below && !listing.negotiable && (
        <p className="border border-edge bg-warning px-3 py-2 font-mono text-[10px] font-bold uppercase leading-relaxed tracking-[0.06em] text-ink">
          The seller has set a firm price. This offer will be refused.
        </p>
      )}

      <Textarea
        label="Your pitch"
        required
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        error={error?.fieldError('message')}
        maxLength={1500}
        hint="Who you are and what you would do with it. Sellers read this before the number."
        counter={`${message.length}/1500`}
      />

      <Button type="submit" className="w-full" loading={bid.isPending}>
        {existing ? 'Update offer' : 'Make offer'}
      </Button>

      {existing && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          loading={withdrawBid.isPending}
          onClick={() => withdrawBid.mutate(existing.id)}
        >
          Withdraw my offer
        </Button>
      )}

      <p className="text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.06em] text-muted">
        An offer is an expression of interest, not a payment. Nothing is charged.
      </p>
    </form>
  );
}

/** Offers, highest first. Seller and staff only. */
function BidList({
  listing,
  canAccept,
  slug,
}: {
  listing: Listing;
  canAccept: boolean;
  slug: string;
}) {
  const accept = useAcceptBid(slug);

  if (listing.bids.length === 0) {
    return (
      <section aria-labelledby="offers-heading">
        <h2 id="offers-heading" className="text-lg uppercase">
          Offers
        </h2>
        <p className="mt-3 border border-edge bg-surface-2 px-4 py-3 text-sm text-muted">
          No offers yet. They appear here the moment somebody makes one.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="offers-heading">
      <h2 id="offers-heading" className="text-lg uppercase">
        Offers <span className="font-mono text-sm text-muted">({listing.bids.length})</span>
      </h2>

      <ul className="mt-4 space-y-3">
        {listing.bids.map((entry) => (
          <BidRow
            key={entry.id}
            bid={entry}
            listing={listing}
            canAccept={canAccept && entry.status === 'active'}
            onAccept={() => accept.mutate(entry.id)}
            accepting={accept.isPending}
          />
        ))}
      </ul>
    </section>
  );
}

function BidRow({
  bid,
  listing,
  canAccept,
  onAccept,
  accepting,
}: {
  bid: Bid;
  listing: Listing;
  canAccept: boolean;
  onAccept: () => void;
  accepting: boolean;
}) {
  /* Written as (amount * percent) / 100, matching the server's single rounding
     step — the equivalent (amount / 100) * percent reads like a unit bug. */
  const feeMinor = Math.round((bid.amountMinor * listing.feePercent) / 100);

  return (
    <li
      className={cn(
        'rounded-slab border border-edge p-4',
        bid.status === 'accepted' ? 'bg-success/20' : 'bg-surface',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {bid.bidder && <Avatar user={bid.bidder} size="sm" />}
          <div>
            <p className="flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
              {bid.bidder ? (
                <Link to={profilePath(bid.bidder.username)} className="hover:underline">
                  {bid.bidder.name}
                </Link>
              ) : (
                'Deleted account'
              )}
              {bid.bidder?.verified && <VerifiedMark name={bid.bidder.name} />}
            </p>
            <p className="font-mono text-[10px] uppercase text-muted">
              {relativeTime(bid.createdAt)}
              {bid.status !== 'active' && ` · ${bid.status}`}
            </p>
          </div>
        </div>

        <p className="text-right">
          <span className="block font-display text-xl tabular-nums">
            {formatMoney(bid.amountMinor, bid.currency)}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
            you keep {formatMoney(bid.amountMinor - feeMinor, bid.currency)}
          </span>
        </p>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-body text-pretty">
        {bid.message}
      </p>

      {canAccept && (
        <div className="mt-4 border-t border-edge pt-3">
          <Button
            size="sm"
            loading={accepting}
            onClick={() => {
              const confirmed = window.confirm(
                `Accept ${formatMoney(bid.amountMinor, bid.currency)} from ${
                  bid.bidder?.name ?? 'this buyer'
                }?\n\nThis closes the listing and declines every other offer. ` +
                  `Deck's ${listing.feePercent}% (${formatMoney(feeMinor, bid.currency)}) becomes payable on completion.`,
              );
              if (confirmed) onAccept();
            }}
          >
            Accept this offer
          </Button>
        </div>
      )}
    </li>
  );
}
