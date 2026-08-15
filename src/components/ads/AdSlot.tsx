import { useNavigate } from 'react-router-dom';
import { GoogleAdSlot } from '@/components/ads/GoogleAdSlot';
import { request } from '@/lib/api';
import { useAdSlot } from '@/hooks/useAds';
import { cn } from '@/lib/utils';
import type { AdPlacement, ServedAd } from '@/types';

interface AdSlotProps {
  placement: AdPlacement;
  className?: string;
}

/**
 * One advertising slot, with a fallback chain.
 *
 * A paid Deck placement if one is running, otherwise a Google unit, otherwise
 * nothing at all. The chain lives here rather than at each call site so a page
 * only has to say *where* a slot is, and every slot behaves the same way.
 *
 * Nothing is reserved while the request is in flight. A skeleton would make an
 * unsold slot push the page down and then snap it back — worse than the slot
 * simply appearing a moment later, and worse for anyone reading.
 */
export function AdSlot({ placement, className }: AdSlotProps) {
  const { data: ad, isLoading, isError } = useAdSlot(placement);

  if (isLoading) return null;
  /* A failed lookup must not take the Google fallback down with it. */
  if (isError || !ad) return <GoogleAdSlot className={className} />;

  return <DeckAd ad={ad} className={className} />;
}

/**
 * A paid placement, drawn in Deck's own styling.
 *
 * The advertiser supplies text and an image, never markup — so an ad cannot
 * run a script, restyle the page, or dress itself up as editorial. It is
 * labelled, and the label is not optional.
 */
function DeckAd({ ad, className }: { ad: ServedAd; className?: string }) {
  const navigate = useNavigate();

  /*
   * The destination comes from the server, which reads it off the campaign's
   * own launch. The click is recorded first, but a failure to record it must
   * not swallow the navigation — the reader asked to go somewhere.
   */
  const go = async (event: React.MouseEvent) => {
    event.preventDefault();
    const href = ad.item ? `/item/${ad.item.slug}` : '/';
    try {
      const result = await request<{ href: string }>('post', `/ads/${ad.reference}/click`);
      void navigate(result.href || href);
    } catch {
      void navigate(href);
    }
  };

  return (
    <aside
      aria-label="Sponsored"
      className={cn(
        'rounded-slab border-2 border-edge bg-surface shadow-hard',
        /* Dashed rather than solid, so it reads as set apart from the page's
           own content at a glance rather than only via the label. */
        'border-dashed',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-4 p-4">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt=""
            className="size-14 shrink-0 border-2 border-edge object-cover"
          />
        ) : ad.item?.logoUrl ? (
          <img
            src={ad.item.logoUrl}
            alt=""
            className="size-14 shrink-0 border-2 border-edge object-cover"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
            Sponsored{ad.item ? ` · ${ad.item.name}` : ''}
          </p>
          <h3 className="mt-1 font-display text-base uppercase leading-tight">{ad.headline}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">{ad.body}</p>
        </div>

        <a
          href={ad.item ? `/item/${ad.item.slug}` : '/'}
          onClick={(event) => void go(event)}
          className="shrink-0 border-2 border-edge bg-lavender px-3.5 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-ink transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-y-0.5"
        >
          {ad.ctaLabel}
        </a>
      </div>
    </aside>
  );
}
