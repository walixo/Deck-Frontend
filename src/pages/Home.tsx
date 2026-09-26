import { AdSlot } from '@/components/ads/AdSlot';
import { ArcadeCoda } from '@/components/home/ArcadeCoda';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { FutureGenStory } from '@/components/home/FutureGenStory';
import { Hero } from '@/components/home/Hero';
import { HowItWorks } from '@/components/home/HowItWorks';
import { LaunchTicker } from '@/components/home/LaunchTicker';
import { LaunchVortex } from '@/components/home/LaunchVortex';
import { ShareShowcase } from '@/components/home/ShareShowcase';
import { Suspense } from 'react';
import { BrickDivider } from '@/components/ui/Bricks';
import { ButtonLink } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useItems } from '@/hooks/useItems';
import { useStats } from '@/hooks/useMeta';
import { lazyNamed } from '@/lib/lazy';

/*
 * Split off the entry bundle, like the arcade game further down. The reel is
 * below the fold and is a few dozen components of scene code; the landing page
 * should paint without waiting for any of it. Its placeholder holds the same
 * 16:9 box, so nothing below it moves when it arrives.
 */
const LaunchReel = lazyNamed(() => import('@/components/home/LaunchReel'), 'LaunchReel');

/*
 * The launch-day timeline, parked. The reel now tells the same day — opens at
 * midnight, votes, ranks lock, share kit — in a quarter of the scroll, and two
 * sections explaining one mechanic back to back was one too many. The
 * component keeps its whole implementation, live UTC countdown included, so
 * bringing it back is this one flag.
 */
const SHOW_HOW_IT_WORKS: boolean = false;

/**
 * The landing page.
 *
 * Says what Deck is, shows that it is busy, and offers two ways in. What it
 * used to carry — the board, the maker and tag cards, the launch wall — all
 * came off over time and has an address of its own now, so what is left below
 * the fold has to earn the room rather than duplicate another page.
 *
 * The sections that earn it, top to bottom: the thirty-second reel (the whole
 * product, end to end, without reading a word of it), the categories, the
 * vortex (the catalogue itself, turning), the share showcase (the artwork a
 * launch leaves with, drawn by the real generator), Future Gen (the one thing
 * a general launch board does not have), and an arcade coda behind a play
 * button.
 *
 * Half of them need no launches at all, which matters: a new board has none,
 * and the sections that depend on data hide themselves until there is some.
 * The page has to make its whole argument on day one without them.
 */
export function Home() {
  const { data: stats } = useStats();
  const launches = useItems({ sort: 'newest', limit: 24 });

  return (
    <>
      <Hero stats={stats} />

      {/*
       * The thirty-second film, straight off the hero.
       *
       * First below the fold because it is the fastest answer to the question
       * the hero raises — "what is this, and what happens if I launch?" — and
       * the one section a visitor can take in without reading. Everything
       * after it is detail on something the film has already shown.
       */}
      <Suspense
        fallback={
          <div className="border-b border-edge">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="mt-3 h-8 w-72" />
              <Skeleton className="mt-6 aspect-video w-full rounded-slab shadow-hard-lg" />
              <Skeleton className="mt-4 h-10 w-full" />
            </div>
          </div>
        }
      >
        <LaunchReel />
      </Suspense>

      {/*
       * The categories, under the film and over the vortex.
       *
       * The film ends on "launch your AI tool, your mobile app", so the strip
       * picks that thread straight up: here is every kind of thing you can
       * launch, one tap from its page. The vortex below then shows what has
       * actually been launched across all of them.
       *
       * A striped band, themed rather than fixed. The first version pinned
       * this to `bg-ink` in both themes, which made light mode a full-bleed
       * black slab across an otherwise bone page — far too heavy for a row of
       * navigation. `surface-2` keeps the band reading as a recessed shelf in
       * both: a warm grey on the light canvas, a raised charcoal on the dark
       * one. The stripes are the same flat texture the 404 and auth pages use,
       * in the themed ink so they invert with it, at an opacity low enough to
       * read as material rather than pattern.
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

      {/* The catalogue itself, turning. It used to sit flush against the hero
          as one long dark run; with the film and the shelf now between them it
          stands as its own band. */}
      <LaunchVortex items={launches.data?.data ?? []} total={stats?.launches} />

      {/*
       * The home ad slot, under the launch showcase — the place the rate card
       * describes. It had been sold ever since the launch wall came off this
       * page without anywhere left to render, so a home booking took money for
       * no impressions at all.
       *
       * The margin rides on the slot, not on this wrapper, so an unsold slot
       * with no Google fallback leaves nothing behind but a zero-height div.
       */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AdSlot placement="home" className="my-10" />
      </div>

      {SHOW_HOW_IT_WORKS && <HowItWorks />}

      {/* The wall is gone; the ticker carries the launches on its own now. One
          line of names travelling past says "this place is busy" without two
          rows of full-bleed panels saying it again underneath. */}
      <LaunchTicker items={launches.data?.data ?? []} />

      {/* Framed with real launches off the feed above, so this section can
          never advertise a card the generator does not actually produce. */}
      <ShareShowcase items={launches.data?.data ?? []} />

      {/* After the share cards: those make the case that Deck is a good place
          to launch, this makes the case that it is worth caring about. */}
      <FutureGenStory />

      {/* A course of bricks between the story and the exit — the page's
          section breaks are made of the same thing as the logo. */}
      <BrickDivider className="pt-14 text-edge/25" />

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

      {/* After the exit, deliberately. The page makes its case and offers the
          way in first; the game is a coda for whoever is still here. */}
      <ArcadeCoda />
    </>
  );
}
