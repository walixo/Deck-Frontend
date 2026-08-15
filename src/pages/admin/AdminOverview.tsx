import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAdminOverview } from '@/hooks/useAdmin';
import { formatMoney, formatNumber } from '@/lib/utils';

/**
 * The dashboard's front page.
 *
 * Ordered by what an admin can do about it. Queues first — every one of them is
 * somebody waiting: a maker whose listing is unreviewed, a buyer whose parcel is
 * unposted, a seller who has not been paid. The totals below are context, not
 * work, and they are styled quieter to say so.
 */
export function AdminOverview() {
  const { data, isLoading } = useAdminOverview();

  if (isLoading || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const { queues, money, catalogue, people } = data;
  const allClear =
    queues.pendingListings === 0 &&
    queues.pendingAds === 0 &&
    queues.awaitingFulfilment === 0 &&
    queues.sellersOwed === 0;

  return (
    <div className="space-y-10">
      <section aria-labelledby="queues-heading">
        <h2
          id="queues-heading"
          className="mb-5 border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
        >
          Needs you
        </h2>

        {allClear ? (
          <p className="border-2 border-edge bg-acid px-4 py-5 font-display text-lg uppercase text-ink shadow-hard">
            Nothing waiting. Everything is reviewed, posted and paid.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Queue
              to="/admin/listings"
              label="Listings to review"
              value={formatNumber(queues.pendingListings)}
              note="Makers waiting to go live"
              count={queues.pendingListings}
            />
            <Queue
              to="/admin/ads"
              label="Ads to review"
              value={formatNumber(queues.pendingAds)}
              note="Unpaid until you approve"
              count={queues.pendingAds}
            />
            <Queue
              to="/admin/orders"
              label="Orders to post"
              value={formatNumber(queues.awaitingFulfilment)}
              note="Paid and not yet shipped"
              count={queues.awaitingFulfilment}
            />
            <Queue
              to="/admin/disbursements"
              label="Sellers to pay"
              value={formatMoney(queues.totalOwedMinor, data.currency)}
              note={`Across ${queues.sellersOwed} ${queues.sellersOwed === 1 ? 'seller' : 'sellers'}`}
              count={queues.sellersOwed}
            />
          </div>
        )}
      </section>

      <section aria-labelledby="money-heading">
        <h2
          id="money-heading"
          className="mb-5 border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
        >
          Money through Deck
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Figure
            label="Collected"
            value={formatMoney(money.grossMinor, data.currency)}
            note={`${money.paidOrders} paid ${money.paidOrders === 1 ? 'order' : 'orders'}`}
          />
          <Figure
            label="Deck's fee"
            value={formatMoney(money.platformFeeMinor, data.currency)}
            note={data.feePercent > 0 ? `${data.feePercent}% on goods` : 'Fee is switched off'}
          />
          <Figure
            label="Owed to sellers"
            value={formatMoney(queues.totalOwedMinor, data.currency)}
            note="Not yet disbursed"
          />
          <Figure
            label="Contributions"
            value={formatNumber(money.contributions)}
            note="Settled fundraise backings"
          />
        </dl>
      </section>

      <section aria-labelledby="platform-heading">
        <h2
          id="platform-heading"
          className="mb-5 border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
        >
          The platform
        </h2>
        <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Small label="Launches" value={formatNumber(catalogue.launches)} />
          <Small label="Open raises" value={formatNumber(catalogue.openRaises)} />
          <Small label="Live listings" value={formatNumber(catalogue.liveListings)} />
          <Small label="Comments" value={formatNumber(catalogue.comments)} />
          <Small label="People" value={formatNumber(people.users)} />
          <Small label="Admins" value={formatNumber(people.admins)} />
        </dl>
      </section>
    </div>
  );
}

function Queue({
  to,
  label,
  value,
  note,
  count,
}: {
  to: string;
  label: string;
  value: string;
  note: string;
  count: number;
}) {
  return (
    <Link
      to={to}
      className={`block border-2 border-edge px-4 py-5 shadow-hard transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-y-0.5 ${
        count > 0 ? 'bg-lavender text-ink' : 'bg-surface'
      }`}
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] opacity-80">
        {label}
      </p>
      <p className="mt-1.5 font-display text-2xl tabular-nums">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] opacity-70">{note}</p>
    </Link>
  );
}

function Figure({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="border-2 border-edge bg-surface px-4 py-5 shadow-hard">
      <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd className="mt-1.5 font-display text-xl tabular-nums">{value}</dd>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">{note}</p>
    </div>
  );
}

function Small({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-edge bg-surface-2 px-3 py-3">
      <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 font-display text-lg tabular-nums">{value}</dd>
    </div>
  );
}
