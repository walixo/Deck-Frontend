import { Link } from 'react-router-dom';
import { CategoryLabel } from '@/components/illustrations/CategoryIcon';
import { RaiseBar } from '@/components/items/FundraiseProgress';
import { MediaSlider } from '@/components/items/MediaSlider';
import { ItemLogo } from '@/components/items/ItemLogo';
import { VoteButton } from '@/components/items/VoteButton';
import { Avatar } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Star } from '@/components/ui/Star';
import { VerifiedMark } from '@/components/ui/VerifiedMark';
import { useItems } from '@/hooks/useItems';
import { useWallColour } from '@/hooks/useDominantColour';
import { slidesFor } from '@/lib/media';
import { cn, formatFullDate, formatNumber, profilePath } from '@/lib/utils';
import type { Item } from '@/types';

/**
 * Future Gen — young hardware makers in Africa, and what they are building.
 *
 * A timeline rather than a board, and that is the whole design. The rest of
 * Deck ranks: the daily board sorts by votes, Discover sorts by trending, and
 * both are answering "what is best right now". A prototype is not competing
 * with anything — it is a thing that has been getting made for months, and the
 * interesting question about it is *when*, not *where it placed*. So this reads
 * oldest concerns first, newest at the top, on a single spine.
 *
 * The fundraise status is on every entry by request, and it is the reason the
 * page exists rather than being a filter on Discover: somebody arriving here is
 * deciding whether to back a teenager they have never met, and how far along
 * the raise is answers most of what they want to know before they read a word.
 */
export function FutureGen() {
  const { data, isLoading, isError, error, refetch } = useItems({
    futureGen: true,
    sort: 'newest',
    limit: 48,
  });

  const entries = data?.data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="border-b border-edge pb-8">
        <p className="inline-flex items-center gap-2 border border-edge bg-pop px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-pop shadow-hard-sm">
          <Star name="sparkle" className="size-3" spin={-8} /> New on Deck
        </p>

        <h1 className="display-tight mt-5 text-[clamp(2.25rem,6vw,3.5rem)] uppercase text-balance">
          Future Gen
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted text-pretty">
          Young hardware builders across Africa, showing what they have made and raising what they
          need to make the next one. Boards, enclosures, motors, mistakes — prototypes in the open,
          not finished products.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink to="/submit" size="md">
            Show what you built
          </ButtonLink>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            Post it as a launch — Deck adds it here
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="mt-10 space-y-6">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-56 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-10">
          <ErrorState message={error.message} onRetry={() => void refetch()} />
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Nothing on the timeline yet"
            description="The first prototypes will show up here as Deck adds them."
          />
        </div>
      ) : (
        <ol className="mt-10">
          {entries.map((item, index) => (
            <Entry key={item.id} item={item} last={index === entries.length - 1} />
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * One prototype on the spine.
 *
 * The spine is a border on the marker column rather than an absolutely
 * positioned line, so it grows with the entry's own height and cannot fall out
 * of step with it at any content length. The last entry's line stops at its
 * marker — a timeline that keeps going after the final item promises something
 * below that is not there.
 */
function Entry({ item, last }: { item: Item; last: boolean }) {
  const raise = item.fundraise;
  const swatch = useWallColour(item.wallColour, item.logoUrl);
  const media = slidesFor(item);

  return (
    <li className="flex gap-4 sm:gap-6">
      {/* The spine and its node. */}
      <div className="flex w-4 shrink-0 flex-col items-center sm:w-5">
        <span
          aria-hidden="true"
          className="size-4 shrink-0 border border-edge bg-pop sm:size-5"
          /* The maker's own colour on the node when they have one — the same
             logic the launch wall uses, and the only spot of content colour on
             an otherwise neutral page. */
          style={swatch ? { background: swatch.hex } : undefined}
        />
        {!last && <span aria-hidden="true" className="w-0.5 flex-1 bg-edge" />}
      </div>

      <article className="min-w-0 flex-1 pb-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          {formatFullDate(item.launchDate)}
        </p>

        <div className="mt-2 rounded-slab border border-edge bg-surface p-4 shadow-hard sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <ItemLogo item={item} size="lg" />

            <div className="min-w-0 flex-1">
              <Link
                to={`/item/${item.slug}`}
                className="font-display text-xl uppercase leading-tight underline-offset-4 hover:underline sm:text-2xl"
              >
                {item.name}
              </Link>
              <p className="mt-1.5 text-sm leading-relaxed text-muted text-pretty">
                {item.tagline}
              </p>

              <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-muted">
                <Avatar user={item.submittedBy} size="sm" />
                <Link to={profilePath(item.submittedBy.username)} className="hover:underline">
                  {item.submittedBy.name}
                </Link>
                {item.submittedBy.verified && <VerifiedMark name={item.submittedBy.name} />}
                <span aria-hidden="true">/</span>
                <CategoryLabel slug={item.category} />
              </p>
            </div>

            <div className="shrink-0">
              <VoteButton item={item} />
            </div>
          </div>

          {/*
           * The build itself, one piece at a time.
           *
           * A prototype is a physical object and the photograph is most of the
           * post — the launch page already has a gallery, but somebody scanning
           * the timeline should not have to open five tabs to see five builds.
           *
           * Renders nothing when there is no media, so an entry that is only
           * text stays a compact row rather than reserving a grey rectangle.
           */}
          {media.length > 0 && (
            <MediaSlider
              slides={media}
              label={`${item.name} — photos and video`}
              className="mt-4"
            />
          )}

          {/* The raise. Every state gets a line, including "not raising" —
              a reader scanning the timeline should never have to work out
              whether a missing bar means no raise or a raise at zero. */}
          <div className="mt-4 border-t border-edge pt-4">
            <FundraiseStatus item={item} />
          </div>

          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            {formatNumber(item.voteCount)} {item.voteCount === 1 ? 'vote' : 'votes'} ·{' '}
            {formatNumber(item.commentCount)} {item.commentCount === 1 ? 'comment' : 'comments'}
            {raise.enabled && ` · ${formatNumber(raise.contributorCount)} backing it`}
          </p>
        </div>
      </article>
    </li>
  );
}

/** The raise, in whichever of its five states this prototype is in. */
function FundraiseStatus({ item }: { item: Item }) {
  const raise = item.fundraise;

  if (raise.status === 'approved' && raise.targetMinor > 0) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone={raise.open ? 'live' : 'quiet'}>
            {raise.closed ? 'Raise closed' : raise.percent >= 100 ? 'Funded' : 'Raising now'}
          </StatusChip>
        </div>
        <RaiseBar raise={raise} size="sm" className="mt-3" />
      </div>
    );
  }

  if (raise.status === 'pending') {
    return <StatusChip tone="quiet">Fundraise under review</StatusChip>;
  }

  /* Eligibility is public, so a reader who cannot back this yet can still see
     what would change that — and voting is the thing they can do about it. */
  const { eligibility } = raise;
  if (!eligibility.met) {
    const shortVotes = Math.max(0, eligibility.votesNeeded - eligibility.votes);
    const shortComments = Math.max(0, eligibility.commentsNeeded - eligibility.comments);

    return (
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
        Not raising yet —{' '}
        {[
          shortVotes > 0 && `${shortVotes} more ${shortVotes === 1 ? 'vote' : 'votes'}`,
          shortComments > 0 &&
            `${shortComments} more ${shortComments === 1 ? 'comment' : 'comments'}`,
        ]
          .filter(Boolean)
          .join(' and ')}{' '}
        to qualify
      </p>
    );
  }

  return (
    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
      Not raising
    </p>
  );
}

function StatusChip({ tone, children }: { tone: 'live' | 'quiet'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-block border border-edge px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]',
        /* `success` is the one green on Deck and it means "this worked" —
           CONTRACT rule 6. A live raise qualifies; a paused one is grey, not
           red, because nothing has gone wrong. */
        tone === 'live' ? 'bg-success text-ink' : 'bg-surface-2 text-muted',
      )}
    >
      {children}
    </span>
  );
}
