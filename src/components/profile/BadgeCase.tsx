import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { artFor } from '@/components/profile/badgeArt';
import { cn } from '@/lib/utils';
import type { ProfileBadge } from '@/types';

const FAMILY_LABEL: Record<string, string> = {
  making: 'Making',
  community: 'Community',
  trade: 'Trade',
};

const earnedOn = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/**
 * The trophy case, folded away until asked for.
 *
 * Built on `<details>` rather than a `useState` toggle. It is the element the
 * platform already ships for exactly this: keyboard operable, announced
 * correctly by screen readers as an expandable group, and findable by the
 * browser's own in-page search even while shut — none of which a `div` with an
 * `onClick` gets without being rebuilt by hand.
 *
 * The summary still carries the score, so the row says something useful closed.
 * A disclosure labelled only "Badges" makes you open it to learn whether there
 * was any point.
 */
export function BadgeCase({ badges }: { badges: ProfileBadge[] }) {
  const earned = badges.filter((badge) => badge.earned);

  return (
    <details className="group rounded-slab border border-edge bg-surface shadow-hard">
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-3 p-4',
          /* The default disclosure triangle is replaced by the chevron below. */
          '[&::-webkit-details-marker]:hidden',
          'focus-visible:outline-3 focus-visible:outline-offset-2',
        )}
      >
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]">Badges</span>

        {/* A stack of the earned marks, so the row is worth looking at shut. */}
        <span aria-hidden="true" className="flex items-center -space-x-1.5">
          {earned.slice(0, 5).map((badge) => {
            const art = artFor(badge.id);
            return (
              <span
                key={badge.id}
                className={cn(
                  'flex size-6 items-center justify-center border border-edge',
                  art.tone,
                )}
              >
                <art.solid className="size-3.5 text-ink" />
              </span>
            );
          })}
        </span>

        <span className="ml-auto font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
          <span className="tabular-nums text-body">{earned.length}</span> of {badges.length}
        </span>

        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform duration-[160ms] ease-[var(--ease-snap)] group-open:rotate-180"
        />
      </summary>

      <ul className="grid gap-2 border-t border-edge p-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => (
          <li key={badge.id}>
            <Tile badge={badge} />
          </li>
        ))}
      </ul>
    </details>
  );
}

function Tile({ badge }: { badge: ProfileBadge }) {
  const art = artFor(badge.id);
  /* Solid once earned, outline while it is still ahead of you. */
  const Icon = badge.earned ? art.solid : art.outline;

  return (
    <div
      className={cn(
        'flex h-full items-start gap-3 border border-edge p-3',
        badge.earned ? 'bg-surface shadow-hard-sm' : 'bg-surface-2',
      )}
      /* One label for the whole tile, so an unearned badge is never announced
         as an achievement and the progress is read as part of the same thought. */
      aria-label={
        badge.earned
          ? `${badge.name}, earned. ${badge.description}`
          : `${badge.name}, not yet earned. ${badge.description}. ${badge.progress} of ${badge.threshold}`
      }
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-10 shrink-0 items-center justify-center border border-edge',
          badge.earned ? cn(art.tone, 'shadow-hard-sm') : 'bg-surface',
        )}
      >
        {/* No extra opacity on the unearned icon: muted-on-surface is already
            2.9:1 in light mode, and dimming it further pushes a graphic under
            the 3:1 floor. Three signals already separate the two states — the
            coloured tile, the solid-versus-outline icon, and the hard shadow —
            so the fourth was costing legibility for nothing. */}
        <Icon className={cn('size-5', badge.earned ? 'text-ink' : 'text-muted')} />
      </span>

      <div className="min-w-0">
        <p
          className={cn(
            'font-display text-[13px] uppercase leading-tight',
            !badge.earned && 'text-muted',
          )}
        >
          {badge.name}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted text-pretty">
          {badge.description}
        </p>

        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
          {badge.earned && badge.earnedAt ? (
            earnedOn(badge.earnedAt)
          ) : (
            <>
              <span className="tabular-nums">{badge.progress}</span>
              <span aria-hidden="true"> / </span>
              <span className="tabular-nums">{badge.threshold}</span>
              <span className="ml-1">{FAMILY_LABEL[badge.family]}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
