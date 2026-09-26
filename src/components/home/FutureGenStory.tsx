import { Link } from 'react-router-dom';
import { ItemLogo } from '@/components/items/ItemLogo';
import { RaiseBar } from '@/components/items/FundraiseProgress';
import { ButtonLink } from '@/components/ui/Button';
import { Star } from '@/components/ui/Star';
import { useItems } from '@/hooks/useItems';

/** How many prototypes the landing page shows. The page itself has the rest. */
const SHOWN = 3;

/**
 * Future Gen, told on the landing page.
 *
 * The one thing on Deck a general launch board does not have, which is exactly
 * why it belongs here and not only behind a nav link. Everything else on this
 * page makes the case that Deck is a good place to launch; this makes the case
 * that it is a place worth caring about.
 *
 * Editorial first, data second. The copy stands on its own, so the section is
 * complete on a board with no Future Gen entries at all — the prototypes, when
 * there are some, are evidence for the story rather than the story itself. No
 * names, places or figures are invented in the copy: everything specific on
 * screen comes from a real entry, or is not shown.
 */
export function FutureGenStory() {
  const { data } = useItems({ futureGen: true, sort: 'newest', limit: SHOWN });
  const entries = data?.data ?? [];

  return (
    <section
      aria-labelledby="future-gen-heading"
      className="relative isolate overflow-hidden border-y border-edge bg-surface-2"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-stripes text-edge opacity-[0.05]"
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:px-8">
        <div>
          <p className="inline-flex items-center gap-2 border border-edge bg-pop px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-pop shadow-hard-sm">
            <Star name="sparkle" className="size-3" spin={-8} /> Future Gen
          </p>

          <h2
            id="future-gen-heading"
            className="display-tight mt-5 text-3xl uppercase text-balance sm:text-4xl"
          >
            The next makers are building it on a workbench
          </h2>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted text-pretty">
            Young hardware builders across Africa, showing what they have made and raising what they
            need to make the next one. Boards, enclosures, motors and mistakes — prototypes in the
            open, not finished products.
          </p>

          {/* Stated plainly because it is the question a backer is really
              asking: is this vetted, and where does the money go? */}
          <ul className="mt-6 max-w-xl space-y-2">
            {/* Each line checked against how the software actually works:
                futureGen and raise approval are both staff-set, Deck collects
                every payment and disburses it (see the Payout model), and a new
                version is released as its own public launch. */}
            {[
              'Every entry is chosen by Deck staff, and every raise is reviewed before it can take money.',
              'Contributions are collected by Deck and passed on to the maker — no equity, no strings.',
              'Each new version ships as its own public launch, so progress stays on the record.',
            ].map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed text-pretty">
                <span aria-hidden="true" className="select-none text-accent">
                  —
                </span>
                {line}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/future-gen" size="lg">
              See the prototypes
            </ButtonLink>
          </div>
        </div>

        {/*
         * The evidence column. Three entries with their raise, or — on a board
         * with none yet — a single honest placeholder rather than a mocked-up
         * card. A fake prototype on a page about real teenagers would be the
         * one lie this section could not survive.
         */}
        <div className="self-center">
          {entries.length > 0 ? (
            <ul className="space-y-3">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <Link
                    to={`/item/${entry.slug}`}
                    className="group block rounded-slab border border-edge bg-surface p-4 shadow-hard transition-[transform,box-shadow] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg"
                  >
                    <div className="flex items-start gap-3">
                      <ItemLogo item={entry} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm uppercase group-hover:underline">
                          {entry.name}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted text-pretty">
                          {entry.tagline}
                        </p>
                      </div>
                    </div>
                    {entry.fundraise.open && (
                      <RaiseBar raise={entry.fundraise} size="sm" className="mt-4" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-slab border border-dashed border-edge bg-surface/60 p-6 text-center">
              <p className="font-display text-lg uppercase">The first prototypes are on the way</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted text-pretty">
                Future Gen entries appear here as staff approve them. The page explains how it works
                in the meantime.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
