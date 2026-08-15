import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { useOwed, useRecordPayout } from '@/hooks/useSeller';
import { formatMoney } from '@/lib/utils';
import type { OwedRow } from '@/types';

/**
 * The disbursement run.
 *
 * Deck holds everyone's money, so this page is the other half of that promise:
 * who is owed what, and a place to write down that it has been sent. The
 * transfer itself happens in Deck's bank — this only records it, which is why
 * every row asks for a destination note. Without one, a payout six months old
 * is an amount with no way to trace it.
 */
export function Disbursements() {
  const { data: owed, isLoading } = useOwed();
  const [openFor, setOpenFor] = useState<string | null>(null);

  return (
    <div>
      <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted text-pretty">
        Everyone Deck currently owes. Send the transfer from the bank, then record it here so the
        balance clears.
      </p>

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
          <div className="mb-6 border-2 border-edge bg-lavender px-4 py-4 text-ink shadow-hard">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] opacity-80">
              Outstanding across {owed.meta.sellers}{' '}
              {owed.meta.sellers === 1 ? 'seller' : 'sellers'}
            </p>
            <p className="mt-1 font-display text-3xl tabular-nums">
              {formatMoney(owed.meta.totalOwedMinor, owed.meta.currency)}
            </p>
          </div>

          <ul className="space-y-3">
            {owed.data.map((row) => (
              <li key={row.sellerId}>
                <OwedCard
                  row={row}
                  open={openFor === row.sellerId}
                  onToggle={() => setOpenFor(openFor === row.sellerId ? null : row.sellerId)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function OwedCard({ row, open, onToggle }: { row: OwedRow; open: boolean; onToggle: () => void }) {
  const record = useRecordPayout();
  /* Defaults to the full balance — the common case is clearing it entirely. */
  const [amount, setAmount] = useState<number | ''>(row.owedMinor / 100);
  const [destination, setDestination] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await record.mutateAsync({
        sellerId: row.sellerId,
        amount: Number(amount),
        destination: destination.trim() || undefined,
        note: note.trim() || undefined,
      });
      onToggle();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not record that');
    }
  };

  return (
    <div className="rounded-slab border-2 border-edge bg-surface shadow-hard">
      <div className="flex flex-wrap items-center gap-4 p-4">
        {row.seller ? (
          <Avatar user={row.seller} size="md" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center border-2 border-edge bg-surface-2 font-mono text-xs font-bold"
          >
            ?
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-display text-base uppercase">
            {row.seller ? (
              <Link to={`/u/${row.seller.username}`} className="hover:underline">
                {row.seller.name}
              </Link>
            ) : (
              'Unknown seller'
            )}
          </p>
          <p className="mt-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
            {row.email ?? '—'}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
            Earned {formatMoney(row.earnedMinor, row.currency)} &middot; paid{' '}
            {formatMoney(row.paidOutMinor, row.currency)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="font-display text-xl tabular-nums">
            {formatMoney(row.owedMinor, row.currency)}
          </span>
          <Button size="sm" variant={open ? 'secondary' : 'primary'} onClick={onToggle}>
            {open ? 'Cancel' : 'Record payout'}
          </Button>
        </div>
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-4 border-t-2 border-edge p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Amount sent"
              type="number"
              inputMode="decimal"
              min={1}
              max={row.owedMinor / 100}
              step={100}
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value === '' ? '' : Number(event.target.value))
              }
              required
              hint={`At most ${formatMoney(row.owedMinor, row.currency)}`}
            />
            <Input
              label="Sent to"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              maxLength={200}
              hint="Bank, account or transfer id, so this can be traced later"
            />
          </div>

          <Textarea
            label="Note (optional)"
            rows={2}
            maxLength={400}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />

          {error && (
            <p
              role="alert"
              className="border-2 border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
            >
              {error}
            </p>
          )}

          <Button type="submit" loading={record.isPending}>
            Record this payout
          </Button>
        </form>
      )}
    </div>
  );
}
