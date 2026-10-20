import { useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, ArrowUturnLeftIcon } from '@heroicons/react/20/solid';
import { useReducedMotion } from '@/components/deckgames/motion';
import { ItemLogo } from '@/components/items/ItemLogo';
import { QrCode } from '@/components/ui/QrCode';
import { STATS_SHOWN_FROM } from '@/lib/thresholds';
import { CATEGORY_LABELS, cn, formatDay, formatNumber, prettyUrl } from '@/lib/utils';
import type { Item } from '@/types';

/**
 * Launches hung on a line, like ID cards on a lanyard.
 *
 * Four real launches off the feed, each on its own thread from a single string
 * across the section, at staggered drops so the row reads as hung by hand
 * rather than laid out on a grid. They sway gently from their pins. Over a
 * card with a mouse it leans toward the pointer and a holographic sheen slides
 * across it; a click or tap turns it over to a foil back with the maker, the
 * numbers so far, a link out, and a QR code that opens the launch on a phone.
 *
 * Swaying and leaning stop for anyone who has asked for reduced motion; the
 * flip still works, just without the turn.
 */

/* How far below the string each card's clip hangs, in px, by position. */
const DROPS = [22, 64, 42, 64];
/* The angle each card rests at as it sways. */
const RESTS = [-1.5, 1, -0.8, 1.6];
/* Pastel grounds for a launch with no cover and no wall colour. */
const GROUNDS = ['bg-badge-orchid', 'bg-badge-sky', 'bg-badge-sand', 'bg-badge-mint'];

/* The string: where it sits at its ends, and how far it sags in the middle. */
const STRING_Y = 6;
const SAG = 9;
const stringY = (t: number) => STRING_Y + 4 * SAG * t * (1 - t);

/* Iridescent foil, for the back and for the sheen on the front. */
const FOIL =
  'linear-gradient(125deg, #c8f0ec 0%, #f4f1c2 26%, #f6d9ee 50%, #d8d2fa 74%, #c4e4fa 100%)';
const SHEEN =
  'linear-gradient(115deg, transparent 22%, rgb(140 230 225 / 0.55) 36%, rgb(250 240 150 / 0.55) 46%, rgb(245 160 215 / 0.55) 56%, rgb(170 160 250 / 0.55) 66%, transparent 80%)';

const pad = (value: number) => String(value).padStart(2, '0');

export function LaunchLine({ items, total }: { items: Item[]; total?: number }) {
  const still = useReducedMotion();

  /* The best-received of the newest launches, so the line shows what the
     board liked rather than whatever happened to post last. */
  const cards = [...items].sort((a, b) => b.voteCount - a.voteCount).slice(0, 4);
  if (cards.length === 0) return null;

  const count =
    total && total >= STATS_SHOWN_FROM.launches
      ? `${formatNumber(total)} launches, one board`
      : `${pad(cards.length)} launches, one board`;

  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <header className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_17rem]">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
              On the board · Newest
            </p>
            <h2 className="mt-5 display-tight text-4xl text-balance sm:text-5xl lg:text-6xl">
              Meet the launches
              <span className="block text-accent">behind the board.</span>
            </h2>
          </div>
          <div>
            <p className="text-sm leading-relaxed text-muted text-pretty">
              Different makers, one board. Every card is a real launch, posted by the people who
              built it.
            </p>
            <p className="mt-4 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
              {count}
            </p>
          </div>
        </header>

        {/* Four to a line from a tablet up; two lines of two on a phone. */}
        <Line cards={cards} offset={0} still={still} className="mt-12 hidden md:block" />
        <div className="mt-10 space-y-8 md:hidden">
          <Line cards={cards.slice(0, 2)} offset={0} still={still} />
          {cards.length > 2 && <Line cards={cards.slice(2)} offset={2} still={still} />}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
          <span>The makers make the board.</span>
          <span>
            <span className="hidden [@media(hover:hover)]:inline">Hover to shimmer · Click</span>
            <span className="[@media(hover:hover)]:hidden">Tap</span> to flip
          </span>
        </div>
      </div>
    </section>
  );
}

/** One string, with a card hanging from it over each column. */
function Line({
  cards,
  offset,
  still,
  className,
}: {
  cards: Item[];
  /** Where these cards start in the whole set, so numbering and drops follow on. */
  offset: number;
  still: boolean;
  className?: string;
}) {
  const n = cards.length;
  /* The string runs a little past the outer pins, and no further. */
  const start = Math.max(0, 0.5 / n - 0.08);
  const end = 1 - start;
  const points = Array.from({ length: 25 }, (_, k) => {
    const t = start + ((end - start) * k) / 24;
    return `${(t * 100).toFixed(2)},${stringY(t).toFixed(2)}`;
  }).join(' ');

  return (
    <div className={cn('relative', className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 top-0 h-10 w-full overflow-visible text-muted/70"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <ul className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {cards.map((item, i) => {
          const position = offset + i;
          return (
            <Hanger
              key={item.id}
              item={item}
              position={position}
              pinTop={stringY((i + 0.5) / n)}
              still={still}
            />
          );
        })}
      </ul>
    </div>
  );
}

/** A pin on the string, a thread, a clip, and the card — swaying as one. */
function Hanger({
  item,
  position,
  pinTop,
  still,
}: {
  item: Item;
  position: number;
  pinTop: number;
  still: boolean;
}) {
  const drop = DROPS[position % DROPS.length]!;
  const rest = RESTS[position % RESTS.length]!;

  return (
    <li
      className="relative flex justify-center px-1.5 sm:px-3 lg:px-4"
      style={{ paddingTop: pinTop }}
    >
      <span
        aria-hidden="true"
        className="absolute left-1/2 z-10 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted"
        style={{ top: pinTop }}
      />
      <div
        className={cn('w-full max-w-[14.5rem] origin-top', !still && 'animate-swing')}
        style={
          {
            '--swing-rest': `${rest}deg`,
            transform: still ? `rotate(${rest}deg)` : undefined,
            animationDelay: `${-position * 1.3}s`,
          } as CSSProperties
        }
      >
        <span
          aria-hidden="true"
          className="mx-auto block w-px bg-muted/70"
          style={{ height: drop }}
        />
        <Clip />
        <LaunchCard item={item} position={position} still={still} />
      </div>
    </li>
  );
}

/** The little clip that holds a card to its thread. */
function Clip() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 16"
      className="relative z-10 mx-auto -mb-[7px] block h-4 w-5 text-muted"
    >
      <circle cx="10" cy="4.5" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="7.5" width="14" height="8" rx="2.5" fill="currentColor" />
      <rect x="6" y="10.5" width="8" height="2" rx="1" className="fill-canvas" />
    </svg>
  );
}

function LaunchCard({ item, position, still }: { item: Item; position: number; still: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const [lean, setLean] = useState({ x: 0, y: 0, mx: 50, my: 50, lit: false });
  const ref = useRef<HTMLDivElement>(null);
  const frontButton = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);

  const number = pad(position + 1);
  const href = `/item/${item.slug}`;

  const onMove = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setLean({
      x: still ? 0 : (py - 0.5) * -10,
      y: still ? 0 : (px - 0.5) * 12,
      mx: px * 100,
      my: py * 100,
      lit: true,
    });
  };

  /* Focus follows the card over, so a keyboard user is never left on a face
     that has turned away. */
  const turn = (to: boolean) => {
    setFlipped(to);
    requestAnimationFrame(() => (to ? backButton : frontButton).current?.focus());
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => setLean({ x: 0, y: 0, mx: 50, my: 50, lit: false })}
      className="@container [perspective:900px]"
    >
      <div
        className={cn(
          'relative [transform-style:preserve-3d]',
          !still && 'transition-transform duration-[600ms] ease-glide',
        )}
        style={{ transform: `rotateX(${lean.x}deg) rotateY(${lean.y + (flipped ? 180 : 0)}deg)` }}
      >
        {/* ------------------------------------------------------ front --- */}
        <div
          inert={flipped}
          className="relative flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface p-2.5 shadow-[0_22px_40px_-24px_rgb(0_0_0/0.45)] [backface-visibility:hidden] sm:p-3"
        >
          <div className="flex items-center justify-between gap-2 px-1 pb-2 font-mono text-[8px] font-medium uppercase tracking-[0.14em] text-muted sm:text-[9px]">
            <span className="truncate">Launch · {CATEGORY_LABELS[item.category]}</span>
            <span>#{number}</span>
          </div>

          <Cover item={item} position={position} />

          <div className="px-1 pt-3">
            <p className="truncate text-[15px] font-medium tracking-[-0.02em] text-body @[12rem]:text-lg">
              {item.name}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted @[12rem]:text-xs">
              {item.tagline}
            </p>
          </div>

          <div className="mx-1 mt-3 flex items-center justify-between border-t border-line pt-2.5">
            <span className="font-mono text-[8px] font-medium uppercase tracking-[0.14em] text-muted sm:text-[9px]">
              View launch
            </span>
            <Link
              to={href}
              aria-label={`Open ${item.name}`}
              className="glass-ink relative z-20 grid size-6 place-items-center rounded-full"
            >
              <ArrowUpRightIcon className="size-3" />
            </Link>
          </div>

          {/* The sheen: a band of foil that follows the pointer across. */}
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-500',
              lean.lit ? 'opacity-45 dark:opacity-25' : 'opacity-0',
            )}
            style={{
              backgroundImage: SHEEN,
              backgroundSize: '250% 250%',
              backgroundPosition: `${lean.mx}% ${lean.my}%`,
            }}
          />

          {/* The whole card turns over; the arrow above it still opens the launch. */}
          <button
            ref={frontButton}
            type="button"
            onClick={() => turn(true)}
            aria-label={`Turn ${item.name} over`}
            className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          />
        </div>

        {/* ------------------------------------------------------- back --- */}
        <div
          inert={!flipped}
          className="absolute inset-0 flex flex-col overflow-hidden rounded-[18px] border border-white/70 p-3 text-ink shadow-[0_22px_40px_-24px_rgb(0_0_0/0.45)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ backgroundImage: FOIL }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-[background-position] duration-500"
            style={{
              backgroundImage: SHEEN,
              backgroundSize: '250% 250%',
              backgroundPosition: `${lean.mx}% ${lean.my}%`,
              opacity: 0.6,
            }}
          />

          <div className="relative flex items-center justify-between font-mono text-[8px] font-medium uppercase tracking-[0.14em] text-ink/60 sm:text-[9px]">
            <span>Launch / {number}</span>
            <button
              ref={backButton}
              type="button"
              onClick={() => turn(false)}
              aria-label={`Turn ${item.name} back`}
              className="grid size-6 place-items-center rounded-full border border-white/80 bg-white/55 text-ink transition-colors hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-ink"
            >
              <ArrowUturnLeftIcon className="size-3" />
            </button>
          </div>

          <div className="relative mt-2.5 flex items-center gap-2">
            <ItemLogo item={item} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium tracking-[-0.01em]">{item.name}</p>
              <p className="truncate text-[10px] text-ink/60">by @{item.submittedBy.username}</p>
            </div>
          </div>

          <p className="relative mt-2 flex items-center gap-1.5 truncate text-[10px] text-ink/60">
            <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-ink/40" />
            {CATEGORY_LABELS[item.category]} · {formatDay(item.launchDateKey)}
          </p>

          <p className="relative mt-2 line-clamp-2 text-[11px] leading-snug text-ink/80 @max-[11rem]:hidden">
            {item.tagline}
          </p>

          <p className="relative mt-2.5 font-mono text-[8px] font-medium uppercase tracking-[0.14em] text-ink/50">
            On the board
          </p>
          <dl className="relative text-[11px]">
            <div className="flex justify-between border-b border-ink/10 py-1">
              <dt>Votes</dt>
              <dd className="tabular-nums">{formatNumber(item.voteCount)}</dd>
            </div>
            <div className="flex justify-between border-b border-ink/10 py-1 @max-[11rem]:hidden">
              <dt>Comments</dt>
              <dd className="tabular-nums">{formatNumber(item.commentCount)}</dd>
            </div>
          </dl>

          <div className="relative mt-auto flex items-end justify-between gap-2 pt-2">
            <div className="min-w-0">
              <p className="font-mono text-[8px] font-medium uppercase tracking-[0.14em] text-ink/50">
                See it live
              </p>
              <a
                href={item.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-[10px] font-medium underline-offset-2 hover:underline"
              >
                {prettyUrl(item.websiteUrl)}
              </a>
            </div>
            <figure className="shrink-0 text-center">
              <QrCode
                value={`${window.location.origin}${href}`}
                label={`QR code that opens ${item.name} on Deck`}
                className="size-12 rounded-md bg-white text-ink @[12rem]:size-14"
              />
              <figcaption className="mt-0.5 font-mono text-[7px] font-medium uppercase tracking-[0.16em] text-ink/50">
                Scan me
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The picture on the front: the launch's cover if it has one, otherwise its
 * logo on the maker's wall colour — or on a pastel when they never chose one.
 */
function Cover({ item, position }: { item: Item; position: number }) {
  if (item.coverUrl) {
    return (
      <img
        src={item.coverUrl}
        alt=""
        loading="lazy"
        className="aspect-[8/7] w-full rounded-[12px] object-cover"
      />
    );
  }

  return (
    <div
      className={cn(
        'grid aspect-[8/7] w-full place-items-center rounded-[12px]',
        !item.wallColour && GROUNDS[position % GROUNDS.length],
      )}
      style={item.wallColour ? { backgroundColor: item.wallColour } : undefined}
    >
      <ItemLogo item={item} size="xl" className="shadow-[0_14px_28px_-14px_rgb(0_0_0/0.5)]" />
    </div>
  );
}
