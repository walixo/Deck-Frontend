import { Link, useSearchParams } from 'react-router-dom';
import { CategoryLabel } from '@/components/illustrations/CategoryIcon';
import { Avatar } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { Money } from '@/components/ui/Money';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Star } from '@/components/ui/Star';
import { VerifiedMark } from '@/components/ui/VerifiedMark';
import { useAcquisitions } from '@/hooks/useAcquisitions';
import { useWallColour } from '@/hooks/useDominantColour';
import { cn, formatMoney, formatNumber, relativeTime } from '@/lib/utils';
import { ASSET_LABELS, type AcquisitionSummary } from '@/types';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-high', label: 'Price high' },
  { value: 'price-low', label: 'Price low' },
  { value: 'most-bids', label: 'Most offers' },
];

/**
 * The acquisitions board: products and tools for sale, outright.
 *
 * **The valuation is the design.** Everything else on a Deck card — votes, a
 * tagline, a category — is context; here the asking price is the thing somebody
 * came to read, so it is set in display type at the size of a page heading and
 * given its own band. A marketplace that makes you hunt for the number is a
 * marketplace people leave.
 *
 * Sold listings stay on the board rather than disappearing. A page that only
 * ever shows what is unsold looks permanently stagnant, and completed sales are
 * the strongest evidence a seller has that listing here is worth doing.
 */
export function Acquisitions() {
  const [params, setParams] = useSearchParams();
  const sort = params.get('sort') ?? 'newest';
  const search = params.get('search') ?? '';

  const { data, isLoading, isError, error, refetch } = useAcquisitions(sort, search);
  const feePercent = data?.meta.feePercent ?? 8;

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const listings = data?.data ?? [];
  const live = listings.filter((entry) => entry.status === 'approved');
  const sold = listings.filter((entry) => entry.status === 'sold');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="border-b border-edge pb-8">
        <p className="inline-flex items-center gap-2 border border-edge bg-pop px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-pop shadow-hard-sm">
          <Star name="sparkle" className="size-3" spin={-8} /> New on Deck
        </p>

        <h1 className="display-tight mt-5 text-[clamp(2.25rem,6vw,3.5rem)] uppercase text-balance">
          Acquisitions
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted text-pretty">
          Products and tools their makers are ready to hand over — source, domain, users, the lot.
          Make an offer, or list your own. Deck takes {feePercent}% when a sale completes and
          nothing at all until then.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink to="/discover" size="md">
            Browse launches to list
          </ButtonLink>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            List from your own launch page
          </p>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {SORTS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setParam('sort', option.value)}
            aria-pressed={sort === option.value}
            className={cn(
              'border border-edge px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-colors duration-[120ms]',
              sort === option.value
                ? 'bg-pop text-on-pop'
                : 'bg-surface text-muted hover:bg-surface-2 hover:text-body',
            )}
          >
            {option.label}
          </button>
        ))}

        <form
          role="search"
          className="ml-auto flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get('q');
            setParam('search', String(value ?? '').trim());
          }}
        >
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="SEARCH"
            aria-label="Search listings"
            className="h-9 w-40 border border-edge bg-surface px-3 font-mono text-[12px] font-bold uppercase tracking-[0.06em] placeholder:text-muted/70 focus:border-accent focus:outline-none"
          />
        </form>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-72 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-8">
          <ErrorState message={error.message} onRetry={() => void refetch()} />
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={search ? `Nothing matching "${search}"` : 'Nothing listed yet'}
            description="When makers put products up for sale, they show up here."
          />
        </div>
      ) : (
        <>
          {live.length > 0 && (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {live.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          {sold.length > 0 && (
            <section className="mt-14">
              <h2 className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
                Sold through Deck
              </h2>
              <ul className="mt-4 space-y-2">
                {sold.map((listing) => (
                  <li
                    key={listing.id}
                    className="flex flex-wrap items-center gap-3 rounded-slab border border-edge bg-surface-2 p-3"
                  >
                    <Link
                      to={`/acquisitions/${listing.slug}`}
                      className="min-w-0 flex-1 truncate font-display text-sm uppercase underline-offset-2 hover:underline"
                    >
                      {listing.item?.name ?? listing.slug}
                    </Link>
                    <span className="shrink-0 border border-edge bg-success px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-ink">
                      Sold
                    </span>
                    <span className="shrink-0 font-display text-base tabular-nums">
                      {formatMoney(listing.soldMinor, listing.currency)}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase text-muted">
                      {listing.soldAt ? relativeTime(listing.soldAt) : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/**
 * One listing.
 *
 * The price band is the card's spine: full-bleed, in the launch's own colour,
 * with the figure at 40px. Below it the three numbers a buyer uses to sanity
 * check that figure — revenue, costs, users — because an asking price with no
 * denominator is a number nobody can argue with or agree to.
 */
function ListingCard({ listing }: { listing: AcquisitionSummary }) {
  const item = listing.item;
  const swatch = useWallColour(item?.wallColour, item?.logoUrl);

  return (
    <Link
      to={`/acquisitions/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-slab border border-edge bg-surface shadow-hard transition-transform duration-[140ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg"
    >
      <div className="flex items-start gap-3 p-4">
        {item?.logoUrl ? (
          <img
            src={item.logoUrl}
            alt=""
            loading="lazy"
            className="size-12 shrink-0 border border-edge bg-bone object-contain p-1"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center border border-edge bg-surface-2 font-display uppercase"
          >
            {(item?.name ?? '?').slice(0, 2)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-lg uppercase leading-tight underline-offset-4 group-hover:underline">
            {item?.name ?? listing.slug}
          </h2>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted text-pretty">
            {item?.tagline}
          </p>
        </div>

        {listing.bidCount > 0 && (
          <span className="shrink-0 border border-edge bg-surface-2 px-2 py-1 text-center font-mono text-[9px] font-bold uppercase tracking-[0.06em]">
            <span className="block font-display text-sm tabular-nums leading-none">
              {listing.bidCount}
            </span>
            {listing.bidCount === 1 ? 'offer' : 'offers'}
          </span>
        )}
      </div>

      {/*
       * The valuation. Boldly, as asked.
       *
       * On the launch's own colour when it has one, which makes each listing
       * visually distinct in a two-column grid without Deck inventing a palette
       * for somebody else's product — the same reasoning as the launch wall.
       */}
      <div
        className="border-y border-edge px-4 py-3"
        style={
          swatch
            ? { background: `linear-gradient(135deg, ${swatch.hex}, ${swatch.gradientTo})`, color: swatch.ink }
            : undefined
        }
      >
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] opacity-80">
          Asking
          {!listing.negotiable && ' · firm'}
        </p>
        <p className="font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-none tabular-nums">
          <Money
            minor={listing.askingMinor}
            approxClassName="!text-current text-sm font-normal opacity-75"
          />
        </p>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <dl className="grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-[0.06em]">
          <Stat label="Revenue / mo" value={formatMoney(listing.monthlyRevenueMinor)} />
          <Stat label="Costs / mo" value={formatMoney(listing.monthlyCostMinor)} />
          <Stat label="Users" value={formatNumber(listing.activeUsers)} />
        </dl>

        {listing.assets.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {listing.assets.slice(0, 4).map((asset) => (
              <span
                key={asset}
                className="border border-edge px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-muted"
              >
                {ASSET_LABELS[asset]}
              </span>
            ))}
            {listing.assets.length > 4 && (
              <span className="px-1 font-mono text-[9px] uppercase text-muted">
                +{listing.assets.length - 4}
              </span>
            )}
          </div>
        )}

        <p className="mt-auto flex flex-wrap items-center gap-2 pt-4 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
          {listing.seller && <Avatar user={listing.seller} size="sm" />}
          <span>{listing.seller?.name}</span>
          {listing.seller?.verified && <VerifiedMark name={listing.seller.name} />}
          {item?.category && (
            <>
              <span aria-hidden="true">/</span>
              <CategoryLabel slug={item.category} />
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-edge bg-surface-2 px-2 py-1.5">
      <dd className="font-display text-xs tabular-nums">{value}</dd>
      <dt className="mt-0.5 text-[9px] font-bold text-muted">{label}</dt>
    </div>
  );
}
