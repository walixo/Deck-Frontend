import { Link } from 'react-router-dom';
import { Star } from '@/components/ui/Star';
import { cn, formatNumber } from '@/lib/utils';
import type { Item } from '@/types';

interface LaunchTickerProps {
  items: Item[];
  className?: string;
}

/**
 * A second flowing strip, above the wall, carrying the launches themselves.
 *
 * The footer's ticker says "LAUNCH · VOTE · REVIEW · REPEAT" — a slogan, and it
 * earns its place at the bottom of a page somebody has finished reading. This
 * one sits between the categories and the wall, where a slogan would be a wall
 * of nothing between two useful things, so it carries real launches: name, logo
 * and vote count, each one a link.
 *
 * It runs the opposite way to the wall's top row on purpose. Two strips
 * travelling in the same direction at similar speeds read as one badly-aligned
 * object; opposed, they read as two.
 *
 * Same seamless trick as everywhere else: the content is rendered twice and the
 * track travels exactly -50%, so the second copy lands where the first began.
 * The duplicate is `aria-hidden` and `inert`, so each launch is announced and
 * reachable exactly once.
 */
export function LaunchTicker({ items, className }: LaunchTickerProps) {
  /* Below about eight there is not enough content to fill an ultrawide track,
     and a marquee with a visible gap in it looks broken rather than sparse. */
  if (items.length < 8) return null;

  return (
    <section
      aria-labelledby="launch-ticker-heading"
      className={cn(
        'group/ticker relative overflow-hidden border-b-2 border-edge bg-deep py-2.5',
        className,
      )}
    >
      <h2 id="launch-ticker-heading" className="sr-only">
        Launches on Deck right now
      </h2>

      <div
        className={cn(
          'flex w-max animate-[var(--animate-marquee-reverse)]',
          'group-hover/ticker:[animation-play-state:paused]',
          'group-focus-within/ticker:[animation-play-state:paused]',
        )}
      >
        {[false, true].map((duplicate) => (
          <div
            key={String(duplicate)}
            className="flex shrink-0 items-center"
            aria-hidden={duplicate || undefined}
            inert={duplicate || undefined}
          >
            {items.map((item) => (
              <TickerItem key={item.id} item={item} focusable={!duplicate} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function TickerItem({ item, focusable }: { item: Item; focusable: boolean }) {
  return (
    <>
      <Link
        to={`/item/${item.slug}`}
        tabIndex={focusable ? undefined : -1}
        className="flex shrink-0 items-center gap-2.5 px-4 text-on-deep transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-y-0.5"
      >
        {item.logoUrl ? (
          /* On a bone tile, not transparent: most marks are drawn to sit on
             white, and a dark logo on the deep band is a square of nothing. */
          <img
            src={item.logoUrl}
            alt=""
            loading="lazy"
            className="size-7 shrink-0 border-2 border-current bg-bone object-contain p-0.5"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center border-2 border-current font-mono text-[10px] font-bold"
          >
            {item.name.slice(0, 1)}
          </span>
        )}

        <span className="whitespace-nowrap font-display text-sm uppercase tracking-tight">
          {item.name}
        </span>

        <span className="whitespace-nowrap font-mono text-[11px] font-bold tabular-nums opacity-70">
          ▲{formatNumber(item.voteCount)}
        </span>
      </Link>

      {/* The separator between entries. A star rather than a bullet, from the
          same set the nav marker uses — at this size a `·` disappears against
          the band and the names run together. */}
      <Star
        name="glint"
        className="size-3 shrink-0 text-on-deep opacity-50"
        spin={12}
      />
    </>
  );
}
