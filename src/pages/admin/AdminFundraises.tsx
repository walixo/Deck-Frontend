import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { VerifiedMark } from '@/components/ui/VerifiedMark';
import { useFundraiseApplications, useReviewFundraise } from '@/hooks/useAdmin';
import { formatMoney, relativeTime } from '@/lib/utils';
import type { FundraiseApplicationRow } from '@/types';

/**
 * Applications waiting on a decision.
 *
 * The most consequential yes/no in the admin area: approving one lets somebody
 * collect money from strangers through Deck. Everything they wrote is on the
 * card, so the decision never needs a second tab.
 */
export function AdminFundraises() {
  const { data, isLoading } = useFundraiseApplications();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="display-tight text-3xl uppercase">Fundraises</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
          Launches applying to raise money, and every raise already running. Approving one opens
          contributions immediately — Deck is the name on the payment page.
        </p>
      </header>

      {/* The book, above the queue. Deciding on a new application is easier
          next to what has already been approved and how it is going. */}
      {data && data.approved.length > 0 && (
        <section>
          <h2 className="mb-3 border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
            Money in flight
          </h2>
          <dl className="grid gap-3 sm:grid-cols-4">
            <Stat label="Raised" value={formatMoney(data.totals.raisedMinor)} />
            <Stat label="Across targets of" value={formatMoney(data.totals.targetMinor)} />
            <Stat label="Backers" value={String(data.totals.backers)} />
            <Stat label="Taking money now" value={`${data.totals.live} of ${data.approved.length}`} />
          </dl>
        </section>
      )}

      <section>
        <h2 className="mb-3 border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          {data ? `${data.pending.length} waiting on a decision` : 'Waiting on a decision'}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((n) => (
              <Skeleton key={n} className="h-52 w-full" />
            ))}
          </div>
        ) : data?.pending.length ? (
          <ul className="space-y-4">
            {data.pending.map((row) => (
              <ApplicationCard key={row.slug} row={row} />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nothing waiting"
            description="No launch is currently applying to raise money."
          />
        )}
      </section>

      {data && data.approved.length > 0 && (
        <section>
          <h2 className="mb-3 border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
            {data.approved.length} approved
          </h2>
          <ul className="space-y-2">
            {data.approved.map((row) => (
              <ApprovedRow key={row.slug} row={row} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-edge bg-surface px-4 py-3 shadow-hard-sm">
      <dd className="font-display text-xl tabular-nums">{value}</dd>
      <dt className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
        {label}
      </dt>
    </div>
  );
}

/**
 * One approved raise, with how far along it is.
 *
 * Compact by design: this is a ledger to scan, not a queue to act on. The only
 * state worth calling out is a raise that has been approved but is not actually
 * collecting — paused or closed — because that is the one a reader would
 * otherwise miscount as live.
 */
function ApprovedRow({ row }: { row: FundraiseApplicationRow }) {
  return (
    <li className="rounded-slab border-2 border-edge bg-surface p-3 shadow-hard-sm">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={`/item/${row.slug}`}
          className="min-w-0 flex-1 truncate font-display text-[13px] uppercase underline-offset-2 hover:underline"
        >
          {row.name}
        </Link>

        {!row.live && (
          <span className="shrink-0 border-2 border-edge bg-edge px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-canvas">
            Paused
          </span>
        )}

        <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums">
          {formatMoney(row.raisedMinor)}
          <span className="text-muted"> / {formatMoney(row.targetMinor)}</span>
        </span>

        <span className="shrink-0 font-mono text-[10px] uppercase tabular-nums text-muted">
          {row.contributorCount} {row.contributorCount === 1 ? 'backer' : 'backers'}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={row.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${row.name} is ${row.percent}% funded`}
        className="mt-2 h-2 w-full overflow-hidden border-2 border-edge bg-surface-2"
      >
        <div className="h-full bg-accent" style={{ width: `${row.percent}%` }} />
      </div>
    </li>
  );
}

function ApplicationCard({ row }: { row: FundraiseApplicationRow }) {
  const review = useReviewFundraise();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const decide = async (approve: boolean) => {
    setError(null);
    /* The server requires a note on rejection too — checking here keeps the
       error next to the field rather than as a toast after a round trip. */
    if (!approve && note.trim().length < 4) {
      setError('Say why it was turned down — the maker sees this.');
      return;
    }

    try {
      await review.mutateAsync({ slug: row.slug, approve, note: note.trim() || undefined });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  return (
    <li>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-edge pb-3">
          <div className="min-w-0">
            <Link
              to={`/item/${row.slug}`}
              className="font-display text-lg uppercase underline-offset-4 hover:underline"
            >
              {row.name}
            </Link>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase text-muted">
              <Avatar user={row.submittedBy} size="sm" />
              <span>
                {row.submittedBy.name}
                {row.submittedBy.verified && <VerifiedMark name={row.submittedBy.name} className="ml-1" />}
              </span>
              <span aria-hidden="true">/</span>
              <span>applied {relativeTime(row.appliedAt)}</span>
            </p>
          </div>

          <p className="shrink-0 border-2 border-edge bg-pop px-2.5 py-1 font-display text-sm text-on-pop">
            {formatMoney(row.targetMinor)}
          </p>
        </div>

        <dl className="mt-4 space-y-3 text-sm leading-relaxed">
          <Field label="What the money is for" value={row.application.purpose} />
          <Field label="How it will be spent" value={row.application.useOfFunds} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Over what period" value={row.application.timeline} />
            <Field label="Contact" value={row.application.contact} />
          </div>
        </dl>

        <div className="mt-5 space-y-3 border-t-2 border-edge pt-4">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-[0.08em]">
              Note to the maker
            </span>
            <textarea
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={300}
              placeholder="Required if you turn it down — they see this."
              className="w-full rounded-slab border-2 border-edge bg-surface px-3 py-2 text-sm shadow-[inset_3px_3px_0_var(--surface-2)] focus:border-accent focus:shadow-none focus:outline-none"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="border-2 border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={review.isPending} onClick={() => void decide(true)}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
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

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-pretty">{value || '—'}</dd>
    </div>
  );
}
