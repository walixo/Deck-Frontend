import { Link } from 'react-router-dom';
import { PageBanner } from '@/components/ui/Ambient';
import { ButtonLink } from '@/components/ui/Button';
import { ItemCardSkeletonList } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useMyOrders } from '@/hooks/useMerch';
import { formatFullDate, formatMoney, ORDER_STATUS_TONE, orderStatusLabel } from '@/lib/utils';

export function Orders() {
  const { data: orders, isLoading, isError, error, refetch } = useMyOrders();

  return (
    <div className="relative isolate mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8">
        <h1 className="display-tight text-3xl sm:text-4xl">Your orders</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
          Everything you have bought from the Deck shop.
        </p>
      </header>

      {isLoading ? (
        <ItemCardSkeletonList count={3} />
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : orders?.length ? (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to={`/orders/${order.reference}`}
                className="block rounded-slab border border-line bg-surface p-4 shadow-hard transition-[transform,box-shadow] duration-300 ease-[var(--ease-snap)] hover:-translate-y-0.5 hover:shadow-hard-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-display text-lg">{order.reference}</span>
                  <span
                    className={`rounded-full border border-line px-2 py-0.5 font-mono text-[10px] font-medium uppercase ${
                      ORDER_STATUS_TONE[order.status] ?? 'bg-surface-2 text-body'
                    }`}
                  >
                    {orderStatusLabel(order.status)}
                  </span>
                </div>

                <p className="mt-2 font-mono text-[11px] font-medium uppercase text-muted">
                  {formatFullDate(order.createdAt)} ·{' '}
                  {order.lines.reduce((total, line) => total + line.quantity, 0)} items
                </p>

                <p className="mt-2 truncate text-sm text-muted">
                  {order.lines.map((line) => line.name).join(', ')}
                </p>

                <p className="mt-3 font-display text-base tabular-nums">
                  {formatMoney(order.totalMinor, order.currency)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No orders yet"
          description="When you buy something from the shop it will show up here."
          action={<ButtonLink to="/shop">Browse merch</ButtonLink>}
        />
      )}
    </div>
  );
}
