import { cn } from '@/lib/utils';
import type { ProfileBadge } from '@/types';

const FAMILY_LABEL: Record<string, string> = {
  making: 'Making',
  community: 'Community',
  trade: 'Trade',
};

const FAMILY_TONE: Record<string, string> = {
  making: 'bg-lavender text-ink',
  community: 'bg-acid text-ink',
  trade: 'bg-grey text-ink',
};

const earnedOn = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/**
 * The trophy case.
 *
 * Shows the unearned badges too, greyed and with their progress. A case that
 * only listed what you already have would be a receipt; showing the rest is
 * what makes it tell you where to go next — and the progress number is the
 * difference between "locked" and "two more to go".
 */
export function BadgeCase({ badges }: { badges: ProfileBadge[] }) {
  const earned = badges.filter((badge) => badge.earned);

  return (
    <section aria-labelledby="badges-heading">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-edge pb-2">
        <h2
          id="badges-heading"
          className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
        >
          Badges
        </h2>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
          <span className="tabular-nums text-body">{earned.length}</span> of {badges.length}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((badge) => (
          <li key={badge.id}>
            <div
              className={cn(
                'h-full border-2 border-edge p-3',
                badge.earned ? 'bg-surface shadow-hard' : 'bg-surface-2',
              )}
              /* The whole tile carries the state for a screen reader, so an
                 unearned badge is not read as an achievement. */
              aria-label={
                badge.earned
                  ? `${badge.name}, earned. ${badge.description}`
                  : `${badge.name}, not yet earned. ${badge.description}. ${badge.progress} of ${badge.threshold}`
              }
            >
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center border-2 border-edge font-mono text-[11px] font-bold tabular-nums',
                    badge.earned ? FAMILY_TONE[badge.family] : 'bg-surface text-muted opacity-50',
                  )}
                >
                  {badge.mark}
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
                </div>
              </div>

              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
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
          </li>
        ))}
      </ul>
    </section>
  );
}
