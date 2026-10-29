import { useEffect, useRef, type RefObject } from 'react';

/**
 * The two voices in a call, as one turning orb of light: blue below for you,
 * amber above for them, with a bright ribbon where they meet.
 *
 * Whoever is speaking lights their half and swells it, pushing the ribbon
 * towards the other side, and the ribbon ripples with their voice. In silence
 * it just turns slowly.
 *
 * Drawn on a canvas each frame, outside React. The lobes are stacks of the
 * ribbon itself at other heights, drawn faint and wide with additive light,
 * which is what gives the long-exposure look of the reference film.
 */

type Levels = { mine: number; theirs: number };

const BLUE = [122, 152, 255] as const;
const AMBER = [255, 156, 64] as const;
const SEGMENTS = 72;
const COPIES = 16;
const TILT = 0.38;

const rgba = (c: readonly number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mix = (a: readonly number[], b: readonly number[], t: number) =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t));

export function VoiceOrb({
  voice,
  muted,
  className,
}: {
  /** The call: read every frame for how loud each side is. */
  voice: RefObject<{ levels: () => Levels } | null>;
  muted: boolean;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    /* Canvas blur: not in every browser; without it the light is just crisper. */
    const soft = 'filter' in ctx;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let count = 0;
    let spin = 0;
    let last = performance.now();
    /* Smoothed levels: quick to rise, slow to fall, so speech reads as a swell. */
    let you = 0;
    let them = 0;

    const draw = (time: number) => {
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;
      const t = time / 1000;
      const raw = voice.current?.levels() ?? { mine: 0, theirs: 0 };
      const targetYou = mutedRef.current ? 0 : Math.min(1, raw.mine * 1.6);
      const targetThem = Math.min(1, raw.theirs * 1.6);
      you += (targetYou - you) * (targetYou > you ? 0.3 : 0.06);
      them += (targetThem - them) * (targetThem > them ? 0.3 : 0.06);
      const loudest = Math.max(you, them);
      spin += dt * (calm ? 0.25 : 0.9 + loudest * 1.4);

      /* Sized to the element, sharp on high-density screens. */
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const size = el.clientWidth;
      if (el.width !== Math.round(size * ratio)) {
        el.width = Math.round(size * ratio);
        el.height = Math.round(size * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'round';
      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.3;

      /* Where the two halves meet: higher while you talk, lower while they do. */
      const seamAt = R * 0.24 * (you - them);
      const amp = R * (0.2 + 0.14 * loudest);
      const ripple = R * 0.045 * loudest;

      /* One ribbon at height `lat` (−R…R): screen points with their depth. */
      const ribbon = (lat: number, wave: number) => {
        const r = R * Math.sqrt(Math.max(0, 1 - (lat / R) ** 2));
        const points: { x: number; y: number; depth: number; side: number }[] = [];
        for (let i = 0; i <= SEGMENTS; i++) {
          const a = (i / SEGMENTS) * Math.PI * 2;
          const y =
            lat + (r / R) * (wave * Math.sin(2 * a + t * 0.6) + ripple * Math.sin(6 * a - t * 9));
          const x0 = r * Math.cos(a);
          const z0 = r * Math.sin(a);
          const x = x0 * Math.cos(spin) - z0 * Math.sin(spin);
          const z1 = x0 * Math.sin(spin) + z0 * Math.cos(spin);
          const yy = y * Math.cos(TILT) - z1 * Math.sin(TILT);
          const z = y * Math.sin(TILT) + z1 * Math.cos(TILT);
          points.push({ x: cx + x, y: cy - yy, depth: z / R, side: x / R });
        }
        return points;
      };

      /* One unbroken line per depth band — back, middle, front — so the far
         side of the orb is dimmer without the joins of short pieces adding
         up to dots under additive light. */
      const stroke = (
        points: ReturnType<typeof ribbon>,
        width: number,
        alpha: number,
        style: string | CanvasGradient,
      ) => {
        ctx.lineWidth = width;
        ctx.strokeStyle = style;
        for (let band = 0; band < 3; band++) {
          ctx.globalAlpha = Math.min(1, alpha * (0.3 + 0.35 * band));
          ctx.beginPath();
          let drawing = false;
          for (let i = 0; i < SEGMENTS; i++) {
            const p = points[i];
            const q = points[i + 1];
            const depth = ((p.depth + q.depth) / 2 + 1) / 2;
            if (Math.min(2, Math.floor(depth * 3)) !== band) {
              drawing = false;
              continue;
            }
            if (!drawing) ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            drawing = true;
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };

      /* A faint body, so the orb reads as one thing even in silence. */
      const body = ctx.createRadialGradient(cx, cy - R * 0.2, R * 0.2, cx, cy, R * 1.25);
      body.addColorStop(0, rgba(AMBER, 0.05 + 0.08 * them));
      body.addColorStop(0.6, rgba(BLUE, 0.04 + 0.08 * you));
      body.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = body;
      ctx.fillRect(0, 0, size, size);

      /* The lobes: blue below the seam, amber above, brighter for the speaker,
         softened into glow where the browser can blur a canvas. */
      if (soft) ctx.filter = `blur(${(R * 0.05).toFixed(1)}px)`;
      for (const [colour, level, dir] of [
        [BLUE, you, -1],
        [AMBER, them, 1],
      ] as const) {
        const reach = R * (0.8 + 0.18 * level) - dir * seamAt;
        for (let k = 1; k <= COPIES; k++) {
          const f = k / COPIES;
          const lat = seamAt + dir * reach * f;
          const fade = (1 - f) ** 1.4;
          stroke(
            ribbon(lat, amp * (1 - f * 0.7)),
            R * (0.12 + 0.08 * f),
            (0.15 + 0.22 * level) * fade + 0.03,
            rgba(colour, 1),
          );
        }
      }
      if (soft) ctx.filter = 'none';

      /* The ribbon: a wide glow, then a bright core, amber to blue across it. */
      const seam = ribbon(seamAt, amp);
      const across = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
      across.addColorStop(0, rgba(AMBER, 1));
      across.addColorStop(0.55, rgba(mix(AMBER, BLUE, 0.35), 1));
      across.addColorStop(1, rgba(BLUE, 1));
      if (soft) ctx.filter = `blur(${(R * 0.04).toFixed(1)}px)`;
      stroke(seam, R * 0.2, 0.42 + 0.14 * loudest, across);
      if (soft) ctx.filter = 'none';
      stroke(seam, R * 0.06, 0.65 + 0.15 * loudest, across);
      const core = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
      core.addColorStop(0, 'rgb(255,222,178)');
      core.addColorStop(1, 'rgb(214,224,255)');
      stroke(seam, Math.max(1.4, R * 0.02), 1, core);

      /* For tests and tools: how loud each side currently reads. */
      if (++count % 6 === 0) {
        el.dataset.you = you.toFixed(3);
        el.dataset.them = them.toFixed(3);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [voice]);

  return <canvas ref={canvas} aria-hidden="true" className={className} />;
}
