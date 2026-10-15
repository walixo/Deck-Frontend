import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageBanner } from '@/components/ui/Ambient';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState, InlineAlert } from '@/components/ui/States';
import { useOrder, useVerifyPayment } from '@/hooks/useMerch';
import { formatFullDate, formatMoney, ORDER_STATUS_TONE, orderStatusLabel } from '@/lib/utils';

export function OrderDetail() {
  const { reference = '' } = useParams();
  const [params] = useSearchParams();
  const order = useOrder(reference);
  const { mutateAsync: verify } = useVerifyPayment();
  /* Set only when the check finishes; while one is due and this is still
     null, it is in flight. */
  const [checked, setChecked] = useState<{ error: string | null } | null>(null);

  // Arriving back from checkout: confirm with the server exactly once. The
  // browser's own redirect proves nothing, so the server asks the provider.
  const attempted = useRef(false);
  const justReturned = params.get('from') === 'checkout';
  const cancelled = params.get('cancelled') === '1';

  useEffect(() => {
    if (attempted.current || !reference) return;
    if (!justReturned && order.data?.status !== 'awaiting_payment') return;
    if (order.isLoading) return;

    attempted.current = true;
    /* Tracked here rather than read off the mutation: under StrictMode's
       double mount the mutation's own `isPending` never cleared, so a paid
       order said "Confirming your payment…" beside "Payment confirmed"
       indefinitely. The hook still writes the result into the order cache. */
    verify(reference).then(
      () => setChecked({ error: null }),
      (cause: unknown) =>
        setChecked({
          error: cause instanceof Error ? cause.message : 'We could not confirm that payment.',
        }),
    );
  }, [justReturned, order.data?.status, order.isLoading, reference, verify]);

  if (order.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (order.isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState message={order.error.message} onRetry={() => void order.refetch()} />
        <div className="mt-6 text-center">
          <Link
            to="/orders"
            className="font-mono text-[12px] font-medium uppercase underline-offset-4 hover:underline"
          >
            ← Your orders
          </Link>
        </div>
      </div>
    );
  }

  const data = order.data;
  if (!data) return null;

  const paid = data.status === 'paid' || data.status === 'shipped' || data.status === 'delivered';
  const checkDue = justReturned || data.status === 'awaiting_payment';
  const check = { pending: checkDue && checked === null, error: checked?.error ?? null };

  return (
    <div className="relative isolate mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8">
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
          Order
        </p>
        <h1 className="display-tight text-3xl sm:text-4xl">{data.reference}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full border border-line px-2 py-0.5 font-mono text-[11px] font-medium uppercase ${
              ORDER_STATUS_TONE[data.status] ?? 'bg-surface-2 text-body'
            }`}
          >
            {orderStatusLabel(data.status)}
          </span>
          <span className="font-mono text-[11px] font-medium uppercase text-muted">
            {formatFullDate(data.createdAt)}
          </span>
        </div>
      </header>

      {check.pending && !paid && (
        <div className="mb-6">
          <InlineAlert tone="success">Confirming your payment…</InlineAlert>
        </div>
      )}

      {check.error && (
        <div className="mb-6">
          <InlineAlert>{check.error}</InlineAlert>
        </div>
      )}

      {paid && (
        <div className="mb-6">
          <InlineAlert tone="success">
            Payment confirmed. We will email {data.email} when it ships.
          </InlineAlert>
        </div>
      )}

      {data.status === 'awaiting_payment' && !check.pending && (
        <div className="mb-6">
          <InlineAlert>
            {cancelled
              ? 'You left checkout before paying, so nothing was charged. Your items are held for about an hour — after that, place the order again from your cart.'
              : 'This order has not been paid yet. If you closed the payment page, place the order again from your cart.'}
          </InlineAlert>
        </div>
      )}

      <Card className="p-5 sm:p-6">
        <h2 className="border-b border-line pb-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em]">
          Items
        </h2>

        <ul className="mt-4 space-y-3">
          {data.lines.map((line) => (
            <li key={line.sku} className="flex items-start justify-between gap-4">
              <span className="min-w-0">
                <span className="block font-display text-sm">{line.name}</span>
                <span className="font-mono text-[10px] font-medium uppercase text-muted">
                  {[line.size, line.colour].filter(Boolean).join(' · ') || line.sku} ×{' '}
                  {line.quantity} @ {formatMoney(line.unitPriceMinor, data.currency)}
                </span>
              </span>
              <span className="shrink-0 font-display text-sm tabular-nums">
                {formatMoney(line.unitPriceMinor * line.quantity, data.currency)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(data.subtotalMinor, data.currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Shipping</dt>
            <dd className="tabular-nums">
              {data.shippingMinor === 0 ? 'Free' : formatMoney(data.shippingMinor, data.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-line pt-2">
            <dt className="font-display">Total</dt>
            <dd className="font-display text-lg tabular-nums">
              {formatMoney(data.totalMinor, data.currency)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-5 p-5 sm:p-6">
        <h2 className="border-b border-line pb-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em]">
          Shipping to
        </h2>
        <address className="mt-3 text-sm not-italic leading-relaxed">
          {data.shippingAddress.fullName}
          <br />
          {data.shippingAddress.line1}
          <br />
          {data.shippingAddress.line2 && (
            <>
              {data.shippingAddress.line2}
              <br />
            </>
          )}
          {data.shippingAddress.city}, {data.shippingAddress.postcode}
          <br />
          {data.shippingAddress.country}
        </address>
      </Card>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <ButtonLink to="/orders" variant="secondary">
          Your orders
        </ButtonLink>
        <ButtonLink to="/shop" variant="ghost">
          Keep shopping
        </ButtonLink>
      </div>
    </div>
  );
}

/**
 * Where every hosted checkout returns — orders, contributions and ad campaigns.
 *
 * It used to forward every reference to the order page, which only knows
 * orders. So a backer who had just funded a launch, or an advertiser who had
 * just paid for a slot, landed on "could not find that order" — the payment
 * had gone through, and the page told them it had not. It now asks the
 * server first and routes on the kind of payment the reference turns out to
 * be. A cancelled checkout is asked about too: that is the only way to learn
 * where to send them back to.
 */
export function PaymentCallback() {
  const [params] = useSearchParams();
  const reference = params.get('reference');
  const cancelled = params.get('cancelled') === '1';

  if (!reference) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState message="That payment link is missing its reference." />
        <div className="mt-6 text-center">
          <Link
            to="/orders"
            className="font-mono text-[12px] font-medium uppercase underline-offset-4 hover:underline"
          >
            ← Your orders
          </Link>
        </div>
      </div>
    );
  }

  return <ConfirmAndRoute reference={reference} cancelled={cancelled} />;
}

function ConfirmAndRoute({ reference, cancelled }: { reference: string; cancelled: boolean }) {
  const navigate = useNavigate();
  const { mutateAsync } = useVerifyPayment();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    /* The promise, not `mutate(…, { onSuccess })`. Per-call callbacks are
       dropped if the observer resubscribes in between — which StrictMode's
       double mount does — and this page would sit on "Confirming…" forever
       with the payment already confirmed. */
    mutateAsync(reference).then(
      (result) => {
        /* Paid-but-unconfirmed is normal: the person can beat the webhook
           back. Saying "pending" there is honest; saying "failed" is not. */
        const settled =
          result.kind === 'contribution'
            ? result.status === 'paid'
            : result.kind === 'ad'
              ? !['pending_review', 'rejected', 'awaiting_payment'].includes(result.status)
              : false;
        const outcome = `payment=${cancelled ? 'cancelled' : settled ? 'confirmed' : 'pending'}`;

        if (result.kind === 'game') {
          const gameOutcome = cancelled
            ? 'cancelled'
            : result.status === 'paid'
              ? 'confirmed'
              : 'pending';
          const query = new URLSearchParams({ reference, payment: gameOutcome });
          if (result.game) query.set('game', result.game);
          navigate(`/games/purchase/complete?${query.toString()}`, { replace: true });
        } else if (result.kind === 'contribution' && result.itemSlug) {
          navigate(`/item/${result.itemSlug}?${outcome}`, { replace: true });
        } else if (result.kind === 'ad') {
          navigate(`/advertise?${outcome}`, { replace: true });
        } else {
          navigate(`/orders/${reference}?${cancelled ? 'cancelled=1' : 'from=checkout'}`, {
            replace: true,
          });
        }
      },
      (cause: unknown) =>
        setError(cause instanceof Error ? cause.message : 'We could not confirm that payment.'),
    );
  }, [cancelled, mutateAsync, navigate, reference]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState
          message={`${error} If you were charged, it is safe — we confirm payments directly with the provider, and it will appear shortly.`}
        />
        <div className="mt-6 text-center">
          <Link
            to="/orders"
            className="font-mono text-[12px] font-medium uppercase underline-offset-4 hover:underline"
          >
            ← Your orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50dvh] items-center justify-center px-4">
      <p className="font-mono text-[12px] font-medium uppercase text-muted" role="status">
        {cancelled ? 'Taking you back…' : 'Confirming your payment…'}
      </p>
    </div>
  );
}
