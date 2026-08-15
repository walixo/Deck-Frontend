import { useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
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
  const verify = useVerifyPayment();

  // Arriving back from Paystack: confirm with the server exactly once. The
  // browser's own redirect proves nothing, so the server asks Paystack.
  const attempted = useRef(false);
  const justReturned = params.get('from') === 'paystack';

  useEffect(() => {
    if (attempted.current || !reference) return;
    if (!justReturned && order.data?.status !== 'awaiting_payment') return;
    if (order.isLoading) return;

    attempted.current = true;
    verify.mutate(reference);
  }, [justReturned, order.data?.status, order.isLoading, reference, verify]);

  if (order.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6">
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
            className="font-mono text-[12px] font-bold uppercase underline-offset-4 hover:underline"
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

  return (
    <div className="relative isolate mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8">
        <p className="mb-3 inline-block border-2 border-edge bg-lavender px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
          Order
        </p>
        <h1 className="display-tight text-4xl uppercase sm:text-5xl">{data.reference}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className={`border-2 border-edge px-2 py-0.5 font-mono text-[11px] font-bold uppercase ${
              ORDER_STATUS_TONE[data.status] ?? 'bg-surface-2 text-body'
            }`}
          >
            {orderStatusLabel(data.status)}
          </span>
          <span className="font-mono text-[11px] font-bold uppercase text-muted">
            {formatFullDate(data.createdAt)}
          </span>
        </div>
      </header>

      {verify.isPending && (
        <div className="mb-6">
          <InlineAlert tone="success">Confirming your payment with Paystack…</InlineAlert>
        </div>
      )}

      {verify.isError && (
        <div className="mb-6">
          <InlineAlert>
            {verify.error instanceof Error
              ? verify.error.message
              : 'We could not confirm that payment.'}
          </InlineAlert>
        </div>
      )}

      {paid && (
        <div className="mb-6">
          <InlineAlert tone="success">
            Payment confirmed. We will email {data.email} when it ships.
          </InlineAlert>
        </div>
      )}

      {data.status === 'awaiting_payment' && !verify.isPending && (
        <div className="mb-6">
          <InlineAlert>
            This order has not been paid yet. If you closed the payment page, place the order again
            from your cart.
          </InlineAlert>
        </div>
      )}

      <Card className="p-5 sm:p-6">
        <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          Items
        </h2>

        <ul className="mt-4 space-y-3">
          {data.lines.map((line) => (
            <li key={line.sku} className="flex items-start justify-between gap-4">
              <span className="min-w-0">
                <span className="block font-display text-sm uppercase">{line.name}</span>
                <span className="font-mono text-[10px] font-bold uppercase text-muted">
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

        <dl className="mt-5 space-y-2 border-t-2 border-edge pt-4 text-sm">
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
          <div className="flex justify-between gap-3 border-t-2 border-edge pt-2">
            <dt className="font-display uppercase">Total</dt>
            <dd className="font-display text-lg tabular-nums">
              {formatMoney(data.totalMinor, data.currency)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-5 p-5 sm:p-6">
        <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
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
 * Landing route for Paystack's `callback_url`. Paystack appends its own
 * `reference`, which is our order reference, so this just forwards to the order
 * page with a flag that triggers verification.
 */
export function PaymentCallback() {
  const [params] = useSearchParams();
  const reference = params.get('reference');

  if (!reference) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState message="That payment link is missing its order reference." />
        <div className="mt-6 text-center">
          <Link
            to="/orders"
            className="font-mono text-[12px] font-bold uppercase underline-offset-4 hover:underline"
          >
            ← Your orders
          </Link>
        </div>
      </div>
    );
  }

  return <RedirectToOrder reference={reference} />;
}

function RedirectToOrder({ reference }: { reference: string }) {
  useEffect(() => {
    window.location.replace(`/orders/${reference}?from=paystack`);
  }, [reference]);

  return (
    <div className="flex min-h-[50dvh] items-center justify-center px-4">
      <p className="font-mono text-[12px] font-bold uppercase text-muted">
        Confirming your payment…
      </p>
    </div>
  );
}
