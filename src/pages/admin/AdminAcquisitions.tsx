import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { VerifiedMark } from '@/components/ui/VerifiedMark';
import { useAcquisitionQueue, useReviewAcquisition } from '@/hooks/useAcquisitions';
import { formatMoney, formatNumber, relativeTime } from '@/lib/utils';
import {
  ASSET_LABELS,
  type AcquisitionDetail,
  type AcquisitionSummary,
} from '@/types';

/**
 * The acquisitions desk.
 *
 * Approving a listing is the second-most consequential yes/no in the admin area
 * after a fundraise: it puts Deck's name beside somebody's asking price and
 * invites strangers to negotiate a purchase against it. Everything the seller
 * wrote is on the card, so the decision never needs a second tab.
 *
 * The ledger sits above the queue for the same reason it does on the fundraise
 * page — deciding on a new listing is easier next to what is already live and
 * what has actually closed.
 */
export function AdminAcquisitions() {
  const { data, isLoading } = useAcquisitionQueue();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="display-tight text-3xl uppercase">Acquisitions</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
          Products listed for sale, and every offer running against them. Approving one puts it on
          the public board immediately — Deck takes {data?.totals.feePercent ?? 8}% of whatever the
          seller eventually accepts.
        </p>
      </header>

      {data && (
        <section>
          <h2 className="mb-3 border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
            The book
          </h2>
          <dl className="grid gap-3 sm:grid-cols-4">
            <Stat label="Listed value, live" value={formatMoney(data.totals.listedMinor)} />
            <Stat label="Sold through Deck" value={formatMoney(data.totals.soldMinor)} />
            <Stat
              label={`Deck earned at ${data.totals.feePercent}%`}
              value={formatMoney(data.totals.earnedMinor)}
            />
            <Stat label="Open offers" value={formatNumber(data.totals.openBids)} />
          </dl>
        </section>
      )}

      <section>
        <h2 className="mb-3 border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          {data ? `${data.pending.length} waiting on a decision` : 'Waiting on a decision'}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((n) => (
              <Skeleton key={n} className="h-64 w-full" />
            ))}
          </div>
        ) : data?.pending.length ? (
          <ul className="space-y-4">
            {data.pending.map((listing) => (
              <ApplicationCard key={listing.id} listing={listing} />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nothing waiting"
            description="No maker is currently asking to list a product for sale."
          />
        )}
      </section>

      {data && data.live.length > 0 && (
        <section>
          <h2 className="mb-3 border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
            {data.live.length} live on the board
          </h2>
          <ul className="space-y-2">
            {data.live.map((listing) => (
              <LedgerRow key={listing.id} listing={listing} />
            ))}
          </ul>
        </section>
      )}

      {data && data.sold.length > 0 && (
        <section>
          <h2 className="mb-3 border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
            {data.sold.length} sold
          </h2>
          <ul className="space-y-2">
            {data.sold.map((listing) => (
              <LedgerRow key={listing.id} listing={listing} sold />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-edge bg-surface px-4 py-3 shadow-hard-sm">
      <dd className="font-display text-xl tabular-nums">{value}</dd>
      <dt className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
        {label}
      </dt>
    </div>
  );
}

/**
 * One live or closed listing, compact.
 *
 * A ledger to scan, not a queue to act on — so the only thing called out is the
 * commission, which is the number this page exists to keep track of.
 */
function LedgerRow({ listing, sold = false }: { listing: AcquisitionSummary; sold?: boolean }) {
  const feeMinor = sold
    ? Math.round((listing.soldMinor * listing.feePercent) / 100)
    : listing.feeMinor;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-slab border border-edge bg-surface p-3 shadow-hard-sm">
      <Link
        to={`/acquisitions/${listing.slug}`}
        className="min-w-0 flex-1 truncate font-display text-[13px] uppercase underline-offset-2 hover:underline"
      >
        {listing.item?.name ?? listing.slug}
      </Link>

      {sold ? (
        <span className="shrink-0 border border-edge bg-success px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-ink">
          Sold
        </span>
      ) : (
        listing.bidCount > 0 && (
          <span className="shrink-0 font-mono text-[10px] uppercase tabular-nums text-muted">
            {listing.bidCount} {listing.bidCount === 1 ? 'offer' : 'offers'}
            {listing.highestBidMinor > 0 && ` · high ${formatMoney(listing.highestBidMinor)}`}
          </span>
        )
      )}

      <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums">
        {formatMoney(sold ? listing.soldMinor : listing.askingMinor)}
      </span>

      <span className="shrink-0 border border-edge bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums">
        Deck {formatMoney(feeMinor)}
      </span>
    </li>
  );
}

function ApplicationCard({ listing }: { listing: AcquisitionDetail }) {
  const review = useReviewAcquisition();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const decide = async (approve: boolean) => {
    setError(null);
    /* The server requires a note either way — checking here keeps the message
       next to the field rather than as an error after a round trip. */
    if (note.trim().length < 4) {
      setError('Say why — the seller sees this.');
      return;
    }

    try {
      await review.mutateAsync({ slug: listing.slug, approve, note: note.trim() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  return (
    <li>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-edge pb-3">
          <div className="min-w-0">
            <Link
              to={`/acquisitions/${listing.slug}`}
              className="font-display text-lg uppercase underline-offset-4 hover:underline"
            >
              {listing.item?.name ?? listing.slug}
            </Link>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase text-muted">
              {listing.seller && <Avatar user={listing.seller} size="sm" />}
              <span>{listing.seller?.name}</span>
              {listing.seller?.verified && <VerifiedMark name={listing.seller.name} />}
              <span aria-hidden="true">/</span>
              <span>applied {relativeTime(listing.appliedAt)}</span>
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="border border-edge bg-pop px-2.5 py-1 font-display text-lg tabular-nums text-on-pop">
              {formatMoney(listing.askingMinor, listing.currency)}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
              {listing.negotiable ? 'open to offers' : 'firm'} · Deck{' '}
              {formatMoney(listing.feeMinor)}
            </p>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Figure label="Revenue / mo" value={formatMoney(listing.monthlyRevenueMinor)} />
          <Figure label="Costs / mo" value={formatMoney(listing.monthlyCostMinor)} />
          <Figure label="Active users" value={formatNumber(listing.activeUsers)} />
        </dl>

        <div className="mt-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
            Why they are selling
          </p>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-body text-pretty">
            {listing.reason}
          </p>
        </div>

        <div className="mt-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
            Included
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {listing.assets.map((asset) => (
              <span
                key={asset}
                className="border border-edge px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.06em]"
              >
                {ASSET_LABELS[asset]}
              </span>
            ))}
          </div>
        </div>

        {listing.notes && (
          <p className="mt-4 border border-edge bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted text-pretty">
            {listing.notes}
          </p>
        )}

        <div className="mt-5 space-y-3 border-t border-edge pt-4">
          <label className="block">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
              Note to the seller
            </span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={300}
              placeholder="Looks straight — approved"
              className="mt-1 h-10 w-full border border-edge bg-surface px-3 text-sm placeholder:text-muted/70 focus:border-accent focus:outline-none"
            />
          </label>

          {error && (
            <p role="alert" className="font-mono text-[11px] font-bold uppercase text-red">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={review.isPending} onClick={() => void decide(true)}>
              Approve listing
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={review.isPending}
              onClick={() => void decide(false)}
            >
              Turn down
            </Button>
          </div>
        </div>
      </Card>
    </li>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-edge bg-surface-2 px-3 py-2">
      <dd className="font-display text-sm tabular-nums">{value}</dd>
      <dt className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
        {label}
      </dt>
    </div>
  );
}
