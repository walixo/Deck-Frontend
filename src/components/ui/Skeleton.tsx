import { cn } from '@/lib/utils';

/* Loading blocks are flat fills with a hard edge — same vocabulary as real content. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse border-2 border-edge bg-grey/40', className)}
    />
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="rounded-slab border-2 border-edge bg-surface p-4 shadow-hard">
      <div className="flex gap-4">
        <Skeleton className="size-12 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <Skeleton className="h-14 w-12 shrink-0" />
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
