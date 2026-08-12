import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTopMakers } from '@/hooks/useMeta';
import { cn, formatNumber, MEDAL_STYLES } from '@/lib/utils';

export function MakerLeaderboard() {
  const { data: makers, isLoading } = useTopMakers();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!makers?.length) return null;

  return (
    <ol className="space-y-1.5">
      {makers.slice(0, 6).map((maker) => (
        <li key={maker.user.id}>
          <Link
            to={`/u/${maker.user.username}`}
            className="group flex items-center gap-2.5 border-2 border-transparent px-2 py-2 transition-colors duration-[120ms] hover:border-edge hover:bg-surface-2"
          >
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center border-2 border-edge font-mono text-[11px] font-bold tabular-nums',
                MEDAL_STYLES[maker.rank] ?? 'bg-surface-2 text-muted',
              )}
            >
              {maker.rank}
            </span>
            <Avatar user={maker.user} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[13px] uppercase group-hover:text-cobalt">
                {maker.user.name}
              </span>
              <span className="block truncate font-mono text-[10px] uppercase text-muted">
                {maker.launches} {maker.launches === 1 ? 'launch' : 'launches'}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-muted">
              ▲ {formatNumber(maker.votes)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
