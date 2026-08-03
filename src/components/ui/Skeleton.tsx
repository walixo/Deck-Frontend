import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800/70',
        className,
      )}
    />
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-[color:var(--color-surface-dark)]">
      <div className="flex gap-4">
        <Skeleton className="size-14 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <Skeleton className="h-16 w-14 shrink-0 rounded-xl" />
      </div>
    </div>
  );
}

export function ItemCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <ItemCardSkeleton key={index} />
      ))}
    </div>
  );
}
