import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, InlineAlert } from '@/components/ui/States';
import { useOwed, useRunTransfers } from '@/hooks/useSeller';
import { formatMoney, profilePath } from '@/lib/utils';
import type { OwedMeta, OwedRow, PayoutAccountStatus } from '@/types';

const ACCOUNT: Record<PayoutAccountStatus, { label: string; tone: string }> = {
  active: { label: 'Paid automatically', tone: 'bg-deep text-on-deep' },
  pending: { label: 'Onboarding', tone: 'bg-grey text-ink' },
  none: { label: 'No payout account', tone: 'bg-edge text-canvas' },
};

/**
 * Who Deck owes, and whether the money can move.
 *
 * Transfers to sellers' Bachs sub-accounts run on their own every hour. Staff
 * no longer record bank transfers by hand — the only way a payout row is
 * written now is by the transfer run, against a transfer Bachs made. This page
 * is for seeing where money is stuck: a seller with no payout account, or a
 * balance still inside the refund hold, and nothing staff can do about either
 * but wait or nudge. "Run now" exists for the day you would rather not wait an
 * hour.
 */
export function Disbursements() {
  const { data: owed, isLoading } = useOwed();
  const run = useRunTransfers();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-xl text-sm leading-relaxed text-muted text-pretty">
          Everyone Deck currently owes. Cleared balances go to each seller’s payout account
          automatically, every hour. Sales are held{' '}
          {owed ? `${owed.meta.holdDays} days` : 'for a while'} first to cover refunds.
        </p>
        <Button size="sm" onClick={() => run.mutate()} loading={run.isPending}>
          Run transfers now
        </Button>
      </div>

      {run.isError && (
        <div className="mb-6">
          <InlineAlert>{run.error.message}</InlineAlert>
        </div>
      )}
      {run.data && (
        <div className="mb-6">
          <InlineAlert tone="success">
            {run.data.sent} sent · {run.data.retried} retried · {run.data.failed} refused ·{' '}
            {run.data.awaitingAccount} waiting on a payout account
          </InlineAlert>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-20 w-full" />
          ))}
        </div>
      ) : !owed?.data.length ? (
        <EmptyState
          title="Nobody is owed anything"
          description="Every seller's balance is settled. New sales and contributions will show up here."
        />
      ) : (
        <>
          <dl className="mb-6 grid gap-3 sm:grid-cols-2">
            <div className="border border-edge bg-pop px-4 py-4 text-on-pop shadow-hard">
              <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] opacity-80">
                Owed across {owed.meta.sellers} {owed.meta.sellers === 1 ? 'seller' : 'sellers'}
              </dt>
              <dd className="mt-1 font-display text-3xl tabular-nums">
                {formatMoney(owed.meta.totalOwedMinor, owed.meta.currency)}
              </dd>
            </div>
            <div className="border border-edge bg-surface px-4 py-4 shadow-hard">
              <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                Cleared — can be sent now
              </dt>
              <dd className="mt-1 font-display text-3xl tabular-nums">
                {formatMoney(owed.meta.totalAvailableMinor, owed.meta.currency)}
              </dd>
            </div>
          </dl>

          <ul className="space-y-3">
            {owed.data.map((row) => (
              <li key={row.sellerId}>
                <OwedCard row={row} meta={owed.meta} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Why this balance has not gone out, in the order a seller would ask. */
function waitingOn(row: OwedRow, meta: OwedMeta): string | null {
  if (row.availableMinor <= 0) return `All inside the ${meta.holdDays}-day hold`;
  if (row.payoutAccount === 'none') return 'Waiting for them to set up payouts';
  if (row.payoutAccount === 'pending') return 'Waiting on Bachs to switch on transfers';
  if (row.availableMinor < meta.minTransferMinor) {
    return `Under the ${formatMoney(meta.minTransferMinor, row.currency)} minimum — waits for the next sale`;
  }
  return null;
}

function OwedCard({ row, meta }: { row: OwedRow; meta: OwedMeta }) {
  const account = ACCOUNT[row.payoutAccount];
  const reason = waitingOn(row, meta);
  const heldMinor = row.owedMinor - row.availableMinor;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-slab border border-edge bg-surface p-4 shadow-hard">
      {row.seller ? (
        <Avatar user={row.seller} size="md" />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center border border-edge bg-surface-2 font-mono text-xs font-bold"
        >
          ?
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-base uppercase">
            {row.seller ? (
              <Link to={profilePath(row.seller.username)} className="hover:underline">
                {row.seller.name}
              </Link>
            ) : (
              'Unknown seller'
            )}
          </p>
          <span
            className={`border border-edge px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] ${account.tone}`}
          >
            {account.label}
          </span>
        </div>
        <p className="mt-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
          {row.email ?? '—'}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
          Earned {formatMoney(row.earnedMinor, row.currency)} &middot; paid{' '}
          {formatMoney(row.paidOutMinor, row.currency)}
          {heldMinor > 0 && <> &middot; held {formatMoney(heldMinor, row.currency)}</>}
        </p>
        {reason && (
          <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em]">
            {reason}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className="font-display text-xl tabular-nums">
          {formatMoney(row.owedMinor, row.currency)}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
          {formatMoney(row.availableMinor, row.currency)} cleared
        </p>
      </div>
    </div>
  );
}
