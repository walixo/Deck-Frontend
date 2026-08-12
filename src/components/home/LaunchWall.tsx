import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_LABELS, cn, colourFor, formatNumber, PRICING_LABELS } from '@/lib/utils';
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
      <section className="border-y-2 border-edge py-3">
        <div className="space-y-3 overflow-hidden">
          {[0, 1].map((row) => (
            <div key={row} className="flex gap-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton
                  key={index}
                  className={cn('h-52 shrink-0 sm:h-60', index % 3 === 2 ? 'w-48' : 'w-[26rem]')}
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

  return (
    <section
      aria-labelledby="launch-wall-heading"
      className="group/wall relative border-y-2 border-edge bg-canvas py-3"
    >
      <h2 id="launch-wall-heading" className="sr-only">
        A wall of launches on Deck
      </h2>

      <div className="space-y-3">
        <MarqueeRow items={items.slice(0, midpoint)} direction="left" />
        <MarqueeRow items={items.slice(midpoint)} direction="right" />
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
  const colour = colourFor(item.slug);

  return (
    <Link
      to={`/item/${item.slug}`}
      tabIndex={focusable ? undefined : -1}
      className={cn(
        'group/card relative block h-52 shrink-0 overflow-hidden border-2 border-edge sm:h-60',
        'transition-transform duration-[140ms] ease-[var(--ease-snap)] hover:-translate-y-1',
        narrow ? 'w-40 sm:w-48' : 'w-64 sm:w-[24rem] lg:w-[27rem]',
      )}
    >
      {item.coverUrl ? (
        <img src={item.coverUrl} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <FlatPreview item={item} narrow={narrow} colour={colour} />
      )}

      {/* Identity strip, revealed on hover so the resting state stays clean. */}
      <div className="absolute inset-x-0 bottom-0 translate-y-full border-t-2 border-edge bg-surface px-3 py-2 transition-transform duration-[140ms] ease-[var(--ease-snap)] group-hover/card:translate-y-0 group-focus-visible/card:translate-y-0">
        <p className="truncate font-display text-[13px] uppercase">{item.name}</p>
        <p className="mt-0.5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-muted">
          <span className="truncate">{CATEGORY_LABELS[item.category]}</span>
          <span aria-hidden="true">/</span>
          <span className="shrink-0 tabular-nums">▲ {formatNumber(item.voteCount)}</span>
        </p>
      </div>
    </Link>
  );
}

/**
 * Stands in for a screenshot when a launch has no cover art: a flat colour
 * panel carrying the item's own pitch, set in display type.
 */
function FlatPreview({
  item,
  narrow,
  colour,
}: {
  item: Item;
  narrow: boolean;
  colour: { bg: string; ink: string };
}) {
  return (
    <div className={cn('relative flex size-full flex-col justify-between p-4', colour.bg, colour.ink)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-halftone opacity-[0.12]"
      />

      <div className="relative flex items-center gap-2">
        <span className="flex size-5 items-center justify-center border-2 border-current font-mono text-[9px] font-bold">
          {item.name.slice(0, 1)}
        </span>
        <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.08em] opacity-90">
          {item.name}
        </span>
      </div>

      <div className="relative">
        <p
          className={cn(
            'font-display uppercase leading-[1.05] tracking-tight text-balance',
            narrow ? 'line-clamp-4 text-sm' : 'line-clamp-3 text-lg sm:text-xl lg:text-2xl',
          )}
        >
          {item.tagline}
        </p>

        {!narrow && (
          <div className="mt-3 flex items-center gap-2">
            <span className="border-2 border-current px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
              {PRICING_LABELS[item.pricing]}
            </span>
            <span className="border-2 border-current px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
              {CATEGORY_LABELS[item.category]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
