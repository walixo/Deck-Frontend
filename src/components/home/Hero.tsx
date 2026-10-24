import { Link } from 'react-router-dom';
import { PixelSky } from '@/components/home/PixelSky';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { FrontHero } from '@/components/ui/FrontHero';
import { BrickStack } from '@/components/ui/Bricks';
import { STATS_SHOWN_FROM } from '@/lib/thresholds';
import { formatNumber } from '@/lib/utils';
import type { Item, PlatformStats } from '@/types';

interface HeroProps {
  stats?: PlatformStats;
  /** The newest launches; the three with the most votes are dealt on the right. */
  launches?: Item[];
}

/*
 * The stat tiles still switch themselves on by threshold rather than by a
 * flag: a hero announcing "0 launches, 0 makers" to the first people through
 * the door argues against itself. See `lib/thresholds`.
 */

/* The founding-board card ("Still being built"), parked. Below the stats
   threshold the slot is simply empty; the stat tiles take it over on the day
   the board clears `STATS_SHOWN_FROM`. */
const SHOW_FOUNDING_BOARD: boolean = false;

/**
 * The landing page's hero, on the front-door standard every Deck hero shares.
 *
 * The starfield stays — it is the launch board's sky — and the headline stands
 * still on top of it. On the right, a deck of today's busiest launches, fanned
 * like cards in a hand: the product named after the thing it shows.
 */
export function Hero({ stats, launches = [] }: HeroProps) {
  const today = stats?.todayLaunches;
  return (
    <FrontHero
      pill={{
        label: today
          ? `${today} ${today === 1 ? 'launch' : 'launches'} today`
          : 'New launches every day',
        to: '/discover',
      }}
      title="Where new tech"
      fade="finds its fans."
      body="Launch and discover AI models, tools, Claude skills, mobile apps and websites. Vote on what ships today, and see who tops the daily board."
      primary={{ label: 'Launch your product', to: '/submit' }}
      secondary={{ label: 'Explore launches →', to: '/discover' }}
      backdrop={<PixelSky className="absolute inset-0 h-full w-full" />}
      visual={<LaunchDeck launches={launches} />}
    >
      {stats &&
        (stats.launches >= STATS_SHOWN_FROM.launches && stats.makers >= STATS_SHOWN_FROM.makers ? (
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-3">
            <Stat label="Launches" value={formatNumber(stats.launches)} />
            <Stat label="Makers" value={formatNumber(stats.makers)} />
            <Stat label="Votes cast" value={formatNumber(stats.votes)} />
          </dl>
        ) : (
          SHOW_FOUNDING_BOARD && <FoundingBoard launches={stats.launches} />
        ))}
    </FrontHero>
  );
}

/* Where each card in the hand sits: fanned left to right, the middle one on top. */
const FAN = [
  { tilt: '-9deg', x: '-34%', y: '6%', z: 1, delay: '-2s' },
  { tilt: '0deg', x: '0%', y: '-4%', z: 3, delay: '0s' },
  { tilt: '9deg', x: '34%', y: '6%', z: 2, delay: '-4s' },
];

/** Three launches, fanned. Placeholders stand in until there are three to show. */
function LaunchDeck({ launches }: { launches: Item[] }) {
  const top = [...launches].sort((a, b) => b.voteCount - a.voteCount).slice(0, 3);
  /* The busiest card goes in the middle, on top. */
  const hand = top.length === 3 ? [top[1], top[0], top[2]] : top;
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[36rem]">
      {FAN.map((place, index) => {
        const item = hand[index];
        return (
          /* Placed by the outer box, floated by the inner one: the drift
             animates `translate`, which would undo the placement. */
          <div
            key={index}
            className="absolute left-1/2 top-1/2 w-[46%]"
            style={{
              zIndex: place.z,
              transform: `translate(calc(-50% + ${place.x}), calc(-50% + ${place.y}))`,
            }}
          >
            <div
              className="animate-g-drift"
              style={{ '--g-tilt': place.tilt, animationDelay: place.delay } as React.CSSProperties}
            >
              {item ? <LaunchCard item={item} /> : <BlankCard />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LaunchCard({ item }: { item: Item }) {
  return (
    <Link
      to={`/item/${item.slug}`}
      className="block overflow-hidden rounded-[22px] border border-white/15 bg-[#151515] text-[#f4f2ee] shadow-[0_30px_70px_-25px_rgb(0_0_0/0.8)] transition-transform duration-500 ease-glide hover:-translate-y-2"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ background: item.wallColour ?? '#232323' }}
      >
        {item.coverUrl ? (
          <img src={item.coverUrl} alt="" className="size-full object-cover" loading="lazy" />
        ) : item.logoUrl ? (
          <img
            src={item.logoUrl}
            alt=""
            className="absolute left-1/2 top-1/2 size-1/3 -translate-x-1/2 -translate-y-1/2 rounded-2xl object-cover"
            loading="lazy"
          />
        ) : (
          <CategoryIcon
            category={item.category}
            className="absolute left-1/2 top-1/2 size-1/4 -translate-x-1/2 -translate-y-1/2 text-white/80"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="p-4">
        <p className="truncate text-[15px] font-semibold tracking-[-0.02em]">{item.name}</p>
        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-white/55">{item.tagline}</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
          ▲ {formatNumber(item.voteCount)} votes
        </p>
      </div>
    </Link>
  );
}

/** An empty place in the hand, waiting for a launch. */
function BlankCard() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#121212] shadow-[0_30px_70px_-25px_rgb(0_0_0/0.8)]">
      <div className="aspect-[4/3] bg-[linear-gradient(135deg,#1d1d1d,#151515)]" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-2/3 rounded-full bg-white/10" />
        <div className="h-2.5 w-full rounded-full bg-white/[0.06]" />
        <div className="h-2.5 w-1/2 rounded-full bg-white/[0.06]" />
      </div>
    </div>
  );
}

/**
 * What the stat band says before there is anything to count: an invitation
 * instead of a scoreboard. A short stack of bricks with room on top reads as
 * "you would be early" — true, and the only thing worth saying this early.
 */
function FoundingBoard({ launches }: { launches: number }) {
  return (
    <div className="mt-12 flex max-w-md items-center gap-5 rounded-2xl border border-line bg-surface p-4 text-left sm:p-5">
      <BrickStack
        count={launches}
        className="h-20 w-14 shrink-0 text-accent"
        label={
          launches === 0
            ? 'An empty board, waiting for its first launch'
            : 'A short stack of launches, with room for more'
        }
      />
      <div className="min-w-0">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
          The first board
        </p>
        <p className="mt-1 font-display text-lg leading-tight text-balance">
          {launches === 0 ? 'Nobody has launched yet' : 'Still being built'}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4">
      <dd className="text-2xl font-semibold tracking-[-0.04em] tabular-nums sm:text-3xl">
        {value}
      </dd>
      <dt className="mt-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-white/55">
        {label}
      </dt>
    </div>
  );
}
