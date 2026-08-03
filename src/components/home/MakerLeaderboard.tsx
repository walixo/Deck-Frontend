import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTopMakers } from '@/hooks/useMeta';
import { cn, formatNumber, MEDAL_STYLES } from '@/lib/utils';

export function MakerLeaderboard() {
  const { data: makers, isLoading } = useTopMakers();

  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!makers?.length) return null;

  return (
    <ol className="space-y-1">
      {makers.slice(0, 6).map((maker) => (
        <li key={maker.user.id}>
          <Link
            to={`/u/${maker.user.username}`}
            className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular-nums ring-1',
                MEDAL_STYLES[maker.rank] ??
                  'bg-zinc-100 text-zinc-500 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700',
              )}
            >
              {maker.rank}
            </span>
            <Avatar user={maker.user} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium group-hover:text-brand-600 dark:group-hover:text-brand-400">
                {maker.user.name}
              </span>
              <span className="block truncate text-xs text-zinc-500 dark:text-zinc-500">
                {maker.launches} {maker.launches === 1 ? 'launch' : 'launches'}
              </span>
            </span>
            <span className="shrink-0 text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
              ▲ {formatNumber(maker.votes)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
