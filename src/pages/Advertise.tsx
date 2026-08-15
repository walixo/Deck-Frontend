import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageBanner } from '@/components/ui/Ambient';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { useAdRates, useCreateAd, useMyAds, usePayForAd } from '@/hooks/useAds';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useMeta';
import { formatMoney } from '@/lib/utils';
import type { AdCampaign, AdPhase } from '@/types';

const PHASE: Record<AdPhase, { label: string; tone: string }> = {
  pending_review: { label: 'In review', tone: 'bg-grey text-ink' },
  rejected: { label: 'Not accepted', tone: 'bg-edge text-canvas' },
  awaiting_payment: { label: 'Ready to pay', tone: 'bg-lavender text-ink' },
  scheduled: { label: 'Scheduled', tone: 'bg-surface-2 text-muted' },
  running: { label: 'Running', tone: 'bg-acid text-ink' },
  finished: { label: 'Finished', tone: 'bg-surface-2 text-muted' },
  live: { label: 'Live', tone: 'bg-acid text-ink' },
  cancelled: { label: 'Cancelled', tone: 'bg-edge text-canvas' },
};

const dateOf = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/**
 * Buy a placement, and see how the ones you have bought are doing.
 *
 * Review comes before payment, and the copy says so — an advertiser who expects
 * to pay at the end of the form should not be surprised by a wait, and one who
 * has been rejected should never have been charged.
 */
export function Advertise() {
  const { user } = useAuth();
  const { data: rates } = useAdRates();
  const { data: campaigns, isLoading } = useMyAds();
  /* Only your own launches can be advertised, so the profile — which already
     carries them — is the whole picker, with no new endpoint needed. */
  const profile = useProfile(user?.username ?? '');
  const myLaunches = profile.data?.items ?? [];

  const create = useCreateAd();

  const [itemSlug, setItemSlug] = useState('');
  const [placement, setPlacement] = useState('discover');
  const [days, setDays] = useState(7);
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const card = rates?.placements.find((entry) => entry.placement === placement);
  const price = card?.prices.find((entry) => entry.days === days)?.priceMinor ?? 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        itemSlug,
        placement,
        days,
        headline,
        body,
        imageUrl: images[0],
        ctaLabel: 'Take a look',
      });
      setHeadline('');
      setBody('');
      setImages([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not book that');
    }
  };

  return (
    <div className="relative isolate mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-10">
        <p className="mb-3 inline-block border-2 border-edge bg-lavender px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
          Advertise
        </p>
        <h1 className="display-tight text-4xl uppercase text-balance sm:text-5xl">
          Put your launch in front of Deck
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted text-pretty">
          Buy a slot on the home page, Discover or the daily board. Deck reviews every ad before
          anything is charged — if it is turned down, you pay nothing.
        </p>
      </header>

      {rates && (
        <section aria-labelledby="rates-heading" className="mb-12">
          <h2
            id="rates-heading"
            className="mb-5 border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
          >
            Rates
          </h2>
          <dl className="grid gap-3 sm:grid-cols-3">
            {rates.placements.map((entry) => (
              <div
                key={entry.placement}
                className="border-2 border-edge bg-surface px-4 py-4 shadow-hard"
              >
                <dt className="font-display text-sm uppercase">{entry.placement}</dt>
                <dd className="mt-1 font-mono text-[11px] leading-relaxed text-muted">
                  {entry.label}
                </dd>
                <p className="mt-2 font-display text-xl tabular-nums">
                  {formatMoney(entry.dayRateMinor, rates.currency)}
                  <span className="ml-1 font-mono text-[11px] font-bold text-muted">/ day</span>
                </p>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="book-heading" className="mb-12">
        <h2
          id="book-heading"
          className="mb-5 border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
        >
          Book a slot
        </h2>

        {myLaunches.length === 0 ? (
          <EmptyState
            title="Launch something first"
            description="Ads point at one of your own launches, so there needs to be one to point at."
            action={<ButtonLink to="/submit">Launch your product</ButtonLink>}
          />
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                label="Which launch?"
                value={itemSlug}
                onChange={(event) => setItemSlug(event.target.value)}
                required
                options={[
                  { value: '', label: 'Choose a launch' },
                  ...myLaunches.map((item) => ({ value: item.slug, label: item.name })),
                ]}
              />
              <Select
                label="Placement"
                value={placement}
                onChange={(event) => setPlacement(event.target.value)}
                options={(rates?.placements ?? []).map((entry) => ({
                  value: entry.placement,
                  label: entry.placement,
                }))}
              />
            </div>

            <Select
              label="How long?"
              value={String(days)}
              onChange={(event) => setDays(Number(event.target.value))}
              options={(rates?.durations ?? [7]).map((value) => ({
                value: String(value),
                label: `${value} days`,
              }))}
            />

            <Input
              label="Headline"
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              maxLength={60}
              required
              counter={`${headline.length}/60`}
            />

            <Textarea
              label="One line about it"
              rows={2}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={140}
              required
              counter={`${body.length}/140`}
            />

            <ImageUpload
              label="Image (optional)"
              hint="Falls back to your launch's logo"
              value={images}
              onChange={setImages}
              max={1}
              aspect="square"
            />

            {/* The price is quoted from the server's own rate card, so what is
                shown here is what will be charged. */}
            <div className="border-2 border-edge bg-lavender px-4 py-3 text-ink">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em]">
                {days} days on {placement}
              </p>
              <p className="mt-1 font-display text-2xl tabular-nums">
                {formatMoney(price, rates?.currency)}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em]">
                Charged only after Deck approves it
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="border-2 border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
              >
                {error}
              </p>
            )}

            <Button type="submit" loading={create.isPending} disabled={!itemSlug}>
              Submit for review
            </Button>
          </form>
        )}
      </section>

      <section aria-labelledby="mine-heading">
        <h2
          id="mine-heading"
          className="mb-5 border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
        >
          Your campaigns
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((row) => (
              <Skeleton key={row} className="h-24 w-full" />
            ))}
          </div>
        ) : !campaigns?.length ? (
          <EmptyState title="No campaigns yet" description="Book a slot above to get started." />
        ) : (
          <ul className="space-y-3">
            {campaigns.map((campaign) => (
              <li key={campaign.id}>
                <CampaignRow campaign={campaign} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CampaignRow({ campaign }: { campaign: AdCampaign }) {
  const pay = usePayForAd();
  const [error, setError] = useState<string | null>(null);
  const phase = PHASE[campaign.phase];

  const checkout = async () => {
    setError(null);
    try {
      const result = await pay.mutateAsync(campaign.reference);
      window.location.assign(result.authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not open checkout');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base uppercase">{campaign.headline}</h3>
            <span
              className={`border-2 border-edge px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] ${phase.tone}`}
            >
              {phase.label}
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
            {campaign.placement} &middot; {campaign.days} days &middot; {dateOf(campaign.startAt)}–
            {dateOf(campaign.endAt)}
            {campaign.item ? ' · ' : ''}
            {campaign.item && (
              <Link to={`/item/${campaign.item.slug}`} className="hover:underline">
                {campaign.item.name}
              </Link>
            )}
          </p>

          {campaign.phase === 'rejected' && campaign.rejectionReason && (
            <p className="mt-2 text-xs leading-relaxed text-muted">{campaign.rejectionReason}</p>
          )}

          {/* Numbers only once there are some — a row of zeroes on a campaign
              that has not started reads as failure rather than as "not yet". */}
          {campaign.impressions > 0 && (
            <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
              <span className="tabular-nums text-body">{campaign.impressions}</span> shown &middot;{' '}
              <span className="tabular-nums text-body">{campaign.clicks}</span> clicks &middot;{' '}
              <span className="tabular-nums text-body">
                {(campaign.clickRate * 100).toFixed(1)}%
              </span>
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-display text-lg tabular-nums">
            {formatMoney(campaign.priceMinor, campaign.currency)}
          </p>
          {campaign.status === 'awaiting_payment' && (
            <Button
              size="sm"
              className="mt-2"
              onClick={() => void checkout()}
              loading={pay.isPending}
            >
              Pay and go live
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
    </Card>
  );
}
