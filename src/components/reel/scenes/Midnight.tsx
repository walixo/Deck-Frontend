import { ICON_SET } from '@/components/illustrations/CategoryIcon';
import { cn } from '@/lib/utils';
import { Mono, Rise, Stop } from '../primitives';
import { kickIn, lerp, snapIn } from '../timing';

/* The clock's last seconds before the board turns over, and when each shows. */
const TICKS = [
  { at: 15.5, time: '23:59:56' },
  { at: 15.82, time: '23:59:57' },
  { at: 16.14, time: '23:59:58' },
  { at: 16.46, time: '23:59:59' },
  { at: 16.8, time: '00:00:00' },
];
const MIDNIGHT = TICKS[TICKS.length - 1].at;

/*
 * The orbiting icons: the category icon set itself, every icon a category on
 * the board can wear. The reference spins a ball of glyphs from every script;
 * this is the same object made of the things people launch.
 *
 * Points on a Fibonacci sphere, so they are spread evenly with no poles
 * bunching up. Computed once at import.
 */
const ICONS = Object.values(ICON_SET).slice(0, 22);
const POINTS = ICONS.map((_, index) => {
  const y = 1 - (2 * (index + 0.5)) / ICONS.length;
  const radius = Math.sqrt(1 - y * y);
  const theta = index * Math.PI * (3 - Math.sqrt(5));
  return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius };
});

const CX = 1400;
const CY = 540;
const R = 250;
const TILT = 0.38;

/**
 * 15.0–19.0s. The clock runs out and a new board begins.
 *
 * The reference counts up to its headline number. Deck's number is a time —
 * midnight UTC, when every launch starts again on zero — so the count is a
 * countdown, and the payoff is the turnover rather than a total. No figure on
 * screen is a statistic that could go stale.
 */
export function Midnight({ t }: { t: number }) {
  const orbit = snapIn(t, 15.0, 0.7);
  const ball = snapIn(t, 15.35, 0.5);
  const tick = [...TICKS].reverse().find((entry) => t >= entry.at);
  const turned = t >= MIDNIGHT;

  const rx = lerp(900, 390, orbit);
  const ry = lerp(40, 92, orbit);
  const ocx = lerp(960, CX, orbit);
  const angle = (t - 15) * 2.4;

  return (
    <div className="absolute inset-0">
      <svg aria-hidden="true" className="absolute inset-0" width={1920} height={1080}>
        <g transform={`rotate(-12 ${ocx} ${CY})`}>
          <ellipse
            cx={ocx}
            cy={CY}
            rx={rx}
            ry={ry}
            fill="none"
            className="stroke-edge/25"
            strokeWidth={2}
          />
          <rect
            x={ocx + rx * Math.cos(angle) - 9}
            y={CY + ry * Math.sin(angle) - 9}
            width={18}
            height={18}
            className="fill-pop stroke-on-pop"
            strokeWidth={3}
          />
        </g>
      </svg>

      {ball > 0 && <IconBall t={t} scale={ball} />}

      <div className="absolute left-[150px] top-[300px]">
        <Mono className="flex items-center gap-2 text-[16px] text-accent">
          <span className="size-3 bg-accent" />
          The daily board
        </Mono>

        {tick && (
          <div
            className={cn(
              'mt-4 origin-left font-display text-[176px] leading-none',
              turned ? 'text-accent' : 'text-body',
            )}
            style={{ transform: `scale(${turned ? lerp(1.12, 1, kickIn(t, MIDNIGHT, 0.3)) : 1})` }}
          >
            {/* One fixed-width box per character. Archivo Black has no tabular
                figures, so without this the line would twitch sideways every
                time a digit changed width. */}
            {tick.time.split('').map((character, index) => (
              <span
                key={index}
                className={cn(
                  'inline-block text-center',
                  character === ':' ? 'w-[0.34em]' : 'w-[0.66em]',
                )}
              >
                {character}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 font-display text-[72px] uppercase leading-none text-body display-tight">
          <Rise progress={snapIn(t, 17.0, 0.26)}>
            A new board
            <Stop />
          </Rise>
        </div>
        <div className="mt-3 font-sans text-[34px] text-muted">
          <Rise progress={snapIn(t, 17.25, 0.3)}>Every midnight UTC. Everyone starts on zero.</Rise>
        </div>

        <div className="mt-8 h-[2px] bg-edge/40" style={{ width: snapIn(t, 17.5, 0.4) * 620 }} />
        <Mono className={cn('mt-4 block text-[14px]', t < 17.6 && 'invisible')}>
          One vote per launch · ranks lock at 23:59
        </Mono>
      </div>
    </div>
  );
}

function IconBall({ t, scale }: { t: number; scale: number }) {
  const spin = (t - 15) * 0.85;
  const cos = Math.cos(spin);
  const sin = Math.sin(spin);
  const tiltCos = Math.cos(TILT);
  const tiltSin = Math.sin(TILT);

  const placed = POINTS.map((point, index) => {
    /* Spin about the vertical axis, then tip the whole ball towards the
       viewer so the top is visible. */
    const x = point.x * cos - point.z * sin;
    const z1 = point.x * sin + point.z * cos;
    const y = point.y * tiltCos - z1 * tiltSin;
    const z = point.y * tiltSin + z1 * tiltCos;
    return { index, x, y, z };
  }).sort((a, b) => a.z - b.z);

  return (
    <div aria-hidden="true" className="absolute inset-0">
      {placed.map(({ index, x, y, z }) => {
        const Icon = ICONS[index];
        const depth = (z + 1) / 2;
        const size = lerp(34, 76, depth) * scale;
        return (
          <Icon
            key={index}
            className={cn('absolute', z > 0 ? 'text-body' : 'text-muted')}
            style={{
              width: size,
              height: size,
              left: CX + x * R * scale - size / 2,
              top: CY + y * R * scale - size / 2,
              strokeWidth: z > 0 ? 1.8 : 1.2,
            }}
          />
        );
      })}
    </div>
  );
}
