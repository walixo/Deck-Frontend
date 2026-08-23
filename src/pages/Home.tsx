import { CategoryStrip } from '@/components/home/CategoryStrip';
import { Hero } from '@/components/home/Hero';
import { LaunchTicker } from '@/components/home/LaunchTicker';
import { LaunchWall } from '@/components/home/LaunchWall';
import { ButtonLink } from '@/components/ui/Button';
import { useItems } from '@/hooks/useItems';
import { useStats } from '@/hooks/useMeta';

/**
 * The landing page.
 *
 * Deliberately short. The board moved to `/today`, and the maker, tag and
 * launch-CTA cards went with it — this page's job is to say what Deck is, show
 * that it is busy, and offer two ways in. Everything it used to carry below the
 * fold now has an address of its own.
 */
export function Home() {
  const { data: stats } = useStats();
  const wall = useItems({ sort: 'newest', limit: 24 });

  return (
    <>
      <Hero stats={stats} />

      {/*
       * Categories above the wall.
       *
       * They are navigation and the wall is content, so the choice comes first:
       * somebody who already knows they want Claude skills should not have to
       * scroll past a marquee of everything else to say so.
       */}
      {/*
       * A striped band, themed rather than fixed.
       *
       * The first version pinned this to `bg-ink` in both themes, which made
       * light mode a full-bleed black slab across an otherwise bone page — far
       * too heavy for a row of navigation. `surface-2` keeps the band reading
       * as a recessed shelf in both: a warm grey on the light canvas, a raised
       * charcoal on the dark one. The stripes are the same flat texture the 404
       * and auth pages use, in the themed ink so they invert with it, at an
       * opacity low enough to read as material rather than pattern.
       */}
      <div className="relative isolate overflow-hidden border-b-2 border-edge bg-surface-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-stripes text-edge opacity-[0.07]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <CategoryStrip />
        </div>
      </div>

      {/* Ticker, then wall. The ticker is a single line of names travelling one
          way and the wall is two rows of panels travelling the other — a small
          statement of the same content before the large one. */}
      <LaunchTicker items={wall.data?.data ?? []} />

      <LaunchWall items={wall.data?.data ?? []} isLoading={wall.isLoading} />

      {/* One clear exit to the board, since it is no longer on this page. */}
      <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 lg:px-8">
        <h2 className="display-tight text-2xl uppercase text-balance sm:text-3xl">
          See what shipped today
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted text-pretty">
          Every launch of the day, ranked by votes. The board resets at midnight UTC.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink to="/leaderboard" size="lg">
            Today&apos;s board
          </ButtonLink>
          <ButtonLink to="/submit" variant="secondary" size="lg">
            Launch your product
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
