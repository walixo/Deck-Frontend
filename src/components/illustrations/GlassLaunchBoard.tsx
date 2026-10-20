import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from '@/components/deckgames/motion';
import { cn } from '@/lib/utils';

/**
 * The launch board, built in three dimensions out of glass.
 *
 * The same picture the flat drawing made — three launches stacked on a board,
 * votes climbing beside them — but as an object: frosted panes floating at
 * different depths with real edges, and solid glass bars standing on a glass
 * floor, all lit from behind by the arcade's warm light. Everything is CSS 3D
 * (`preserve-3d` and perspective), so it renders live, crisp at any size, with
 * no image to download.
 *
 * The dark middle pane is smoked glass and sits nearest, as the dark row did in
 * the drawing. The scene leans toward the pointer, and holds still for anyone
 * who has asked for reduced motion. Purely decorative.
 */

/* Scene units are px inside a fixed 420×320 stage, scaled to fit by CSS. */
const PANES = [
  { top: 34, depth: 0, smoked: false },
  { top: 116, depth: 46, smoked: true },
  { top: 198, depth: 18, smoked: false },
] as const;

const BARS = [
  { left: 312, height: 66, tone: 'ember', delay: '0s' },
  { left: 350, height: 104, tone: 'clear', delay: '-1.4s' },
  { left: 388, height: 150, tone: 'smoke', delay: '-2.8s' },
] as const;

const FLOOR_Y = 292;
const BAR_WIDTH = 30;
const BAR_DEPTH = 30;

export function GlassLaunchBoard({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [lean, setLean] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  /* The scene is laid out in px on a 420×320 stage and scaled to fit, so the
     3D depths stay consistent at any size. Measured, rather than worked out
     in CSS, because dividing one length by another in calc() is not yet
     supported everywhere. */
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const fit = () => setScale(Math.min(node.clientWidth / 420, node.clientHeight / 320));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const onMove = (event: React.PointerEvent) => {
    if (reduced || event.pointerType !== 'mouse') return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setLean({
      x: ((event.clientY - rect.top) / rect.height - 0.5) * -8,
      y: ((event.clientX - rect.left) / rect.width - 0.5) * 12,
    });
  };

  return (
    <div
      ref={ref}
      aria-hidden="true"
      onPointerMove={onMove}
      onPointerLeave={() => setLean({ x: 0, y: 0 })}
      className={cn('relative isolate aspect-[21/16] w-full select-none', className)}
    >
      {/* The light the glass catches. */}
      <div className="pointer-events-none absolute inset-[-8%] -z-10">
        <span className="absolute left-[6%] top-[14%] size-[46%] animate-g-drift rounded-full bg-[#e8501f] opacity-80 blur-3xl [--g-tilt:0deg]" />
        <span className="absolute right-[4%] top-[2%] size-[42%] animate-g-drift rounded-full bg-[#e08a10] opacity-70 blur-3xl [--g-tilt:0deg] [animation-delay:-3s]" />
        <span className="absolute bottom-[6%] right-[20%] size-[44%] animate-g-drift rounded-full bg-[#6a44f0] opacity-70 blur-3xl [--g-tilt:0deg] [animation-delay:-6s]" />
      </div>

      {/* A fixed-size stage, scaled to the container so the 3D maths stays in px. */}
      <div className="absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-[320px] w-[420px] [perspective:1100px]"
          style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
        >
          <div
            className="relative size-full transition-transform duration-700 ease-glide [transform-style:preserve-3d]"
            style={{ transform: `rotateX(${10 + lean.x}deg) rotateY(${-24 + lean.y}deg)` }}
          >
            <Floor />
            {PANES.map((pane) => (
              <Pane key={pane.top} {...pane} />
            ))}
            {BARS.map((bar) => (
              <Bar key={bar.left} {...bar} reduced={reduced} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A glass shelf the bars stand on, with a soft reflection of the light. */
function Floor() {
  return (
    <div
      className="absolute left-[6px] h-[150px] w-[420px] rounded-[18px] border border-white/30 bg-[linear-gradient(180deg,rgb(255_255_255/0.28),rgb(255_255_255/0.04))] [transform-origin:top]"
      style={{ top: FLOOR_Y, transform: 'rotateX(90deg)' }}
    />
  );
}

/** One launch: a frosted pane with a little thickness behind it. */
function Pane({ top, depth, smoked }: { top: number; depth: number; smoked: boolean }) {
  const face = smoked
    ? 'border-white/25 bg-[rgb(18_10_28/0.55)]'
    : 'border-white/45 bg-white/[0.16]';
  const ink = smoked ? 'bg-white/90' : 'bg-white/95';
  const inkSoft = smoked ? 'bg-white/45' : 'bg-white/55';

  return (
    <div
      className="absolute left-0 h-[66px] w-[292px] [transform-style:preserve-3d]"
      style={{ top, transform: `translateZ(${depth}px)` }}
    >
      {/* The pane's edge: a slightly darker slab a few px behind the face. */}
      <div
        className={cn(
          'absolute inset-0 rounded-[18px]',
          smoked ? 'bg-[rgb(10_6_18/0.6)]' : 'bg-white/20',
        )}
        style={{ transform: 'translateZ(-7px)' }}
      />
      <div
        className={cn(
          'absolute inset-0 flex items-center gap-4 overflow-hidden rounded-[18px] border px-4 backdrop-blur-xl backdrop-saturate-150',
          'shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_18px_40px_-18px_rgb(20_8_40/0.5)]',
          face,
        )}
      >
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgb(255_255_255/0.35)_0%,transparent_45%)]" />
        <span
          className={cn(
            'relative size-9 shrink-0 rounded-[10px] shadow-[inset_0_1px_0_rgb(255_255_255/0.6)]',
            smoked ? 'bg-white/90' : 'bg-[rgb(18_10_28/0.75)]',
          )}
        />
        <span className="relative flex flex-1 flex-col gap-2">
          <span className={cn('h-[7px] w-[62%] rounded-full', ink)} />
          <span className={cn('h-[7px] w-[38%] rounded-full', inkSoft)} />
        </span>
        <span className="relative size-9 shrink-0 rounded-[10px] border-2 border-white/80 bg-white/10" />
      </div>
    </div>
  );
}

const TONES = {
  ember: {
    face: 'bg-[linear-gradient(180deg,rgb(255_120_70/0.75),rgb(201_58_12/0.55))] border-white/40',
    side: 'bg-[rgb(170_44_8/0.55)] border-white/25',
    top: 'bg-[rgb(255_170_130/0.85)] border-white/50',
  },
  clear: {
    face: 'bg-[linear-gradient(180deg,rgb(255_255_255/0.7),rgb(255_255_255/0.28))] border-white/70',
    side: 'bg-white/30 border-white/50',
    top: 'bg-white/80 border-white/80',
  },
  smoke: {
    face: 'bg-[linear-gradient(180deg,rgb(40_26_60/0.7),rgb(14_8_24/0.6))] border-white/30',
    side: 'bg-[rgb(8_4_16/0.6)] border-white/20',
    top: 'bg-[rgb(90_70_120/0.75)] border-white/35',
  },
} as const;

/** A solid glass bar: five faces of a box, standing on the floor. */
function Bar({
  left,
  height,
  tone,
  delay,
  reduced,
}: {
  left: number;
  height: number;
  tone: keyof typeof TONES;
  delay: string;
  reduced: boolean;
}) {
  const colours = TONES[tone];
  const faceClass = 'absolute border backdrop-blur-md shadow-[inset_0_1px_0_rgb(255_255_255/0.45)]';
  const box: CSSProperties = { left, top: FLOOR_Y - height, width: BAR_WIDTH, height };

  return (
    <div
      className="absolute [transform-style:preserve-3d]"
      style={{ ...box, transform: `translateZ(${BAR_DEPTH / 2}px)` }}
    >
      {/* Its own layer for the bob, so the animation never replaces the
          bar's place in the scene. */}
      <div
        className={cn(
          'relative size-full [transform-style:preserve-3d]',
          !reduced && 'animate-[var(--animate-kick)]',
        )}
        style={{ animationDelay: delay }}
      >
        {/* front and back */}
        <span
          className={cn(faceClass, colours.face, 'inset-0 rounded-[3px]')}
          style={{ transform: `translateZ(${BAR_DEPTH / 2}px)` }}
        />
        <span
          className={cn(faceClass, colours.side, 'inset-0 rounded-[3px]')}
          style={{ transform: `rotateY(180deg) translateZ(${BAR_DEPTH / 2}px)` }}
        />
        {/* sides */}
        {[90, -90].map((turn) => (
          <span
            key={turn}
            className={cn(faceClass, colours.side, 'top-0 h-full rounded-[3px]')}
            style={{
              width: BAR_DEPTH,
              left: (BAR_WIDTH - BAR_DEPTH) / 2,
              transform: `rotateY(${turn}deg) translateZ(${BAR_WIDTH / 2}px)`,
            }}
          />
        ))}
        {/* top */}
        <span
          className={cn(faceClass, colours.top, 'left-0 w-full rounded-[3px]')}
          style={{
            height: BAR_DEPTH,
            top: (height - BAR_DEPTH) / 2,
            transform: `rotateX(90deg) translateZ(${height / 2}px)`,
          }}
        />
      </div>
    </div>
  );
}
