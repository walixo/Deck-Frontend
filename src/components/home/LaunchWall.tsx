import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_LABELS, cn, formatNumber, gradientFor, PRICING_LABELS } from '@/lib/utils';
import type { Item } from '@/types';

interface LaunchWallProps {
  items: Item[];
  isLoading?: boolean;
}

/**
 * Full-bleed wall of launch previews on two rows that drift in opposite
 * directions. Cards are clipped at both edges on purpose — the wall should read
 * as a slice of something larger, not as a carousel with a start and an end.
 */
export function LaunchWall({ items, isLoading = false }: LaunchWallProps) {
  if (isLoading) {
    return (
      <section className="border-y border-zinc-200/80 py-4 dark:border-zinc-800">
        <div className="space-y-3 overflow-hidden">
          {[0, 1].map((row) => (
            <div key={row} className="flex gap-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton
                  key={index}
                  className={cn(
                    'h-56 shrink-0 rounded-xl sm:h-64 lg:h-72',
                    index % 3 === 2 ? 'w-52' : 'w-[26rem]',
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Need enough cards that a row still fills an ultrawide viewport.
  if (items.length < 4) return null;

  const midpoint = Math.ceil(items.length / 2);
  const topRow = items.slice(0, midpoint);
  const bottomRow = items.slice(midpoint);

  return (
    <section
      aria-labelledby="launch-wall-heading"
      className="group/wall relative border-y border-zinc-200/80 bg-white py-4 dark:border-zinc-800 dark:bg-[color:var(--color-canvas-dark)]"
    >
      <h2 id="launch-wall-heading" className="sr-only">
        A wall of launches on Deck
      </h2>

      <div className="space-y-3">
        <MarqueeRow items={topRow} direction="left" />
        <MarqueeRow items={bottomRow} direction="right" />
      </div>

    </section>
  );
}

function MarqueeRow({ items, direction }: { items: Item[]; direction: 'left' | 'right' }) {
  return (
    <div className="overflow-hidden">
      <div
        className={cn(
          'flex w-max',
          direction === 'left'
            ? 'animate-[var(--animate-marquee)]'
            : 'animate-[var(--animate-marquee-reverse)]',
          // Pausing on hover keeps both rows in step; pausing on focus means a
          // keyboard user's target stops moving the moment they reach it.
          'group-hover/wall:[animation-play-state:paused]',
          'group-focus-within/wall:[animation-play-state:paused]',
        )}
      >
        {/* Copy one is the real content; copy two only exists to make the loop seamless. */}
        <WallGroup items={items} />
        <WallGroup items={items} duplicate />
      </div>
    </div>
  );
}

function WallGroup({ items, duplicate = false }: { items: Item[]; duplicate?: boolean }) {
  return (
    // The duplicate copy is hidden from assistive tech and taken out of tab order,
    // so every launch is announced and reachable exactly once.
    <div
      className="flex shrink-0 gap-3 pr-3"
      aria-hidden={duplicate || undefined}
      inert={duplicate || undefined}
    >
      {items.map((item, index) => (
        <WallCard key={item.id} item={item} narrow={index % 3 === 2} focusable={!duplicate} />
      ))}
    </div>
  );
}

function WallCard({
  item,
  narrow,
  focusable,
}: {
  item: Item;
  narrow: boolean;
  focusable: boolean;
}) {
  return (
    <Link
      to={`/item/${item.slug}`}
      tabIndex={focusable ? undefined : -1}
      className={cn(
        'group/card relative block h-56 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5 transition-all duration-500 sm:h-64 lg:h-72 dark:ring-white/10',
        'hover:-translate-y-1 hover:ring-2 hover:ring-brand-500/60',
        narrow ? 'w-40 sm:w-48 lg:w-52' : 'w-64 sm:w-[26rem] lg:w-[30rem]',
      )}
    >
      {item.coverUrl ? (
        <img
          src={item.coverUrl}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover/card:scale-[1.03]"
        />
      ) : (
        <GeneratedPreview item={item} narrow={narrow} />
      )}

      {/* Identity strip, revealed on hover or focus so the resting state stays clean. */}
      <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/85 to-transparent p-3.5 pt-8 transition-transform duration-300 group-hover/card:translate-y-0 group-focus-visible/card:translate-y-0">
        <p className="truncate text-sm font-semibold text-white">{item.name}</p>
        <p className="mt-0.5 flex items-center gap-2 text-[11px] text-white/70">
          <span className="truncate">{CATEGORY_LABELS[item.category]}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0 tabular-nums">▲ {formatNumber(item.voteCount)}</span>
        </p>
      </div>
    </Link>
  );
}

/**
 * Stands in for a screenshot when a launch has no cover art: a stylised
 * mini-landing-page built from the item's own copy, tinted by its slug.
 */
function GeneratedPreview({ item, narrow }: { item: Item; narrow: boolean }) {
  return (
    <div
      className={cn(
        'relative flex size-full flex-col justify-between bg-gradient-to-br p-4 sm:p-5',
        gradientFor(item.slug),
      )}
    >
      {/* Texture so large flat gradients do not look empty. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.9) 1px, transparent 0)',
          backgroundSize: '14px 14px',
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full bg-white/25 blur-3xl"
      />

      <div className="relative flex items-center gap-1.5">
        <span className="flex size-5 items-center justify-center rounded-md bg-white/25 text-[9px] font-bold text-white backdrop-blur">
          {item.name.slice(0, 1)}
        </span>
        <span className="truncate text-[11px] font-medium tracking-wide text-white/80">
          {item.name}
        </span>
      </div>

      {/* Lifts and fades as the hover strip slides in, so the two never collide. */}
      <div className="relative transition-all duration-300 group-hover/card:-translate-y-2 group-hover/card:opacity-0 group-focus-visible/card:-translate-y-2 group-focus-visible/card:opacity-0">
        <p
          className={cn(
            'font-display font-semibold leading-[1.15] tracking-tight text-white text-balance drop-shadow-sm',
            narrow ? 'line-clamp-4 text-base' : 'line-clamp-3 text-xl sm:text-2xl lg:text-[1.7rem]',
          )}
        >
          {item.tagline}
        </p>

        {!narrow && (
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-zinc-900">
              {PRICING_LABELS[item.pricing]}
            </span>
            <span className="rounded-full border border-white/35 px-3 py-1 text-[11px] font-medium text-white/90">
              {CATEGORY_LABELS[item.category]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
