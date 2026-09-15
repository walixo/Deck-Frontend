import { useEffect, useRef, useState } from 'react';
import { Pill, Tape } from '@/components/home/Scrapbook';
import { ButtonLink } from '@/components/ui/Button';
import { paintShareCard, SHARE_CARD_CUTS, type ShareCardVariant } from '@/lib/shareCard';
import { cn } from '@/lib/utils';
import type { Item } from '@/types';

/**
 * The three share cards, pinned to the page like prints on a wall.
 *
 * These are not pictures of the cards. Each frame holds a real `<canvas>`
 * painted by the same code that produces the PNG a maker downloads from their
 * launch page, using a real launch off the newest feed — so the section cannot
 * drift away from the thing it is advertising, and there is no mock artwork to
 * keep in step with the generator.
 *
 * The composition is a scrapbook: three prints at slightly different angles,
 * taped at the top, each in a mount, each with a sticker peeled onto one
 * corner. Everything sits at an angle except the type, and the frames
 * straighten under the pointer — the one motion here, and the only thing that
 * makes a wall of prints feel like objects rather than a grid of images.
 */

/*
 * How wide each preview is painted, in device pixels.
 *
 * The cards are up to 1200x1350 at full size, and three of those at once is
 * 4.3 million pixels of backing store to show three thumbnails. 640 is a little
 * over 2x the widest they are ever displayed, so they stay crisp on a retina
 * screen at a twentieth of the memory.
 */
const PREVIEW_PX = 640;

/** Which cut goes where, and what each one is *for*. */
const WALL: { variant: ShareCardVariant; sticker: string; angle: number; nudge: string }[] = [
  { variant: 'launch', sticker: 'Post it', angle: -2.4, nudge: 'lg:mt-6' },
  { variant: 'board', sticker: 'Lead with the number', angle: 1.8, nudge: 'lg:-mt-2' },
  { variant: 'poster', sticker: 'Fill the screen', angle: -1.4, nudge: 'lg:mt-10' },
];

export function ShareShowcase({ items }: { items: Item[] }) {
  /*
   * Nothing to frame, nothing to show.
   *
   * The alternative is a made-up product on the landing page, drawn well enough
   * to be mistaken for a real one. An empty board is a true thing to say about
   * an empty board; an invented launch is not.
   */
  if (!items.length) return null;

  return (
    <section className="relative isolate overflow-hidden border-b border-edge py-14 sm:py-20">
      {/* The one big decorative shape, well under the type. Fixed at 12% rather
          than given a lighter token, so it reads the same weight against both
          canvases. */}
      <Blob className="pointer-events-none absolute -right-24 -top-16 -z-10 hidden w-[28rem] text-pop opacity-[0.12] lg:block" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-xl">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Made for posting
          </p>
          <h2 className="mt-2 display-tight text-3xl uppercase text-balance sm:text-4xl">
            One launch, three cards
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted text-pretty sm:text-base">
            Every launch comes with its own artwork, drawn in your browser in Deck&apos;s own type.
            Pick the shape the platform actually wants — nobody wants a letterbox on Instagram — and
            post it.
          </p>
        </header>

        {/*
         * `items-start`, because the three cuts are three different aspect
         * ratios and that is the entire point of the section. Stretching them
         * to a shared height would flatten the one difference the reader is
         * here to see.
         */}
        <div className="mt-10 grid items-start gap-10 sm:mt-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {WALL.map((slot, index) => (
            <Frame
              key={slot.variant}
              /* Cycles rather than requiring three launches: a board with one
                 launch on it still shows all three cuts, of that one launch. */
              item={items[index % items.length]}
              variant={slot.variant}
              sticker={slot.sticker}
              angle={slot.angle}
              className={slot.nudge}
            />
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-3">
          <ButtonLink to="/submit">Launch your product</ButtonLink>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
            Cards are on every launch page
          </p>
        </div>
      </div>
    </section>
  );
}

interface FrameProps {
  item: Item;
  variant: ShareCardVariant;
  sticker: string;
  angle: number;
  className?: string;
}

/** One print: tape, mount, card, caption, sticker. */
function Frame({ item, variant, sticker, angle, className }: FrameProps) {
  const cut = SHARE_CARD_CUTS[variant];
  const ref = useRef<HTMLCanvasElement>(null);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let cancelled = false;

    /*
     * Painted off-screen, then blitted.
     *
     * `paintShareCard` awaits the fonts and then the logo, so two runs can be
     * in flight at once whenever the launch changes — and because it paints
     * directly, the slower one would finish last and win. Compositing at the
     * end makes the swap atomic, and has the side effect that nobody ever sees
     * a half-drawn card.
     */
    const paint = async () => {
      const off = document.createElement('canvas');
      await paintShareCard(
        off,
        {
          name: item.name,
          tagline: item.tagline,
          voteCount: item.voteCount,
          logoUrl: item.logoUrl,
          /* Host and path, no scheme — the card is read, not clicked. */
          shareUrl: `${window.location.host.replace(/^www\./, '')}/item/${item.slug}`,
          launchDate: item.launchDate,
          variant,
        },
        PREVIEW_PX / cut.width,
      );
      if (cancelled || !off.width) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = off.width;
      canvas.height = off.height;
      ctx.drawImage(off, 0, 0);
      setPainted(true);
    };

    /*
     * Not until it is nearly on screen. This section sits well below the fold
     * and each card costs a font wait and an image fetch; doing that work
     * during the first paint of the landing page buys nothing at all.
     */
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        seen.disconnect();
        void paint();
      },
      { rootMargin: '300px' },
    );
    seen.observe(canvas);

    return () => {
      cancelled = true;
      seen.disconnect();
    };
  }, [item, variant, cut.width]);

  return (
    <figure className={cn('group/frame relative', className)}>
      {/* Tape lands on the top edge, half on and half off. */}
      <Tape angle={-16} className="-top-3 left-8 z-10" />
      <Tape angle={12} className="-top-2 right-10 z-10 hidden sm:block" />

      <div
        className={cn(
          'rounded-slab border border-edge bg-surface p-3 shadow-hard',
          'transition-[transform,box-shadow] duration-[140ms] ease-[var(--ease-snap)]',
          /*
           * Straightens under the pointer — the one motion in this section, and
           * what makes a wall of prints read as objects rather than as images.
           *
           * The angle arrives as a custom property rather than as an inline
           * `transform`, because an inline transform outranks any class and the
           * hover would never land. Both rules are classes now, and a `hover:`
           * utility is emitted after its base, so the cascade settles it.
           */
          '[transform:rotate(var(--tilt))] hover:[transform:rotate(0deg)]',
          'hover:shadow-hard-lg',
        )}
        style={{ '--tilt': `${angle}deg` } as React.CSSProperties}
      >
        {/* The mount. A picture in a frame has a border of mat around it, and
            that band of flat colour is what stops three busy cards on one row
            from bleeding into each other. */}
        <div className="rounded-slab bg-pop p-3 sm:p-4">
          <canvas
            ref={ref}
            aria-label={`${cut.label} card for ${item.name}`}
            role="img"
            className={cn(
              'block h-auto w-full rounded-[3px] border border-edge bg-canvas',
              /* Nothing to look at until it has been drawn — an unpainted
                 canvas is a transparent hole, and the mount showing through it
                 reads as a bug rather than as loading. */
              !painted && 'opacity-0',
            )}
            /* Reserves the right box before the first paint, so the row does
               not jump when three cards of three ratios arrive. */
            style={{ aspectRatio: `${cut.width} / ${cut.height}` }}
          />
        </div>

        <figcaption className="px-1 pb-1 pt-3">
          <p className="font-sans text-sm font-bold">{cut.label}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
            {cut.blurb}
          </p>
        </figcaption>
      </div>

      {/* Peeled onto the bottom-left corner, overlapping the frame's edge. */}
      <Pill angle={-5} className="absolute -bottom-3 left-6 z-10 shadow-hard-sm">
        {sticker}
      </Pill>
    </figure>
  );
}

/** The soft shape behind the wall. Two overlapping lobes, one path. */
function Blob({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" aria-hidden="true" className={className} fill="currentColor">
      <path d="M40 44c14-26 46-34 66-18 12 10 12 24 24 26 18 3 34-14 52-6 20 9 22 42 4 56-16 12-38 4-56 10-20 7-30 28-52 26-26-2-44-30-42-56 1-16 2-28 4-38Z" />
    </svg>
  );
}
