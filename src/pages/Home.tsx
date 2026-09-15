import { CategoryStrip } from '@/components/home/CategoryStrip';
import { Hero } from '@/components/home/Hero';
import { LaunchTicker } from '@/components/home/LaunchTicker';
import { LaunchVortex } from '@/components/home/LaunchVortex';
import { ShareShowcase } from '@/components/home/ShareShowcase';
import { ButtonLink } from '@/components/ui/Button';
import { useItems } from '@/hooks/useItems';
import { useStats } from '@/hooks/useMeta';

/**
 * The landing page.
 *
 * Says what Deck is, shows that it is busy, and offers two ways in. What it
 * used to carry — the board, the maker and tag cards, the launch wall — all
 * came off over time and has an address of its own now, so what is left below
 * the fold has to earn the room rather than duplicate another page.
 *
 * Two sections are the answer to that, and neither exists anywhere else on the
 * site. The vortex sits straight under the hero and is the catalogue itself,
 * turning; the share showcase further down shows the artwork a launch leaves
 * with, drawn live by the real generator rather than mocked up. Both are aimed
 * at the reader who has not launched yet.
 */
export function Home() {
  const { data: stats } = useStats();
  const launches = useItems({ sort: 'newest', limit: 24 });

  return (
    <>
      <Hero stats={stats} />

      {/*
       * Straight off the hero, and straight into the categories.
       *
       * Two dark full-bleed bands in a row is a deliberate run: the hero is a
       * starfield and this is a tunnel, so they read as one long night that the
       * striped shelf below cuts off. The hairline between them is the only
       * thing keeping them apart, and it earns its keep.
       */}
      <LaunchVortex items={launches.data?.data ?? []} total={stats?.launches} />

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
      <div className="relative isolate overflow-hidden border-b border-edge bg-surface-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-stripes text-edge opacity-[0.07]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <CategoryStrip />
        </div>
      </div>

      {/* The wall is gone; the ticker carries the launches on its own now. One
          line of names travelling past says "this place is busy" without two
          rows of full-bleed panels saying it again underneath. */}
      <LaunchTicker items={launches.data?.data ?? []} />

      {/* Framed with real launches off the feed above, so this section can
          never advertise a card the generator does not actually produce. */}
      <ShareShowcase items={launches.data?.data ?? []} />

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
