import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { usePendingAds, useReviewAd } from '@/hooks/useAds';
import { formatMoney } from '@/lib/utils';
import type { AdCampaign } from '@/types';

/**
 * The ad review queue.
 *
 * Nothing here has been paid for yet — approval is what makes a campaign
 * payable. That ordering means rejecting costs Deck nothing and owes the
 * advertiser nothing, so this queue can be worked honestly rather than with one
 * eye on a refund.
 */
export function AdminAds() {
  const { data: pending, isLoading } = usePendingAds();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((row) => (
          <Skeleton key={row} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (!pending?.length) {
    return (
      <EmptyState
        title="No ads waiting"
        description="Campaigns makers submit will appear here before anything is charged."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {pending.map((campaign) => (
        <li key={campaign.id}>
          <ReviewCard campaign={campaign} />
        </li>
      ))}
    </ul>
  );
}

function ReviewCard({ campaign }: { campaign: AdCampaign }) {
  const review = useReviewAd();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const act = async (approve: boolean) => {
    setError(null);
    try {
      await review.mutateAsync({
        reference: campaign.reference,
        approve,
        reason: reason.trim() || undefined,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  return (
    <article className="rounded-slab border-2 border-edge bg-surface shadow-hard">
      {/* Shown the way a reader will see it, so review is of the actual ad. */}
      <div className="border-b-2 border-dashed border-edge p-4">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
          Sponsored{campaign.item ? ` · ${campaign.item.name}` : ''}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {(campaign.imageUrl ?? campaign.item?.logoUrl) && (
            <img
              src={campaign.imageUrl ?? campaign.item?.logoUrl}
              alt=""
              className="size-14 shrink-0 border-2 border-edge object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base uppercase leading-tight">{campaign.headline}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">{campaign.body}</p>
          </div>
          <span className="shrink-0 border-2 border-edge bg-lavender px-3.5 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-ink">
            {campaign.ctaLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b-2 border-edge px-4 py-3">
        {campaign.advertiser && (
          <Link
            to={`/u/${campaign.advertiser.username}`}
            className="flex items-center gap-2 hover:underline underline-offset-2"
          >
            <Avatar user={campaign.advertiser} size="sm" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
              {campaign.advertiser.name}
            </span>
          </Link>
        )}
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
          {campaign.placement} &middot; {campaign.days} days &middot;{' '}
          <span className="text-body">{formatMoney(campaign.priceMinor, campaign.currency)}</span>
        </p>
        {campaign.item && (
          <Link
            to={`/item/${campaign.item.slug}`}
            className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted underline underline-offset-2 hover:text-body"
          >
            Links to {campaign.item.slug}
          </Link>
        )}
      </div>

      <div className="p-4">
        {rejecting ? (
          <div className="space-y-3">
            <Textarea
              label="Why is this not running?"
              rows={2}
              maxLength={400}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              hint="Shown to the advertiser. Nothing has been charged."
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
              Approve for payment
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
