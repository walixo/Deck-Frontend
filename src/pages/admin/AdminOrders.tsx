import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { useAdminOrders, useAdvanceOrder } from '@/hooks/useAdmin';
import { formatMoney, orderStatusLabel, ORDER_STATUS_TONE } from '@/lib/utils';
import type { AdminOrder, OrderStatus } from '@/types';

const FILTERS: { value: string; label: string }[] = [
  { value: 'paid', label: 'To post' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'awaiting_payment', label: 'Unpaid' },
  { value: '', label: 'All' },
];

/** The only forward move available from each state. */
const ADVANCE: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  paid: { next: 'shipped', label: 'Mark shipped' },
  shipped: { next: 'delivered', label: 'Mark delivered' },
};

const dateOf = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/**
 * Fulfilment.
 *
 * Defaults to paid-and-unposted, because that is the only view with work in it
 * — an order list that opens on "all" makes you filter before you can start.
 */
export function AdminOrders() {
  const [status, setStatus] = useState('paid');
  const { data: orders, isLoading } = useAdminOrders(status);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value || 'all'}
            type="button"
            onClick={() => setStatus(filter.value)}
            aria-pressed={status === filter.value}
            className={`border-2 border-edge px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] transition-colors duration-[120ms] ${
              status === filter.value
                ? 'bg-lavender text-ink'
                : 'bg-surface text-muted hover:bg-surface-2 hover:text-body'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-28 w-full" />
          ))}
        </div>
      ) : !orders?.data.length ? (
        <EmptyState
          title="No orders here"
          description={
            status === 'paid'
              ? 'Everything paid for has been posted.'
              : 'Nothing matches that filter yet.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {orders.data.map((order) => (
            <li key={order.id}>
              <OrderRow order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: AdminOrder }) {
  const advance = useAdvanceOrder();
  const [error, setError] = useState<string | null>(null);
  const step = ADVANCE[order.status];

  const move = async () => {
    if (!step) return;
    setError(null);
    try {
      await advance.mutateAsync({ reference: order.reference, status: step.next });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  return (
    <article className="rounded-slab border-2 border-edge bg-surface p-4 shadow-hard">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base uppercase">{order.reference}</h3>
            <span
              className={`border-2 border-edge px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] ${ORDER_STATUS_TONE[order.status]}`}
            >
              {orderStatusLabel(order.status)}
            </span>
          </div>

          <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
            {dateOf(order.createdAt)} &middot; {order.buyer?.name ?? order.email}
          </p>

          <p className="mt-2 text-sm text-muted">
            {order.shippingAddress.fullName}, {order.shippingAddress.line1},{' '}
            {order.shippingAddress.city} {order.shippingAddress.postcode},{' '}
            {order.shippingAddress.country}
          </p>

          <ul className="mt-2 space-y-0.5 font-mono text-[11px] text-muted">
            {order.lines.map((line) => (
              <li key={line.sku}>
                {line.quantity} &times; {line.name}
                {line.size ? ` (${line.size})` : ''}
                {line.sellerId ? '' : ' — Deck stock'}
              </li>
            ))}
          </ul>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-display text-lg tabular-nums">
            {formatMoney(order.totalMinor, order.currency)}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
            {order.sellerCount > 0
              ? `${order.sellerCount} ${order.sellerCount === 1 ? 'maker' : 'makers'}`
              : 'Deck stock'}
          </p>
          {step && (
            <Button
              size="sm"
              className="mt-3"
              onClick={() => void move()}
              loading={advance.isPending}
            >
              {step.label}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 border-2 border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
        >
          {error}
        </p>
      )}
    </article>
  );
}
