import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/States';
import {
  usePayoutAccount,
  useRefreshPayoutAccount,
  useStartPayoutOnboarding,
} from '@/hooks/useSeller';

const COPY = {
  none: {
    label: 'Not set up',
    tone: 'bg-surface-2 text-muted',
    body: 'Connect a payout account to get paid. You enter your bank and identity details on Bachs’s secure page — Deck never sees them.',
    action: 'Set up payouts',
  },
  pending: {
    label: 'Waiting on Bachs',
    tone: 'bg-grey text-ink',
    body: 'Bachs is still checking your details, or needs something more from you. Your earnings are safe in the meantime and will go out as soon as transfers are switched on.',
    action: 'Continue setup',
  },
  active: {
    label: 'Active',
    tone: 'bg-deep text-on-deep',
    body: 'You are paid automatically. Earnings go out once they clear the hold, on the next transfer run.',
    action: 'Update bank details',
  },
} as const;

/**
 * Where a seller connects the account Deck pays them into.
 *
 * Onboarding happens on Bachs's hosted page. Coming back, the URL carries
 * `payouts=returned` (they finished, or gave up) or `payouts=refresh` (the
 * link expired). Neither proves anything, so `returned` asks the server to
 * re-read the account, and `refresh` mints a fresh link and goes straight
 * back — the person wanted to be on that page, not this one.
 */
export function PayoutAccountPanel({ holdDays }: { holdDays: number }) {
  const [params, setParams] = useSearchParams();
  const account = usePayoutAccount();
  const start = useStartPayoutOnboarding();
  const refresh = useRefreshPayoutAccount();
  const handled = useRef(false);

  const go = () => start.mutate(undefined, { onSuccess: ({ url }) => window.location.assign(url) });

  useEffect(() => {
    if (handled.current) return;
    const arrival = params.get('payouts');
    if (!arrival) return;
    handled.current = true;

    const next = new URLSearchParams(params);
    next.delete('payouts');
    setParams(next, { replace: true });

    if (arrival === 'returned') refresh.mutate();
    if (arrival === 'refresh') go();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  const status = account.data?.status ?? 'none';
  const copy = COPY[status];

  return (
    <section
      aria-labelledby="payout-account-heading"
      className="mb-12 border border-edge bg-surface p-5 shadow-hard sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="payout-account-heading"
          className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
        >
          Payout account
        </h2>
        {account.data && (
          <span
            className={`border border-edge px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] ${copy.tone}`}
          >
            {refresh.isPending ? 'Checking…' : copy.label}
          </span>
        )}
      </div>

      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted text-pretty">{copy.body}</p>
      <p className="mt-2 max-w-2xl font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
        Each sale is held {holdDays} {holdDays === 1 ? 'day' : 'days'} to cover refunds before it
        can be sent
      </p>

      {(start.isError || refresh.isError) && (
        <div className="mt-4">
          <InlineAlert>{(start.error ?? refresh.error)?.message}</InlineAlert>
        </div>
      )}

      <div className="mt-5">
        <Button
          type="button"
          variant={status === 'active' ? 'secondary' : 'primary'}
          size="sm"
          onClick={go}
          disabled={start.isPending || account.isLoading}
        >
          {start.isPending ? 'Opening Bachs…' : copy.action}
        </Button>
      </div>
    </section>
  );
}
