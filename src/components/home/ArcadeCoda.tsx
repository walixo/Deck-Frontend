import { Suspense, useEffect, useRef, useState } from 'react';
import { GameLogo } from '@/components/games/GameLogo';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { lazyNamed } from '@/lib/lazy';

/*
 * Lazy, and this time it works.
 *
 * An earlier version tried the same thing and the build reported the dynamic
 * import as ineffective: the arcade pages imported Sky Run statically, and with
 * no route-level splitting those pages were in the main bundle, so the game was
 * too, whatever this file did. The static import that replaced it said so.
 *
 * The routes are split now (see `App`), so nothing in the entry bundle imports
 * Sky Run statically any more, and this `lazy` is what keeps the game out of
 * the homepage download. It is fetched the first time somebody presses play.
 * If the build ever reports INEFFECTIVE_DYNAMIC_IMPORT for SkyRun again,
 * something eager has started importing it — find that, rather than giving up
 * on this.
 */
const SkyRun = lazyNamed(() => import('@/components/games/SkyRun'), 'SkyRun');

/**
 * A playable game at the bottom of the landing page, behind a play button.
 *
 * Click-to-play is not a style choice — it is what makes this safe to put on
 * the homepage at all. Sky Run listens for keys on the whole window, and while
 * it is idle it treats Space *and* Enter as "start" and calls
 * `preventDefault()` on both. Mounted by default, it would stop the spacebar
 * scrolling the homepage for every visitor, and swallow Enter on any focused
 * link — so a keyboard user could tab to "Launch your product" and find it did
 * nothing. Nothing mounts until somebody chooses to play, at which point
 * taking the keyboard is exactly what they asked for.
 *
 * And it gives the keyboard back. The game unmounts again once it scrolls fully
 * out of view, and there is a close button, so moving on from it restores the
 * page's normal keys without the reader having to know they were taken.
 *
 * The games are exempt from the palette rules, so the board keeps its own
 * colours; everything around it here is ordinary Deck.
 */
export function ArcadeCoda() {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing || !frameRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) setPlaying(false);
      },
      { threshold: 0 },
    );

    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, [playing]);

  return (
    <section aria-labelledby="arcade-heading" className="border-t border-edge">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              While you wait for midnight UTC
            </p>
            <h2 id="arcade-heading" className="display-tight mt-2 text-2xl uppercase sm:text-3xl">
              Play Sky Run
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            {playing && (
              <Button variant="secondary" onClick={() => setPlaying(false)}>
                Close game
              </Button>
            )}
            <ButtonLink to="/games" variant="ghost">
              All four games →
            </ButtonLink>
          </div>
        </div>

        <div ref={frameRef} className="mt-6">
          {playing ? (
            /* Shown only for the moment the game's chunk is in flight after the
               first press; on later presses it is cached and never appears. */
            <Suspense
              fallback={
                <div role="status">
                  <span className="sr-only">Loading Sky Run</span>
                  <Skeleton className="aspect-[960/420] w-full rounded-slab shadow-hard" />
                </div>
              }
            >
              <SkyRun />
            </Suspense>
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group relative grid w-full place-items-center overflow-hidden rounded-slab border border-edge bg-surface-2 py-14 shadow-hard transition-[transform,box-shadow] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg sm:py-20"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-stripes text-edge opacity-[0.06]"
              />
              <span className="relative flex flex-col items-center gap-5">
                <GameLogo
                  mark="sky-run"
                  className="h-16 w-auto text-body transition-transform duration-[160ms] group-hover:-translate-y-1"
                />
                <span className="inline-flex items-center gap-2 border border-edge bg-pop px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-on-pop shadow-hard-sm">
                  ▶ Press to play
                </span>
                {/* "Signed in" is load-bearing: the reporter drops scores from
                    anonymous players, so promising otherwise would be a lie
                    the first leaderboard check exposes. */}
                <span className="text-xs text-muted">
                  Arrows or pointer to fly. Signed in, your score goes on the arcade board.
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
