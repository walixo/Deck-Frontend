import {
  ChevronDoubleUpIcon,
  LockClosedIcon,
  RocketLaunchIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { cn, MEDAL_STYLES } from '@/lib/utils';
import { Mono, Rise, Stop } from '../primitives';
import { kickIn, lerp, snapIn, span } from '../timing';

/*
 * The day, as a route: the same four beats as `HowItWorks`, in the same words
 * (that section is parked on the landing page now; this is where the day gets
 * told). Every one is a real mechanic — the board is keyed
 * to the UTC day, votes are the only ranking, the order locks at 23:59 and a
 * launch leaves with its share kit.
 */
const STOPS = [
  { x: 330, at: 12.3, when: '00:00', what: 'Board opens', Icon: RocketLaunchIcon },
  { x: 770, at: 12.8, when: 'All day', what: 'Votes', Icon: ChevronDoubleUpIcon },
  { x: 1150, at: 13.35, when: '23:59', what: 'Ranks lock', Icon: LockClosedIcon },
  { x: 1590, at: 13.9, when: 'Tomorrow', what: 'Share kit', Icon: ShareIcon },
];

const LINE_Y = 540;

/* A wandering line through the stops — a route, not a ruler. Each leg bows
   the opposite way to the last. */
const PATH = STOPS.slice(1).reduce((d, stop, index) => {
  const from = STOPS[index];
  const bow = index % 2 === 0 ? 70 : -70;
  const third = (stop.x - from.x) / 3;
  return `${d} C ${from.x + third} ${LINE_Y + bow}, ${stop.x - third} ${LINE_Y + bow}, ${stop.x} ${LINE_Y}`;
}, `M ${STOPS[0].x} ${LINE_Y}`);

/* How far along the path each stop sits, by horizontal distance — close
   enough to arc length for legs this similar, and exact at the ends. */
const TOTAL = STOPS[STOPS.length - 1].x - STOPS[0].x;
const AT = STOPS.map((stop) => (stop.x - STOPS[0].x) / TOTAL);

/** How much of the route has been travelled at `t`, 0–1. */
function travelled(t: number): number {
  for (let index = STOPS.length - 1; index > 0; index -= 1) {
    const previous = STOPS[index - 1];
    if (t >= previous.at) {
      return lerp(AT[index - 1], AT[index], span(t, previous.at, STOPS[index].at));
    }
  }
  return 0;
}

/**
 * 12.0–15.0s. The day from open to share kit, lighting one stop at a time.
 *
 * The reference's review pipeline, redrawn as the thing Deck's day actually
 * is. The line is drawn first, then travelled in the accent; each stop fills
 * with the pop block as the travel reaches it, and the card above it changes
 * state — which is what makes it a process rather than a diagram.
 */
export function Route({ t }: { t: number }) {
  const draw = snapIn(t, 12.0, 0.6);
  const reached = (index: number) => t >= STOPS[index].at;

  return (
    <div className="absolute inset-0">
      <svg
        aria-hidden="true"
        className="absolute inset-0 overflow-visible"
        width={1920}
        height={1080}
      >
        <path
          d={PATH}
          pathLength={1}
          fill="none"
          className="stroke-edge/35"
          strokeWidth={3}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
        <path
          d={PATH}
          pathLength={1}
          fill="none"
          className="stroke-accent"
          strokeWidth={5}
          strokeDasharray={1}
          strokeDashoffset={1 - travelled(t)}
        />
      </svg>

      {STOPS.map((stop, index) => {
        const lit = reached(index);
        const pop = kickIn(t, stop.at, 0.3);
        return (
          <div key={stop.what} className="absolute" style={{ left: stop.x - 46, top: LINE_Y - 46 }}>
            <span
              className={cn(
                'flex size-[92px] items-center justify-center rounded-full border-[3px] border-edge',
                lit ? 'bg-pop text-on-pop shadow-hard' : 'bg-canvas text-muted',
              )}
              style={{
                transform: `scale(${lit ? lerp(0.8, 1, pop) : snapIn(t, 12.1 + index * 0.08, 0.3)})`,
              }}
            >
              <stop.Icon className="size-10" />
            </span>
            <div className="absolute left-1/2 top-[112px] flex -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap">
              <Mono className={cn('text-[15px]', lit && 'text-body')}>{stop.when}</Mono>
              <Mono className="text-[13px]">{stop.what}</Mono>
            </div>
          </div>
        );
      })}

      <OpenCard t={t} />
      <RankCard t={t} />
      <KitCard t={t} />

      <div className="absolute left-[150px] top-[776px] font-display text-[130px] uppercase leading-none text-body display-tight">
        <Rise progress={snapIn(t, 13.0, 0.26)}>
          Ranked
          <Stop />
        </Rise>
      </div>

      <div className="absolute right-[150px] top-[846px] flex gap-6">
        <Legend className="bg-canvas">Open</Legend>
        <Legend className="bg-pop">Voting</Legend>
        <Legend className="bg-edge">Locked</Legend>
      </div>
    </div>
  );
}

function Card({
  t,
  at,
  left,
  width,
  children,
}: {
  t: number;
  at: number;
  left: number;
  width: number;
  children: React.ReactNode;
}) {
  const shown = snapIn(t, at, 0.35);
  if (shown === 0) return null;

  return (
    <div
      className="absolute top-[172px] h-[236px] rounded-slab border-[3px] border-edge bg-surface p-6 shadow-hard-lg"
      style={{ left, width, transform: `translateY(${lerp(28, 0, shown)}px)` }}
    >
      {children}
    </div>
  );
}

function OpenCard({ t }: { t: number }) {
  return (
    <Card t={t} at={12.15} left={150} width={360}>
      <Mono className="text-[14px]">Today’s board</Mono>
      <div className="mt-4 font-display text-[64px] leading-none text-body">0</div>
      <div className="mt-1 font-sans text-[22px] text-muted">votes each, at midnight</div>
      <Chip className="mt-4 bg-canvas text-body">Everyone starts at zero</Chip>
    </Card>
  );
}

function RankCard({ t }: { t: number }) {
  const locked = t >= STOPS[2].at;
  return (
    <Card t={t} at={12.6} left={620} width={680}>
      <div className="flex items-center justify-between">
        <Mono className="text-[14px]">The order</Mono>
        {locked && (
          /* No status colour for "locked": inversion, the system's fallback
             for a state without one (CONTRACT rule 6). */
          <Chip
            className="bg-edge text-canvas"
            style={{ transform: `scale(${lerp(0.6, 1, kickIn(t, STOPS[2].at, 0.3))})` }}
          >
            Locked
          </Chip>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {[1, 2, 3].map((rank) => (
          <div key={rank} className="flex items-center gap-4">
            <span
              className={cn(
                'flex size-9 items-center justify-center border-2 border-edge font-display text-[17px]',
                MEDAL_STYLES[rank],
              )}
            >
              {rank}
            </span>
            <span className="h-4 bg-edge/15" style={{ width: 360 - rank * 50 }} />
            <span className="ml-auto font-mono text-[18px] font-bold tabular-nums text-muted">
              ▲ {[48, 31, 22][rank - 1]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function KitCard({ t }: { t: number }) {
  const ready = t >= STOPS[3].at;
  return (
    <Card t={t} at={13.5} left={1440} width={300}>
      <div className="flex items-center justify-between">
        <Mono className="text-[14px]">Share kit</Mono>
        {ready && (
          <Chip
            className="bg-success text-ink"
            style={{ transform: `scale(${lerp(0.6, 1, kickIn(t, STOPS[3].at, 0.3))})` }}
          >
            Ready
          </Chip>
        )}
      </div>
      <div className="mt-5 space-y-2 font-sans text-[24px] text-body">
        <div>Share cards</div>
        <div>Embeddable badge</div>
        <div>Text to paste</div>
      </div>
    </Card>
  );
}

function Chip({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap border-2 border-edge px-3 py-1 font-mono text-[14px] font-bold uppercase tracking-[0.1em]',
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}

function Legend({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Mono className="flex items-center gap-2 text-[14px]">
      <span className={cn('size-3 border-2 border-edge', className)} />
      {children}
    </Mono>
  );
}
