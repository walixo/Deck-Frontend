import { Link } from 'react-router-dom';
import { CategoryLabel } from '@/components/illustrations/CategoryIcon';
import { Skeleton } from '@/components/ui/Skeleton';
import { useWallColour } from '@/hooks/useDominantColour';
import { cn, formatNumber, PRICING_LABELS } from '@/lib/utils';
import type { Item } from '@/types';

/*
 * Wall panels cycle by position rather than hashing off the slug. Hashing gives
 * each item a stable identity, which is right for a small avatar but wrong for
 * a row of large panels: it clumps. Cycling guarantees an even beat.
 *
 * All four are neutral. These are the biggest colour fields on the site and
 * every one of them has somebody's product name — and often their logo — sitting
 * on top of it. An accent here does not decorate the launch, it argues with it.
 * The rhythm now comes from value alone, light through to dark, which reads just
 * as deliberately and lets thirty different logos share one wall without any of
 * them landing on a colour that fights.
 */
/*
 * Three of the four are FIXED neutrals rather than themed surfaces. Themed ones
 * collapse here: `surface`, `surface-2` and `ink` are #FFF, #EFEDE6 and #111 on
 * the light canvas — a wide spread — but #1E1E1E, #262626 and #111 in dark,
 * which is three shades of the same near-black and no rhythm at all. Pinning
 * the greys keeps the light-to-dark beat identical in both themes.
 */
const PANELS = [
  { bg: 'bg-surface', ink: 'text-body' },
  { bg: 'bg-grey', ink: 'text-ink' },
  { bg: 'bg-ink', ink: 'text-bone' },
  { bg: 'bg-grey-soft', ink: 'text-ink' },
];

/*
 * Two-tone panels: the launch's own colour ramped into a companion tone.
 *
 * Every panel gets one. The first attempt only gradiented launches whose logo
 * held two chromatic colours, which turned out to be none of them — a logo is
 * almost always one colour on white or black, and both neutrals are discarded
 * before counting. So the far stop is derived from the primary instead, and the
 * wall is consistent rather than three-in-thirty.
 *
 * This is the one soft edge in an otherwise entirely hard style, and it is a
 * deliberate exception: it sits on the content layer, where the colour belongs
 * to the product rather than to Deck. Every other surface stays flat.
 *
 * Flip to false for flat fills; nothing else changes.
 */
const GRADIENT_PANELS: boolean = true;

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
      <section className="border-y border-edge py-3">
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
      className="group/wall relative border-y border-edge bg-canvas py-3"
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
        <WallCard
          key={item.id}
          item={item}
          narrow={index % 3 === 2}
          focusable={!duplicate}
          colour={PANELS[index % PANELS.length]}
        />
      ))}
    </div>
  );
}

function WallCard({
  item,
  narrow,
  focusable,
  colour,
}: {
  item: Item;
  narrow: boolean;
  focusable: boolean;
  colour: { bg: string; ink: string };
}) {
  return (
    <Link
      to={`/item/${item.slug}`}
      tabIndex={focusable ? undefined : -1}
      className={cn(
        'group/card relative block h-52 shrink-0 overflow-hidden border border-edge sm:h-60',
        'transition-transform duration-[140ms] ease-[var(--ease-snap)] hover:-translate-y-1',
        narrow ? 'w-40 sm:w-48' : 'w-64 sm:w-[24rem] lg:w-[27rem]',
      )}
    >
      {/*
       * Always the colour panel — never the cover photo.
       *
       * The wall used to show `coverUrl` whenever a launch had one, which meant
       * every panel was a different person's screenshot at a different crop,
       * exposure and density. Thirty of those in a row is noise: the wall stopped
       * reading as one surface and the launches with no cover looked unfinished
       * beside the ones that had them. A cover is a screenshot of a product, and
       * it belongs on the product's own page where somebody has chosen to look at
       * it — the wall wants a colour and a name.
       */}
      <FlatPreview item={item} narrow={narrow} colour={colour} />

      {/*
       * Metadata strip, revealed on hover so the resting state stays clean.
       *
       * No longer repeats the name: the panel behind it now carries the logo and
       * the name at the top, so printing it again 200px below was the same word
       * twice on one card.
       */}
      <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center gap-2 border-t border-edge bg-surface px-3 py-2 font-mono text-[10px] font-bold uppercase transition-transform duration-[140ms] ease-[var(--ease-snap)] group-hover/card:translate-y-0 group-focus-visible/card:translate-y-0">
        <span className="min-w-0 truncate text-muted">
          <CategoryLabel slug={item.category} />
        </span>
        <span className="ml-auto shrink-0 border border-edge bg-surface-2 px-1.5 py-0.5 tabular-nums">
          ▲ {formatNumber(item.voteCount)}
        </span>
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
  /*
   * The launch supplies its own panel colour — chosen, or sampled from its logo.
   *
   * This is the one place an accent cannot argue with a product, because it IS
   * the product's colour. Sampling was only ever a guess at what the maker would
   * have picked, so a maker who picks explicitly overrides it. Falls back to the
   * neutral cycle when there is neither: no chosen colour, and no logo or a
   * greyscale one with no dominant hue to give.
   */
  const swatch = useWallColour(item.wallColour, item.logoUrl);

  return (
    <div
      className={cn(
        'relative flex size-full flex-col justify-between p-4',
        !swatch && colour.bg,
        !swatch && colour.ink,
      )}
      /* Inline because the value is computed per launch at runtime — there is
         no class for "whatever colour this maker's logo happens to be". */
      style={
        swatch
          ? {
              /* 135° so the fall runs corner to corner rather than flat down —
                 a vertical band reads as two stacked blocks, not one panel. */
              background: GRADIENT_PANELS
                ? `linear-gradient(135deg, ${swatch.hex}, ${swatch.gradientTo})`
                : swatch.hex,
              color: swatch.ink,
            }
          : undefined
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-halftone opacity-[0.12]"
      />

      {/*
       * The launch's actual mark, in a square, with its name beside it.
       *
       * This was a 20px box with the first letter of the name in it — a
       * monogram standing in for a logo that was, in most cases, sitting
       * uploaded and unused. The initial told a reader nothing they could not
       * read from the name two millimetres to its right.
       *
       * `object-contain` on a bone tile, not `object-cover`: a logo is artwork
       * with its own margins, and cropping one to fill a square cuts the mark.
       * The tile is a fixed light neutral rather than transparent because most
       * marks are drawn to sit on white, and a dark navy logo on a dark navy
       * panel is a square of nothing.
       */}
      <div className="relative flex items-center gap-2.5">
        {item.logoUrl ? (
          <img
            src={item.logoUrl}
            alt=""
            loading="lazy"
            className={cn(
              'shrink-0 border border-current bg-bone object-contain p-1',
              narrow ? 'size-9' : 'size-11',
            )}
          />
        ) : (
          <span
            aria-hidden="true"
            className={cn(
              'flex shrink-0 items-center justify-center border border-current font-display uppercase',
              narrow ? 'size-9 text-sm' : 'size-11 text-base',
            )}
          >
            {item.name.slice(0, 2)}
          </span>
        )}

        <span
          className={cn(
            'min-w-0 truncate font-display uppercase tracking-tight',
            narrow ? 'text-sm' : 'text-base',
          )}
        >
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
            <span className="border border-current px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
              {PRICING_LABELS[item.pricing]}
            </span>
            <span className="border border-current px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
              <CategoryLabel slug={item.category} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
