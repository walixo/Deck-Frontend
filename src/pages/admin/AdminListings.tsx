import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { usePendingListings, useReviewListing } from '@/hooks/useSeller';
import { formatMoney, MERCH_CATEGORY_LABELS } from '@/lib/utils';
import type { MerchProduct } from '@/types';

/**
 * The review queue.
 *
 * Everything a maker submits waits here, oldest first — a queue worked from the
 * back would leave the earliest submission waiting longest, which is the one
 * thing a queue is supposed to prevent.
 *
 * Approving is one click. Rejecting asks for a reason, because the reason is
 * shown to the seller on their own shop page: a listing that silently fails
 * gives them nothing to fix.
 */
export function AdminListings() {
  const { data: pending, isLoading } = usePendingListings();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (!pending?.length) {
    return (
      <EmptyState
        title="Nothing waiting for review"
        description="Every listing makers have submitted is either live or already dealt with."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {pending.map((product) => (
        <li key={product.id}>
          <ReviewCard product={product} />
        </li>
      ))}
    </ul>
  );
}

function ReviewCard({ product }: { product: MerchProduct }) {
  const review = useReviewListing();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const act = async (approve: boolean) => {
    setError(null);
    try {
      await review.mutateAsync({ id: product.id, approve, reason: reason.trim() || undefined });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  return (
    <article className="rounded-slab border-2 border-edge bg-surface shadow-hard">
      <div className="flex flex-wrap gap-4 p-4">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt=""
            className="size-24 shrink-0 border-2 border-edge object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-24 shrink-0 items-center justify-center border-2 border-edge bg-surface-2 font-display text-lg"
          >
            {product.name.slice(0, 2).toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg uppercase">{product.name}</h3>
            <span className="border-2 border-edge bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
              {MERCH_CATEGORY_LABELS[product.category] ?? product.category}
            </span>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">{product.tagline}</p>

          {product.seller && (
            <Link
              to={`/u/${product.seller.username}`}
              className="mt-3 inline-flex items-center gap-2 hover:underline underline-offset-2"
            >
              <Avatar user={product.seller} size="sm" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
                {product.seller.name}
              </span>
            </Link>
          )}

          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
            <div className="flex gap-1.5">
              <dt className="sr-only">Price</dt>
              <dd className="tabular-nums text-body">
                {formatMoney(product.priceMinor, product.currency)}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="sr-only">Variants</dt>
              <dd>
                <span className="tabular-nums text-body">{product.variants.length}</span>{' '}
                {product.variants.length === 1 ? 'variant' : 'variants'}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="sr-only">Stock</dt>
              <dd>
                <span className="tabular-nums text-body">{product.totalStock}</span> in stock
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* The full description matters here — it is the thing being reviewed. */}
      <div className="border-t-2 border-edge px-4 py-3">
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted text-pretty">
          {product.description}
        </p>
      </div>

      <div className="border-t-2 border-edge p-4">
        {rejecting ? (
          <div className="space-y-3">
            <Textarea
              label="Why is this not going live?"
              rows={2}
              maxLength={400}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              hint="Shown to the seller, so tell them what to change"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => void act(false)}
                disabled={reason.trim().length < 4}
                loading={review.isPending}
              >
                Send rejection
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setRejecting(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void act(true)} loading={review.isPending}>
              Approve
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setRejecting(true)}>
              Reject
            </Button>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 border-2 border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
          >
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
