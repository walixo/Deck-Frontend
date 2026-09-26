import { cn } from '@/lib/utils';
import { Mono, Rise, Stop } from '../primitives';
import { kickIn, lerp, snapIn, span } from '../timing';

/*
 * Africa, as a polygon of [latitude, longitude] points.
 *
 * Hand-traced and coarse on purpose — about forty vertices, clockwise from
 * Tunisia. At the size this is drawn, and rendered as a field of dots, a
 * detailed coastline would be invisible; what matters is that the silhouette
 * is unmistakable. Shipping a map dataset to draw one continent as dots would
 * be a dependency for a picture.
 */
const AFRICA: [number, number][] = [
  [37.2, 10.1],
  [33.2, 11.4],
  [32.9, 13.2],
  [30.3, 19.5],
  [32.8, 21.8],
  [31.3, 25.2],
  [31.3, 32.3],
  [29.9, 32.6],
  [22, 36.9],
  [18, 38.5],
  [15.6, 39.5],
  [12.6, 43.3],
  [11.6, 43.2],
  [11.3, 44.6],
  [11.9, 51.2],
  [10.4, 51.1],
  [4.5, 48],
  [-1.7, 41.6],
  [-4.7, 39.2],
  [-10.5, 40.4],
  [-15.1, 40.6],
  [-19.8, 34.9],
  [-25.9, 32.9],
  [-29.8, 31.1],
  [-33.8, 25.7],
  [-34.8, 20],
  [-34.1, 18.4],
  [-31.5, 18.1],
  [-28.6, 16.5],
  [-22.9, 14.5],
  [-17.3, 11.8],
  [-12.2, 13.7],
  [-8.8, 13.3],
  [-6, 12.2],
  [-1.2, 9],
  [3.9, 9.6],
  [4.4, 7],
  [6.4, 3.4],
  [5.6, -0.2],
  [4.8, -2],
  [5.2, -4.1],
  [4.4, -7.5],
  [6.9, -11.4],
  [9.5, -13.7],
  [12.4, -16.8],
  [14.7, -17.5],
  [20.8, -17.1],
  [24.5, -15.2],
  [27.7, -13.1],
  [31.5, -9.8],
  [33.6, -7.6],
  [35.8, -5.9],
  [35.2, -2.2],
  [36.8, 3],
  [37.1, 7.8],
];

const MADAGASCAR: [number, number][] = [
  [-12, 49.3],
  [-15.8, 50.3],
  [-20.5, 48.5],
  [-25.2, 47.1],
  [-25, 44],
  [-21.5, 43.3],
  [-16.3, 44.4],
  [-13.6, 48],
];

function inside(lat: number, lon: number, polygon: [number, number][]): boolean {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [latI, lonI] = polygon[i];
    const [latJ, lonJ] = polygon[j];
    if (latI > lat !== latJ > lat && lon < ((lonJ - lonI) * (lat - latI)) / (latJ - latI) + lonI) {
      hit = !hit;
    }
  }
  return hit;
}

/* The dot field, sampled once. A 2.4° grid reads as a dotted land mass at this
   radius without turning into a solid fill. */
const STEP = 2.4;
const DOTS: [number, number][] = [];
for (let lat = -36; lat <= 38; lat += STEP) {
  for (let lon = -19; lon <= 52; lon += STEP) {
    if (inside(lat, lon, AFRICA) || inside(lat, lon, MADAGASCAR)) DOTS.push([lat, lon]);
  }
}

const CX = 1370;
const CY = 560;
const R = 340;
const RAD = Math.PI / 180;

/** Orthographic projection about (lat0, lon0). `null` when on the far side. */
function project(lat: number, lon: number, lat0: number, lon0: number) {
  const phi = lat * RAD;
  const lambda = (lon - lon0) * RAD;
  const phi0 = lat0 * RAD;
  const facing = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda);
  if (facing < 0) return null;
  return {
    x: CX + R * Math.cos(phi) * Math.sin(lambda),
    y:
      CY - R * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda)),
  };
}

/*
 * Where the demo launch goes. The labels are what a launch collects, not
 * claims about who uses Deck where — the cities are there to make the arcs
 * cross the continent, and none of them is named on screen.
 */
const ORIGIN = { lat: 6.5, lon: 3.4 };
const ARRIVALS = [
  { lat: 30.0, lon: 31.2, at: 20.2, label: '▲ Vote' },
  { lat: -1.3, lon: 36.8, at: 20.55, label: 'Shared ↗' },
  { lat: -33.9, lon: 18.4, at: 20.9, label: 'Badge' },
  { lat: 14.7, lon: -17.4, at: 21.25, label: 'First fan' },
];
const FLIGHT = 0.45;

/**
 * 19.0–23.0s. "Launch here. Get seen." — the demo launch arcs out across a
 * dotted globe turned to Africa.
 *
 * The reference sends a release to cities around the world. Deck lives at
 * `.africa`, so the globe is turned to face it, and what flies out is what a
 * launch leaves with: votes, shares, the badge, its first fans.
 */
export function Globe({ t }: { t: number }) {
  const grow = snapIn(t, 19.0, 0.55);
  const lon0 = lerp(2, 26, span(t, 19.0, 23.0));
  const lat0 = 4;
  const origin = project(ORIGIN.lat, ORIGIN.lon, lat0, lon0);

  return (
    <div className="absolute inset-0">
      <svg
        aria-hidden="true"
        className="absolute inset-0"
        width={1920}
        height={1080}
        style={{ transform: `scale(${lerp(0.7, 1, grow)})`, transformOrigin: `${CX}px ${CY}px` }}
      >
        <circle cx={CX} cy={CY} r={R} className="fill-surface stroke-edge" strokeWidth={3} />
        <Graticule lat0={lat0} lon0={lon0} />

        {DOTS.map(([lat, lon], index) => {
          const point = project(lat, lon, lat0, lon0);
          return point ? (
            <circle key={index} cx={point.x} cy={point.y} r={3.6} className="fill-body" />
          ) : null;
        })}

        {origin &&
          ARRIVALS.map((arrival) => {
            const end = project(arrival.lat, arrival.lon, lat0, lon0);
            if (!end || t < arrival.at) return null;
            const flown = snapIn(t, arrival.at, FLIGHT);
            return (
              <path
                key={arrival.label}
                d={arc(origin, end)}
                pathLength={1}
                fill="none"
                className="stroke-accent"
                strokeWidth={4}
                strokeDasharray={1}
                strokeDashoffset={1 - flown}
              />
            );
          })}
      </svg>

      {/* Pins and their chips sit in HTML over the SVG so the type is set by the
          same classes as everywhere else. */}
      {origin && t >= 19.7 && (
        <Pin x={origin.x} y={origin.y} t={t} at={19.7} grow={grow} origin>
          Your launch
        </Pin>
      )}
      {ARRIVALS.map((arrival) => {
        const end = project(arrival.lat, arrival.lon, lat0, lon0);
        const landed = arrival.at + FLIGHT;
        if (!end || t < landed) return null;
        return (
          <Pin key={arrival.label} x={end.x} y={end.y} t={t} at={landed} grow={grow}>
            {arrival.label}
          </Pin>
        );
      })}

      <div className="absolute left-[150px] top-[330px] w-[760px]">
        <Mono className="flex items-center gap-2 text-[16px] text-accent">
          <span className="size-3 bg-accent" />
          onedeck.africa
        </Mono>
        <div className="mt-5 font-display text-[124px] uppercase leading-none text-body display-tight">
          <Rise progress={snapIn(t, 19.4, 0.26)}>
            Launch here
            <Stop />
          </Rise>
          <Rise progress={snapIn(t, 19.62, 0.26)}>
            Get seen
            <Stop />
          </Rise>
        </div>
        <div className="mt-6 font-sans text-[32px] leading-snug text-muted">
          <Rise progress={snapIn(t, 20.3, 0.3)}>Leave with share cards, a badge</Rise>
          <Rise progress={snapIn(t, 20.4, 0.3)}>for your site and the text to paste.</Rise>
        </div>
      </div>
    </div>
  );
}

/** A flight path: the chord bowed away from the globe's centre. */
function arc(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = mx - CX;
  const dy = my - CY;
  const length = Math.hypot(dx, dy) || 1;
  const lift = Math.hypot(to.x - from.x, to.y - from.y) * 0.35 + 30;
  return `M ${from.x} ${from.y} Q ${mx + (dx / length) * lift} ${my + (dy / length) * lift} ${to.x} ${to.y}`;
}

function Graticule({ lat0, lon0 }: { lat0: number; lon0: number }) {
  const lines: string[] = [];

  for (let lon = -180; lon < 180; lon += 20) {
    lines.push(
      polyline(
        Array.from({ length: 37 }, (_, i) => [-90 + i * 5, lon] as [number, number]),
        lat0,
        lon0,
      ),
    );
  }
  for (let lat = -60; lat <= 60; lat += 20) {
    lines.push(
      polyline(
        Array.from({ length: 73 }, (_, i) => [lat, -180 + i * 5] as [number, number]),
        lat0,
        lon0,
      ),
    );
  }

  return (
    <g className="stroke-edge/15" fill="none" strokeWidth={1.5}>
      {lines.map((d, index) => (d ? <path key={index} d={d} /> : null))}
    </g>
  );
}

/** A projected line, broken wherever it passes round the back. */
function polyline(points: [number, number][], lat0: number, lon0: number): string {
  let d = '';
  let drawing = false;
  for (const [lat, lon] of points) {
    const point = project(lat, lon, lat0, lon0);
    if (!point) {
      drawing = false;
      continue;
    }
    d += `${drawing ? 'L' : 'M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)} `;
    drawing = true;
  }
  return d;
}

function Pin({
  x,
  y,
  t,
  at,
  grow,
  origin,
  children,
}: {
  x: number;
  y: number;
  t: number;
  at: number;
  grow: number;
  origin?: boolean;
  children: React.ReactNode;
}) {
  /* Pins are positioned in the SVG's unscaled space, so they follow the same
     grow-in scale about the globe's centre. */
  const scale = lerp(0.7, 1, grow);
  const px = CX + (x - CX) * scale;
  const py = CY + (y - CY) * scale;
  const pop = kickIn(t, at, 0.3);

  return (
    <div className="absolute" style={{ left: px, top: py }}>
      <span
        className="absolute size-4 border-[3px] border-on-pop bg-pop"
        style={{ transform: `translate(-50%, -50%) scale(${lerp(0.3, 1, pop)})` }}
      />
      <span
        className={cn(
          'absolute left-4 top-[-46px] whitespace-nowrap border-2 border-edge px-3 py-1 font-mono text-[16px] font-bold uppercase tracking-[0.1em] shadow-hard-sm',
          origin ? 'bg-pop text-on-pop' : 'bg-canvas text-body',
        )}
        style={{ transform: `scale(${lerp(0.5, 1, pop)})`, transformOrigin: '0 100%' }}
      >
        {children}
      </span>
    </div>
  );
}
