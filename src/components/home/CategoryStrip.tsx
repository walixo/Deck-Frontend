import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from '@/components/deckgames/motion';
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
          <Skeleton key={index} className="aspect-[1.586] w-56 shrink-0 rounded-[22px]" />
        ))}
      </div>
    );
  }

  if (!categories?.length) return null;

  return (
    <div className="relative">
      <div
        ref={railRef}
        className="no-scrollbar -mx-4 -mb-4 flex gap-3 overflow-x-auto px-4 pb-8 pt-1 sm:mx-0 sm:px-0"
      >
        {categories.map((category, index) => (
          <CategoryCard
            key={category.slug}
            slug={category.slug}
            label={category.label}
            count={category.count}
            index={index}
          />
        ))}
      </div>

      <ScrollArrow side="left" show={canScroll.left} onClick={() => nudge(-1)} />
      <ScrollArrow side="right" show={canScroll.right} onClick={() => nudge(1)} />
    </div>
  );
}

/* The GameID card's light: ember, amber, violet, teal. Each tile starts the
   ring at a different stop, so neighbours never share a colour in one corner. */
const ORBS = ['bg-[#e8501f]', 'bg-[#e08a10]', 'bg-[#6a44f0]', 'bg-[#139e90]'];

/**
 * One category as a small GameID card: a pane of glass over drifting light.
 *
 * The light is drawn inside the tile rather than bleeding past it as it does
 * on the GameID card itself, because the rail is a scroll container and would
 * clip anything outside. No backdrop-filter either — the orbs are already
 * blurred, so a translucent pane reads as frosted glass without asking the
 * compositor to blur a dozen moving layers twice. It leans toward the pointer
 * like the GameID card, and holds still under reduced motion.
 */
function CategoryCard({
  slug,
  label,
  count,
  index,
}: {
  slug: string;
  label: string;
  count: number;
  index: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const orb = (n: number) => ORBS[(index + n) % ORBS.length];

  const onMove = (event: React.PointerEvent) => {
    if (reduced || event.pointerType !== 'mouse') return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -12, y: x * 14 });
  };

  return (
    <div
      className="shrink-0 animate-[var(--animate-slide-up)] [perspective:900px]"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <Link
        ref={ref}
        to={`/discover?category=${slug}`}
        onPointerMove={onMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        className="group relative isolate flex aspect-[1.586] w-56 flex-col justify-between overflow-hidden rounded-[22px] border border-white/30 p-4 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.55),0_16px_28px_-16px_rgb(20_8_40/0.45)] transition-transform duration-500 ease-glide will-change-transform"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        {/* The light behind the glass. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 bg-[#3a1d5c] saturate-[1.7]"
        >
          <span
            className={cn(
              'absolute -left-[12%] -top-[20%] size-[80%] animate-g-drift rounded-full opacity-95 blur-2xl [--g-tilt:0deg]',
              orb(0),
            )}
          />
          <span
            className={cn(
              'absolute -right-[14%] -top-[24%] size-[72%] animate-g-drift rounded-full opacity-90 blur-2xl [--g-tilt:0deg] [animation-delay:-3s]',
              orb(1),
            )}
          />
          <span
            className={cn(
              'absolute -bottom-[30%] right-[6%] size-[76%] animate-g-drift rounded-full opacity-90 blur-2xl [--g-tilt:0deg] [animation-delay:-6s]',
              orb(2),
            )}
          />
          <span
            className={cn(
              'absolute -bottom-[26%] -left-[8%] size-[56%] animate-g-drift rounded-full opacity-80 blur-2xl [--g-tilt:0deg] [animation-delay:-4.5s]',
              orb(3),
            )}
          />
        </span>
        {/* The pane, its sheen, and a little shade at the foot for the text. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-white/[0.06]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(125deg,rgb(255_255_255/0.38)_0%,rgb(255_255_255/0.08)_32%,transparent_55%)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(170deg,rgb(24_10_36/0.04)_0%,rgb(24_10_36/0.12)_55%,rgb(16_6_26/0.3)_100%)]"
        />

        <CategoryIcon
          category={slug}
          className="size-8 drop-shadow-[0_1px_6px_rgb(0_0_0/0.25)]"
          aria-hidden="true"
        />
        <div className="[text-shadow:0_1px_10px_rgb(0_0_0/0.22)]">
          <p className="font-display text-[15px] font-semibold leading-tight tracking-[-0.03em]">
            {label}
          </p>
          <p className="mt-1 font-mono text-[11px] font-medium uppercase tabular-nums text-white/85">
            {count} {count === 1 ? 'launch' : 'launches'}
          </p>
        </div>
      </Link>
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
        'pointer-events-none absolute inset-y-0 flex items-center transition-opacity duration-300',
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
          'flex size-8 items-center justify-center border border-line bg-surface text-body transition-transform duration-300 ease-[var(--ease-snap)]',
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
