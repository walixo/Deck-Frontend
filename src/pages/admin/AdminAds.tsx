import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { usePendingAds, usePullAd, useReviewAd, useRunningAds } from '@/hooks/useAds';
import { formatMoney, profilePath } from '@/lib/utils';
import type { AdCampaign } from '@/types';

/**
 * Ads, before and after money moves.
 *
 * The review queue first: nothing in it has been paid for — approval is what
 * makes a campaign payable. That ordering means rejecting costs Deck nothing
 * and owes the advertiser nothing, so it can be worked honestly rather than
 * with one eye on a refund.
 *
 * Below it, what has been paid for and not finished, where a campaign that
 * review let through can still be pulled.
 */
export function AdminAds() {
  return (
    <div className="space-y-12">
      <section aria-labelledby="queue-heading">
        <SectionHeading id="queue-heading">Waiting for review</SectionHeading>
        <ReviewQueue />
      </section>
      <section aria-labelledby="running-heading">
        <SectionHeading id="running-heading">Paid · running and booked</SectionHeading>
        <RunningList />
      </section>
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="mb-4 border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
    >
      {children}
    </h2>
  );
}

function ReviewQueue() {
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
    <article className="rounded-slab border border-edge bg-surface shadow-hard">
      {/* Shown the way a reader will see it, so review is of the actual ad. */}
      <div className="border-b border-dashed border-edge p-4">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
          Sponsored{campaign.item ? ` · ${campaign.item.name}` : ''}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {(campaign.imageUrl ?? campaign.item?.logoUrl) && (
            <img
              src={campaign.imageUrl ?? campaign.item?.logoUrl}
              alt=""
              className="size-14 shrink-0 border border-edge object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base uppercase leading-tight">{campaign.headline}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">{campaign.body}</p>
          </div>
          <span className="shrink-0 border border-edge bg-pop px-3.5 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-on-pop">
            {campaign.ctaLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-edge px-4 py-3">
        {campaign.advertiser && (
          <Link
            to={profilePath(campaign.advertiser.username)}
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
            className="mt-3 border border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
          >
            {error}
          </p>
        )}
      </div>
    </article>
  );
}

function RunningList() {
  const { data: running, isLoading } = useRunningAds();

  if (isLoading) return <Skeleton className="h-28 w-full" />;

  if (!running?.length) {
    return (
      <EmptyState
        title="Nothing running"
        description="Paid campaigns show here from payment until their last day."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {running.map((campaign) => (
        <li key={campaign.id}>
          <RunningCard campaign={campaign} />
        </li>
      ))}
    </ul>
  );
}

const dayOf = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/**
 * One paid campaign, with the one thing staff can still do to it.
 *
 * Pulling asks for a reason, because the advertiser sees it and the audit
 * trail keeps it — and says plainly that it refunds nothing, since that is the
 * part somebody pulling an ad in a hurry is most likely to assume.
 */
function RunningCard({ campaign }: { campaign: AdCampaign }) {
  const pull = usePullAd();
  const [pulling, setPulling] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      await pull.mutateAsync({ reference: campaign.reference, reason: reason.trim() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  return (
    <article className="rounded-slab border border-edge bg-surface p-4 shadow-hard">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base uppercase leading-tight">{campaign.headline}</h3>
            <span className="border border-edge bg-deep px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-on-deep">
              {campaign.phase === 'scheduled' ? 'Booked' : 'Running'}
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
            {campaign.placement} &middot; {dayOf(campaign.startAt)}–{dayOf(campaign.endAt)} &middot;{' '}
            <span className="text-body">{formatMoney(campaign.priceMinor, campaign.currency)}</span>
            {campaign.advertiser && <> &middot; {campaign.advertiser.name}</>}
          </p>
          <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
            <span className="tabular-nums text-body">{campaign.impressions}</span> shown &middot;{' '}
            <span className="tabular-nums text-body">{campaign.clicks}</span> clicks
          </p>
        </div>

        {!pulling && (
          <Button size="sm" variant="secondary" onClick={() => setPulling(true)}>
            Pull this ad
          </Button>
        )}
      </div>

      {pulling && (
        <div className="mt-4 space-y-3 border-t border-edge pt-4">
          <Textarea
            label="Why is it coming down?"
            rows={2}
            maxLength={400}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            hint="Shown to the advertiser. This does not refund them — return any unused days from the Paystack dashboard."
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => void submit()}
              disabled={reason.trim().length < 4}
              loading={pull.isPending}
            >
              Pull it now
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setPulling(false)}>
              Keep it running
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 border border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
        >
          {error}
        </p>
      )}
    </article>
  );
}
