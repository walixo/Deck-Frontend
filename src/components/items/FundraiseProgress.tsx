import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatMoney, relativeTime } from '@/lib/utils';
import type { Contribution, Fundraise } from '@/types';

/**
 * The raise, as a bar and four numbers.
 *
 * Pulled out of FundraiseCard so the launch page and the Future Gen timeline
 * show the *same* progress rather than two drawings of it. The two contexts
 * want different weights, hence `size` — the launch page is the raise's own
 * page and can afford a 20px bar and 30px figures; a timeline entry is one of
 * many and gets a quieter version of the identical component.
 */
export function RaiseBar({
  raise,
  size = 'lg',
  className,
}: {
  raise: Fundraise;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const remaining = Math.max(0, raise.targetMinor - raise.raisedMinor);
  const funded = raise.targetMinor > 0 && raise.raisedMinor >= raise.targetMinor;
  const large = size === 'lg';

  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-3">
        <p className={cn('font-display tabular-nums', large ? 'text-3xl' : 'text-xl')}>
          {formatMoney(raise.raisedMinor)}
        </p>
        <p
          className={cn(
            'font-mono font-bold uppercase tracking-[0.08em] text-muted',
            large ? 'text-[11px]' : 'text-[10px]',
          )}
        >
          of {formatMoney(raise.targetMinor)}
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={raise.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${raise.percent}% of the target raised`}
        className={cn(
          'mt-2 w-full overflow-hidden border-2 border-edge bg-surface-2',
          large ? 'h-5' : 'h-3',
        )}
      >
        <div
          /* The themed mark, not a fixed accent. The fill is read against the
             track behind it, and lime on the light track is 1.4:1 — the bar
             would look empty at every value. Accent gives 8.4:1 light and
             12.5:1 dark.

             The width transition is what makes a contribution landing look
             like an event: the query below refetches while the page is open,
             so the bar grows in place rather than jumping on reload. */
          className="h-full bg-accent transition-[width] duration-500 ease-[var(--ease-snap)]"
          style={{ width: `${raise.percent}%` }}
        />
      </div>

      <dl
        className={cn(
          'mt-2.5 flex flex-wrap gap-x-5 gap-y-1 font-mono font-bold uppercase tracking-[0.08em] text-muted',
          large ? 'text-[11px]' : 'text-[10px]',
        )}
      >
        {/* The visible word lives inside the <dd>: a bare <span> is not a valid
            child of a <dl>, and splitting the value from its unit would have a
            screen reader read "29" and "funded" as separate terms. */}
        <div className="flex gap-1.5">
          <dt className="sr-only">Funded</dt>
          <dd>
            <span className="tabular-nums text-body">{raise.percent}%</span> funded
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="sr-only">Backers</dt>
          <dd>
            <span className="tabular-nums text-body">{raise.contributorCount}</span>{' '}
            {raise.contributorCount === 1 ? 'backer' : 'backers'}
          </dd>
        </div>
        {!funded && (
          <div className="flex gap-1.5">
            <dt className="sr-only">Still needed</dt>
            <dd>
              <span className="tabular-nums text-body">{formatMoney(remaining)}</span> to go
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/**
 * Who has given, and how much.
 *
 * Newest first, and it grows while you watch: `useContributions` polls an open
 * raise, so a backer who gives on another tab appears here without a reload.
 * That liveness is the whole point of the list — a static roll of names is just
 * credits, whereas one that moves is evidence the raise is happening now.
 *
 * Anonymous backers keep their amount. Giving anonymously hides who you are,
 * not that it happened; dropping the figure would make the list disagree with
 * the total sitting directly above it.
 */
export function BackerList({
  backers,
  limit = 6,
  className,
}: {
  backers: Contribution[];
  limit?: number;
  className?: string;
}) {
  if (backers.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
        Backers
        <span className="ml-2 tabular-nums text-muted">{backers.length}</span>
      </h3>

      <ul className="mt-3 space-y-3">
        {backers.slice(0, limit).map((entry) => (
          <li key={entry.id} className="flex items-start gap-3">
            {entry.supporter ? (
              <Avatar user={entry.supporter} size="sm" />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center border-2 border-edge bg-surface-2 font-mono text-[11px] font-bold"
              >
                ?
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2 font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
                {entry.supporter ? (
                  <Link
                    to={`/u/${entry.supporter.username}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {entry.supporter.name}
                  </Link>
                ) : (
                  <span>Anonymous</span>
                )}

                {/* The amount is the reason this row exists, so it is set as a
                    block rather than as trailing grey text. */}
                <span className="border-2 border-edge bg-surface-2 px-1.5 py-0.5 tabular-nums">
                  {formatMoney(entry.amountMinor, entry.currency)}
                </span>

                <span className="font-normal normal-case text-muted">
                  {relativeTime(entry.createdAt)}
                </span>
              </p>

              {entry.message && (
                <p className="mt-1 text-xs leading-relaxed text-muted text-pretty">
                  {entry.message}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {backers.length > limit && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          and {backers.length - limit} more
        </p>
      )}
    </div>
  );
}
