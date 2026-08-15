import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { useAuth } from '@/hooks/useAuth';
import { useContributions, useContribute } from '@/hooks/useFundraise';
import { formatMoney } from '@/lib/utils';
import type { Fundraise, Item } from '@/types';

/** The floor the server enforces. Shown so nobody discovers it by being refused. */
const MIN_CONTRIBUTION = 1000;
const PRESETS = [1000, 5000, 20000, 50000];

interface FundraiseCardProps {
  item: Item;
}

/**
 * The raise: a progress bar, the numbers behind it, and a way to give.
 *
 * Renders nothing at all when the launcher has not opted in. A fundraise is
 * something a maker chooses, so its absence should be invisible rather than an
 * empty widget inviting them to fill it.
 */
export function FundraiseCard({ item }: FundraiseCardProps) {
  const { isAuthenticated, user } = useAuth();
  const raise = item.fundraise;

  const { data: supporters } = useContributions(item.slug, raise.enabled);
  const contribute = useContribute(item.slug);

  const [amount, setAmount] = useState<number | ''>(PRESETS[1]);
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!raise.enabled) return null;

  const isOwner = user?.id === item.submittedBy.id;
  /* Live figures beat the ones baked into the item payload, which may be a page
     load old — someone else may have given while this page was open. */
  const live: Fundraise = supporters?.meta ?? raise;
  const remaining = Math.max(0, live.targetMinor - live.raisedMinor);
  const funded = live.targetMinor > 0 && live.raisedMinor >= live.targetMinor;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const value = Number(amount);
    if (!Number.isFinite(value) || value < MIN_CONTRIBUTION) {
      setError(`The smallest contribution is ${formatMoney(MIN_CONTRIBUTION * 100)}`);
      return;
    }

    try {
      const created = await contribute.mutateAsync({
        amount: value,
        message: message.trim() || undefined,
        anonymous,
      });
      // Hand off to Paystack. Nothing counts until the server verifies it.
      window.location.assign(created.authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  return (
    <section
      aria-labelledby="fundraise-heading"
      className="rounded-slab border-2 border-edge bg-surface p-5 shadow-hard-lg sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-block border-2 border-edge bg-acid px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
          {funded ? 'Funded' : 'Raising'}
        </p>
        {live.closed && (
          <p className="border-2 border-edge bg-edge px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-canvas">
            Closed
          </p>
        )}
      </div>

      <h2 id="fundraise-heading" className="display-tight mt-4 text-2xl uppercase text-balance">
        Back {item.name}
      </h2>

      {live.pitch && (
        <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">{live.pitch}</p>
      )}

      {/* Progress. The bar is capped at 100%; the figures below tell the truth. */}
      <div className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <p className="font-display text-3xl tabular-nums">{formatMoney(live.raisedMinor)}</p>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            of {formatMoney(live.targetMinor)}
          </p>
        </div>

        <div
          role="progressbar"
          aria-valuenow={live.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${live.percent}% of the target raised`}
          className="mt-3 h-5 w-full overflow-hidden border-2 border-edge bg-surface-2"
        >
          <div
            className="h-full bg-lavender-deep transition-[width] duration-500 ease-[var(--ease-snap)]"
            style={{ width: `${live.percent}%` }}
          />
        </div>

        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          {/* The visible word lives inside the <dd>: a bare <span> is not a
              valid child of a <dl>, and splitting the value from its unit would
              have a screen reader read "29" and "funded" as separate terms. */}
          <div className="flex gap-1.5">
            <dt className="sr-only">Funded</dt>
            <dd>
              <span className="tabular-nums text-body">{live.percent}%</span> funded
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="sr-only">Backers</dt>
            <dd>
              <span className="tabular-nums text-body">{live.contributorCount}</span>{' '}
              {live.contributorCount === 1 ? 'backer' : 'backers'}
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

      {/* Who can give, and who cannot. */}
      {!live.open ? (
        <p className="mt-6 border-2 border-edge bg-surface-2 px-4 py-3 text-sm text-muted">
          This raise is not taking contributions right now.
        </p>
      ) : isOwner ? (
        <p className="mt-6 border-2 border-edge bg-surface-2 px-4 py-3 text-sm text-muted">
          This is your launch. Share it — you cannot back it yourself.
        </p>
      ) : !isAuthenticated ? (
        <p className="mt-6 border-2 border-edge bg-surface-2 px-4 py-3 text-sm text-muted">
          <Link to="/login" className="font-bold underline underline-offset-2">
            Sign in
          </Link>{' '}
          to back this launch.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <fieldset>
            <legend className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
              Amount
            </legend>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  aria-pressed={amount === preset}
                  className={`border-2 border-edge px-3 py-1.5 font-mono text-[12px] font-bold tabular-nums transition-colors duration-[120ms] ${
                    amount === preset
                      ? 'bg-lavender text-ink'
                      : 'bg-surface text-muted hover:bg-surface-2 hover:text-body'
                  }`}
                >
                  {formatMoney(preset * 100)}
                </button>
              ))}
            </div>
          </fieldset>

          <Input
            label="Or another amount"
            type="number"
            inputMode="numeric"
            min={MIN_CONTRIBUTION}
            step={100}
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value === '' ? '' : Number(event.target.value))
            }
            hint={`Minimum ${formatMoney(MIN_CONTRIBUTION * 100)}`}
          />

          <Textarea
            label="Say something (optional)"
            rows={2}
            maxLength={280}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            counter={`${message.length}/280`}
          />

          <label className="flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em]">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(event) => setAnonymous(event.target.checked)}
              className="size-4 border-2 border-edge accent-lavender"
            />
            Give anonymously
          </label>

          {error && (
            <p
              role="alert"
              className="border-2 border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
            >
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" loading={contribute.isPending}>
            {contribute.isPending
              ? 'Opening checkout'
              : `Give ${amount ? formatMoney(Number(amount) * 100) : ''}`}
          </Button>

          <p className="text-center font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            Paid securely through Paystack, straight to the maker
          </p>
        </form>
      )}

      {supporters && supporters.data.length > 0 && (
        <div className="mt-7 border-t-2 border-edge pt-5">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
            Recent backers
          </h3>
          <ul className="mt-3 space-y-3">
            {supporters.data.slice(0, 6).map((entry) => (
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
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
                    {entry.supporter ? (
                      <Link
                        to={`/u/${entry.supporter.username}`}
                        className="hover:underline underline-offset-2"
                      >
                        {entry.supporter.name}
                      </Link>
                    ) : (
                      'Anonymous'
                    )}
                    <span className="ml-2 tabular-nums text-muted">
                      {formatMoney(entry.amountMinor, entry.currency)}
                    </span>
                  </p>
                  {entry.message && (
                    <p className="mt-0.5 text-xs leading-relaxed text-muted text-pretty">
                      {entry.message}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
