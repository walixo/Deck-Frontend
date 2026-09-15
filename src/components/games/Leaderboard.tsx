import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useGames';
import { cn, formatNumber, relativeTime, profilePath } from '@/lib/utils';

/**
 * All-time high scores for one game.
 *
 * Best per player, not best per run — otherwise one good player takes all ten
 * places and nobody else can see where they stand.
 *
 * It says out loud that scores are self-reported. The games run entirely in the
 * browser, so there is no server-side simulation to check a submission against
 * and there never will be for something this size. Pretending otherwise would
 * be the dishonest option; saying it means nobody mistakes this for a contest.
 */
export function Leaderboard({ slug, className }: { slug: string; className?: string }) {
  const { data, isLoading } = useLeaderboard(slug);
  const { user } = useAuth();

  return (
    <section aria-labelledby={`board-${slug}`} className={className}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-edge pb-2">
        <h3
          id={`board-${slug}`}
          className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
        >
          High scores
        </h3>
        {data && (
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
            {formatNumber(data.players)} {data.players === 1 ? 'player' : 'players'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-9 w-full" />
          ))}
        </div>
      ) : data?.scores.length ? (
        <ol className="space-y-px">
          {data.scores.map((row) => {
            const mine = Boolean(user && row.player && row.player.id === user.id);
            return (
              <li
                key={row.id}
                className={cn(
                  'flex items-center gap-3 rounded-slab px-2 py-1.5',
                  mine && 'bg-surface-2',
                )}
              >
                <span
                  className={cn(
                    'w-6 shrink-0 text-right font-mono text-[12px] font-bold tabular-nums',
                    row.rank <= 3 ? 'text-accent' : 'text-muted',
                  )}
                >
                  {row.rank}
                </span>
                {row.player ? (
                  <>
                    <Avatar user={row.player} size="xs" />
                    <Link
                      to={profilePath(row.player.username)}
                      className="min-w-0 flex-1 truncate text-sm underline-offset-4 hover:text-accent hover:underline"
                    >
                      {row.player.name}
                    </Link>
                  </>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">Someone</span>
                )}
                <span
                  className="shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-muted"
                  title={new Date(row.achievedAt).toLocaleString()}
                >
                  {relativeTime(row.achievedAt)}
                </span>
                <span className="w-20 shrink-0 text-right font-display text-sm tabular-nums">
                  {formatNumber(row.score)}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="py-4 text-sm text-muted text-pretty">
          Nobody has posted a score yet. {user ? 'Finish a run and yours goes up.' : ''}
        </p>
      )}

      {/* Where you stand, even when that is nowhere near the top ten. */}
      {data?.you && !data.scores.some((row) => row.player && user && row.player.id === user.id) && (
        <p className="mt-3 border-t border-edge pt-2 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
          You are {ordinal(data.you.rank)} with {formatNumber(data.you.score)}
        </p>
      )}

      {!user && (
        <p className="mt-3 border-t border-edge pt-2 text-xs leading-relaxed text-muted text-pretty">
          <Link to="/login" className="font-bold text-body underline underline-offset-2">
            Sign in
          </Link>{' '}
          to put your score on the board. Without an account your best is still kept, but only on
          this device.
        </p>
      )}

      <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.06em] text-muted/80">
        Scores are reported by your browser and not verified
      </p>
    </section>
  );
}

/** 1st, 2nd, 3rd, 4th — including the 11th–13th exceptions. */
function ordinal(value: number): string {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  const ones = value % 10;
  return `${value}${ones === 1 ? 'st' : ones === 2 ? 'nd' : ones === 3 ? 'rd' : 'th'}`;
}
