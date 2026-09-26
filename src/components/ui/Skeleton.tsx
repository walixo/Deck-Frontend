import { cn } from '@/lib/utils';

/* Loading blocks are flat fills with a hard edge — same vocabulary as real content. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse border border-edge bg-grey/40', className)}
    />
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="rounded-slab border border-edge bg-surface p-4 shadow-hard">
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

/**
 * What a lazily loaded route shows while its code is on the way.
 *
 * Deliberately generic — a heading, a lede, a grid of slabs — because it stands
 * in for fifty different pages and cannot know which one is coming. It is not
 * the page's own loading state: once the code arrives the page renders its own
 * skeleton for its data, which *can* be shaped like the page.
 *
 * In practice this only shows on a cold load of a split route (a refresh on
 * `/admin`, a shared link to `/games/sky-run`). In-app navigation runs inside a
 * transition, so React keeps the current page on screen until the next one is
 * ready rather than flashing this in between.
 *
 * `SectionSkeleton` is the body alone, for inside the staff and account shells,
 * which already supply the page's width and gutter; `PageSkeleton` adds them.
 */
export function SectionSkeleton() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading</span>
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-2/3 sm:w-2/5" />
        <Skeleton className="h-4 w-full sm:w-3/5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-slab shadow-hard" />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <SectionSkeleton />
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
