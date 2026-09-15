import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

/** Roughly two tiles per press — far enough to feel worth it, near enough to track. */
const STEP = 340;

/** Horizontally scrollable category tiles — the fastest way into the catalogue. */
export function CategoryStrip() {
  const { data: categories, isLoading } = useCategories();
  const railRef = useRef<HTMLDivElement>(null);

  /*
   * Which arrows to show. Both are hidden at the ends rather than disabled: an
   * arrow that cannot do anything is a target that punishes you for hitting it,
   * and the whole point of these is to signal "there is more that way".
   */
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setCanScroll({
      left: rail.scrollLeft > 4,
      /* 4px of slack: sub-pixel layout means scrollLeft rarely lands exactly on
         the maximum, which would otherwise leave a dead arrow showing forever. */
      right: rail.scrollLeft < max - 4,
    });
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    measure();
    rail.addEventListener('scroll', measure, { passive: true });

    /* Not just window resize: the rail's own width changes when the sidebar
       wraps, and its scrollWidth changes when categories finish loading. */
    const observer = new ResizeObserver(measure);
    observer.observe(rail);

    return () => {
      rail.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [measure, categories]);

  const nudge = (direction: -1 | 1) => {
    railRef.current?.scrollBy({ left: direction * STEP, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-40 shrink-0" />
        ))}
      </div>
    );
  }

  if (!categories?.length) return null;

  return (
    <div className="relative">
      <div
        ref={railRef}
        className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 pt-1 sm:mx-0 sm:px-0"
      >
        {categories.map((category, index) => (
          <Link
            key={category.slug}
            to={`/discover?category=${category.slug}`}
            style={{ animationDelay: `${index * 45}ms` }}
            className="group w-40 shrink-0 animate-[var(--animate-slide-up)] rounded-slab border border-edge bg-surface p-4 text-body shadow-hard transition-[transform,box-shadow] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg"
          >
            {/* Secondary: a themed surface, so the icon and text take the
                themed body ink and the tile reads the same way a card does. */}
            <CategoryIcon category={category.slug} className="size-9" aria-hidden="true" />
            <p className="mt-3 font-display text-sm uppercase leading-tight">{category.label}</p>
            <p className="mt-1 font-mono text-[11px] font-bold uppercase tabular-nums text-muted">
              {category.count} {category.count === 1 ? 'launch' : 'launches'}
            </p>
          </Link>
        ))}
      </div>

      <ScrollArrow side="left" show={canScroll.left} onClick={() => nudge(-1)} />
      <ScrollArrow side="right" show={canScroll.right} onClick={() => nudge(1)} />
    </div>
  );
}

/**
 * An edge arrow, with a fade behind it so tiles pass under rather than stop dead.
 *
 * Hidden from assistive tech and skipped in the tab order on purpose. It is a
 * *hint*, not a control: the rail is already a native scroll container, so a
 * keyboard user reaches every tile by tabbing and a screen reader announces the
 * links directly. Adding two more focus stops that only duplicate that would be
 * noise. `pointer-events-none` on the wrapper keeps the fade from swallowing
 * clicks meant for the tiles underneath.
 */
function ScrollArrow({
  side,
  show,
  onClick,
}: {
  side: 'left' | 'right';
  show: boolean;
  onClick: () => void;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-y-0 flex items-center transition-opacity duration-[160ms]',
        side === 'left' ? '-left-1 pr-8' : '-right-1 pl-8',
        show ? 'opacity-100' : 'opacity-0',
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={onClick}
        /* Only clickable while it is visible — an invisible button that still
           takes a click is a trap for anyone dragging near the edge. */
        className={cn(
          /* No hard shadow. These are edge hints on a scroll rail, not raised
             controls, and a 3px offset on a 32px button reads as clutter next to
             the tiles it sits over. The 2px border is enough to lift it. */
          /* Themed, like the tiles it sits over. The band behind them is themed
             too now, so a fixed bone chevron would be a white dot on a pale
             band in light mode. */
          'flex size-8 items-center justify-center border border-edge bg-surface text-body transition-transform duration-[120ms] ease-[var(--ease-snap)]',
          show ? 'pointer-events-auto hover:-translate-y-0.5' : 'pointer-events-none',
        )}
      >
        {side === 'left' ? (
          <ChevronLeftIcon className="size-4" />
        ) : (
          <ChevronRightIcon className="size-4" />
        )}
      </button>
    </div>
  );
}
