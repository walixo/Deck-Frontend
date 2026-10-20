import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BackerList, RaiseBar } from '@/components/items/FundraiseProgress';
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
      // Hand off to hosted checkout. Nothing counts until the server verifies it.
      window.location.assign(created.authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  return (
    <section
      aria-labelledby="fundraise-heading"
      className="rounded-slab border border-line bg-surface p-5 shadow-hard-lg sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
          {funded ? 'Funded' : 'Raising'}
        </p>
        {live.closed && (
          <p className="rounded-full border border-line bg-edge px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-canvas">
            Closed
          </p>
        )}
      </div>

      <h2 id="fundraise-heading" className="display-tight mt-4 text-2xl text-balance">
        Back <span className="normal-case">{item.name}</span>
      </h2>

      {live.pitch && (
        <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">{live.pitch}</p>
      )}

      {/* Progress. The bar is capped at 100%; the figures below tell the truth. */}
      <RaiseBar raise={live} className="mt-6" />

      {/* Who can give, and who cannot. */}
      {!live.open ? (
        <p className="rounded-2xl mt-6 border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          This raise is not taking contributions right now.
        </p>
      ) : isOwner ? (
        <p className="rounded-2xl mt-6 border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          This is your launch. Share it — you cannot back it yourself.
        </p>
      ) : !isAuthenticated ? (
        <p className="rounded-2xl mt-6 border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          <Link to="/login" className="font-bold underline underline-offset-2">
            Sign in
          </Link>{' '}
          to back this launch.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <fieldset>
            <legend className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.1em]">
              Amount
            </legend>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  aria-pressed={amount === preset}
                  className={`rounded-2xl px-3 py-1.5 font-mono text-[12px] font-medium tabular-nums transition-colors duration-300 ${
                    amount === preset ? 'glass-ink' : 'glass-secondary text-muted hover:text-body'
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

          <label className="flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em]">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(event) => setAnonymous(event.target.checked)}
              className="size-4 border border-line accent-pop"
            />
            Give anonymously
          </label>

          {error && (
            <p
              role="alert"
              className="border border-line bg-edge px-3 py-2 font-mono text-[11px] font-medium uppercase text-canvas"
            >
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" loading={contribute.isPending}>
            {contribute.isPending
              ? 'Opening checkout'
              : `Give ${amount ? formatMoney(Number(amount) * 100) : ''}`}
          </Button>

          {/* Says what actually happens to the money — it settles with Deck and
              is passed on — because this line is read by backers and payment
              reviewers alike, and "straight to the maker" was not true. */}
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            Paid securely through Bachs. Deck collects it and passes it to the maker
          </p>
        </form>
      )}

      {supporters && (
        <BackerList backers={supporters.data} className="mt-7 border-t border-line pt-5" />
      )}
    </section>
  );
}
