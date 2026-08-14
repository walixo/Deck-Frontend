import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/*
 * Geometry, in the SVG's own units.
 *
 * The silhouette is a plain oval, but the eyes are treated as two patches on
 * the surface of the sphere that oval stands in for. That single idea is what
 * sells the effect: a sphere's outline does not change when it rotates, so the
 * face can hold still while the eyes swing across it and compress toward the
 * edge, exactly the way a real head reads from the front.
 */
const FACE = { cx: 62, cy: 50, rx: 54, ry: 43 };
const SHADOW_OFFSET = 5;

/** Where each eye sits on the sphere, as angles off the face's normal. */
const EYE_SPREAD = 0.25;
const EYE_RISE = -0.06;
const EYE = { w: 15, h: 37, tilt: -8 };

/** How far the head will turn before it gives up and just stares. */
const MAX_YAW = 0.52;
const MAX_PITCH = 0.44;

/**
 * Cursor distances, in px, at which the two channels saturate. TURN_RANGE
 * drives x/y — the direction of the look. DEPTH_RANGE drives z — how near you
 * are, which is what makes the avatar lean in and widen its eyes as you
 * approach, and settle back as you leave.
 */
const TURN_RANGE = 340;
const DEPTH_RANGE = 560;

/** The avatar sits at an angle rather than square to the page. */
const BASE_TILT = -9;

/**
 * Rabbit ears, as two capsules that overhang the top of the viewBox. The SVG
 * is `overflow-visible`, so shapes outside the box still paint — which means
 * ears cost no change to the face's size or placement, and both mascots stay
 * pixel-identical from the neck down.
 */
const EAR = { w: 23, h: 72, lean: 14, spread: 20, base: 26 };

/**
 * How far the ears reach above the top of the viewBox. The drag clamp needs
 * this: it measures the element's box, which the overhang is deliberately not
 * part of, so without it you could drag the rabbit up until its ears vanished
 * under the hero's `overflow-hidden` edge.
 */
const EAR_OVERHANG = 50;

/**
 * How far the cursor can be before a mascot loses interest and goes back to
 * looking at its partner. Wider than DEPTH_RANGE so they track you anywhere in
 * the hero, and only turn to each other once you have properly left.
 */
const ATTENTION_RANGE = 760;

/** How far to the side a mascot looks when it is watching the other one. */
const REST_YAW = 0.3;

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

interface HeroAvatarProps {
  className?: string;
  /** Tailwind fill utility for the face. */
  tone?: string;
  /** Which way it turns when the cursor is not around — toward its partner. */
  facing?: 'left' | 'right';
  ears?: boolean;
}

/**
 * A draggable mascot that watches the cursor.
 *
 * Every frame is written straight to the DOM from a rAF loop rather than
 * through state — a `setState` per mousemove would re-render the hero sixty
 * times a second for an animation React has no opinion about.
 *
 * Decorative, so it is hidden from assistive tech: dragging it conveys nothing
 * and reveals nothing, and it is not in the tab order.
 */
export function HeroAvatar({
  className,
  tone = 'fill-cobalt',
  facing = 'right',
  ears = false,
}: HeroAvatarProps) {
  const clipId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<SVGGElement>(null);
  const earsRef = useRef<SVGGElement>(null);
  const leftEyeRef = useRef<SVGRectElement>(null);
  const rightEyeRef = useRef<SVGRectElement>(null);

  /* +1 faces right, -1 faces left. Flips the lean and the resting gaze, which
     is all it takes to turn one mascot into the other one's reflection. */
  const sense = facing === 'left' ? -1 : 1;

  const [dragging, setDragging] = useState(false);

  /* Where the avatar has been dragged to, relative to its laid-out position. */
  const offset = useRef({ x: 0, y: 0 });
  const drag = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  /* Smoothed drag velocity — while you are dragging, it looks where it is going. */
  const velocity = useRef({ x: 0, y: 0 });
  const pointer = useRef<{ x: number; y: number } | null>(null);

  /* Live pose, eased toward the target every frame. */
  const pose = useRef({ yaw: 0, pitch: 0, depth: 0 });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };

      const state = drag.current;
      if (!state.active || event.pointerId !== state.pointerId) return;

      const next = clampToParent(
        root,
        state.originX + event.clientX - state.startX,
        state.originY + event.clientY - state.startY,
        overhang(root, ears),
      );
      velocity.current = {
        x: next.x - offset.current.x,
        y: next.y - offset.current.y,
      };
      offset.current = next;
    };

    const handleLeave = () => {
      pointer.current = null;
    };

    document.addEventListener('pointermove', handleMove, { passive: true });
    document.addEventListener('pointerleave', handleLeave);

    let raf = 0;
    let previous = performance.now();
    let nextBlinkAt = previous + 2600;
    let blinkUntil = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);

      const dt = Math.min(64, now - previous);
      previous = now;

      /* Time-corrected easing, so the feel does not change with frame rate. */
      const ease = 1 - Math.exp(-dt / 85);

      /* With nothing to look at, it turns to face its partner. */
      let targetYaw = REST_YAW * sense;
      let targetPitch = 0;
      let targetDepth = 0;

      if (drag.current.active) {
        /* The cursor is under the avatar while dragging, so a look-at would
           just cross its eyes. Look along the direction of travel instead. */
        targetYaw = clamp(velocity.current.x / 14, -1, 1) * MAX_YAW;
        targetPitch = clamp(velocity.current.y / 14, -1, 1) * MAX_PITCH;
        targetDepth = 1;
        velocity.current.x *= 0.86;
        velocity.current.y *= 0.86;
      } else if (pointer.current) {
        const box = root.getBoundingClientRect();
        const dx = pointer.current.x - (box.left + box.width / 2);
        const dy = pointer.current.y - (box.top + box.height / 2);

        /* Attention decides who wins: the cursor nearby, or the other mascot. */
        const attention = clamp(1 - Math.hypot(dx, dy) / ATTENTION_RANGE, 0, 1);

        targetYaw = mix(REST_YAW * sense, clamp(dx / TURN_RANGE, -1, 1) * MAX_YAW, attention);
        targetPitch = clamp(dy / TURN_RANGE, -1, 1) * MAX_PITCH * attention;
        targetDepth = clamp(1 - Math.hypot(dx, dy) / DEPTH_RANGE, 0, 1);
      }

      if (reduced.matches) {
        pose.current = { yaw: REST_YAW * sense, pitch: 0, depth: 0 };
      } else {
        pose.current.yaw += (targetYaw - pose.current.yaw) * ease;
        pose.current.pitch += (targetPitch - pose.current.pitch) * ease;
        pose.current.depth += (targetDepth - pose.current.depth) * ease;
      }

      const { yaw, pitch, depth } = pose.current;

      if (now > nextBlinkAt && !reduced.matches) {
        blinkUntil = now + 110;
        /* Irregular spacing reads as alive; a fixed interval reads as a machine. */
        nextBlinkAt = now + 2400 + ((now * 7919) % 4200);
      }
      const blink = now < blinkUntil ? 0.08 : 1;

      /* The body follows a little behind the eyes: a small lean and a lift as
         you get close, on top of the fixed tilt it sits at. */
      root.style.transform =
        `translate3d(${offset.current.x + yaw * 9}px, ${offset.current.y + pitch * 9}px, 0)` +
        ` rotate(${BASE_TILT * sense + yaw * 7}deg)` +
        ` scale(${1 + depth * 0.05 + (drag.current.active ? 0.04 : 0)})`;

      faceRef.current?.setAttribute(
        'transform',
        `translate(${FACE.cx} ${FACE.cy}) scale(${1 - depth * 0.015}) translate(${-FACE.cx} ${-FACE.cy})`,
      );

      /* Ears swing with the head, but at a fraction of the eyes' travel —
         they sit further back on the skull, so they move less. */
      earsRef.current?.setAttribute('transform', `translate(${yaw * 13} ${pitch * 7})`);

      /* Eyes open wider the nearer the cursor gets — the z channel. */
      const openness = (0.88 + depth * 0.24) * blink;
      leftEyeRef.current?.setAttribute(
        'transform',
        eyeTransform(-EYE_SPREAD, yaw, pitch, openness, sense),
      );
      rightEyeRef.current?.setAttribute(
        'transform',
        eyeTransform(EYE_SPREAD, yaw, pitch, openness, sense),
      );
    };

    raf = requestAnimationFrame(frame);

    const handleResize = () => {
      offset.current = clampToParent(
        root,
        offset.current.x,
        offset.current.y,
        overhang(root, ears),
      );
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerleave', handleLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [sense, ears]);

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== drag.current.pointerId) return;
    drag.current.active = false;
    setDragging(false);
  };

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      onPointerDown={(event) => {
        const root = rootRef.current;
        if (!root) return;
        root.setPointerCapture(event.pointerId);
        drag.current = {
          active: true,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          originX: offset.current.x,
          originY: offset.current.y,
        };
        velocity.current = { x: 0, y: 0 };
        setDragging(true);
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={cn(
        'w-28 touch-none select-none xl:w-36',
        /* No transition on transform: the rAF loop owns it frame by frame. */
        dragging ? 'z-20 cursor-grabbing' : 'cursor-grab',
        className,
      )}
    >
      <svg viewBox="0 0 124 105" className="block w-full overflow-visible">
        <defs>
          {/* Inset a hair so an eye sliding to the rim stops at the inside of
              the border rather than eating it. */}
          <clipPath id={clipId}>
            <ellipse cx={FACE.cx} cy={FACE.cy} rx={FACE.rx - 2.5} ry={FACE.ry - 2.5} />
          </clipPath>
        </defs>

        <g ref={faceRef}>
          {/* Ears go down first so the head's own border cuts across them
              cleanly and they read as being behind it, not stuck on. */}
          {ears && (
            <g ref={earsRef}>
              {[-1, 1].map((side) => (
                <rect
                  key={`ear-shadow-${side}`}
                  {...EAR_BOX}
                  transform={earTransform(side, SHADOW_OFFSET)}
                  className="fill-edge"
                />
              ))}
              {[-1, 1].map((side) => (
                <g key={`ear-${side}`} transform={earTransform(side)}>
                  <rect {...EAR_BOX} strokeWidth={2.5} className={cn('stroke-edge', tone)} />
                  <rect
                    x={-(EAR.w - 13) / 2}
                    y={-EAR.h / 2 + 13}
                    width={EAR.w - 13}
                    height={EAR.h - 42}
                    rx={(EAR.w - 13) / 2}
                    className="fill-ink"
                  />
                </g>
              ))}
            </g>
          )}

          {/* The hard offset shadow, drawn as a shape — box-shadow does not
              reach SVG geometry, and this has to invert with the theme. */}
          <ellipse
            cx={FACE.cx + SHADOW_OFFSET}
            cy={FACE.cy + SHADOW_OFFSET}
            rx={FACE.rx}
            ry={FACE.ry}
            className="fill-edge"
          />

          <ellipse
            cx={FACE.cx}
            cy={FACE.cy}
            rx={FACE.rx}
            ry={FACE.ry}
            strokeWidth={2.5}
            className={cn('stroke-edge', tone)}
          />

          <g clipPath={`url(#${clipId})`}>
            <rect
              ref={leftEyeRef}
              x={-EYE.w / 2}
              y={-EYE.h / 2}
              width={EYE.w}
              height={EYE.h}
              rx={EYE.w / 2}
              className="fill-ink"
            />
            <rect
              ref={rightEyeRef}
              x={-EYE.w / 2}
              y={-EYE.h / 2}
              width={EYE.w}
              height={EYE.h}
              rx={EYE.w / 2}
              className="fill-ink"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

/** The ears' reach above the element box, in px at its rendered size. */
function overhang(element: HTMLElement, ears: boolean) {
  return ears ? (element.offsetWidth * EAR_OVERHANG) / 124 : 0;
}

/** The ear capsule, drawn around its own origin so a transform can place it. */
const EAR_BOX = {
  x: -EAR.w / 2,
  y: -EAR.h / 2,
  width: EAR.w,
  height: EAR.h,
  rx: EAR.w / 2,
} as const;

/** `side` is -1 for the left ear, +1 for the right; they splay outward. */
function earTransform(side: number, offset = 0) {
  const x = FACE.cx + side * EAR.spread + offset;
  const y = EAR.base - EAR.h / 2 + offset;
  return `translate(${x} ${y}) rotate(${side * EAR.lean})`;
}

/**
 * Project one eye onto the sphere and lay the pill out there.
 *
 * `cos(angle)` doing double duty is the whole trick: it places the eye and, as
 * the same number, squashes it. An eye turned 60° away lands near the rim and
 * is half as wide, because that is how much of it you would still be able to
 * see.
 */
function eyeTransform(base: number, yaw: number, pitch: number, openness: number, sense: number) {
  const across = base + yaw;
  const down = EYE_RISE + pitch;

  const x = FACE.cx + Math.sin(across) * Math.cos(down) * FACE.rx;
  const y = FACE.cy + Math.sin(down) * FACE.ry;

  const squashX = Math.max(0.16, Math.cos(across));
  const squashY = Math.max(0.42, Math.cos(down)) * openness;

  /* Pills lean into the turn, the way features follow a face's meridians. The
     resting lean mirrors with the mascot so the pair are true reflections. */
  const tilt = EYE.tilt * sense + across * 14;

  return `translate(${x} ${y}) rotate(${tilt}) scale(${squashX} ${squashY})`;
}

/**
 * Keep the avatar inside the block it was laid out in, so a drag can never
 * push it under the hero's `overflow-hidden` edge. `offsetLeft`/`offsetTop`
 * are read rather than a bounding rect because they ignore the transform we
 * are in the middle of setting.
 */
function clampToParent(element: HTMLElement, x: number, y: number, overhangTop = 0) {
  const parent = element.offsetParent as HTMLElement | null;
  if (!parent) return { x, y };

  const pad = 8;
  const minX = pad - element.offsetLeft;
  const maxX = parent.clientWidth - pad - element.offsetWidth - element.offsetLeft;
  const minY = pad + overhangTop - element.offsetTop;
  const maxY = parent.clientHeight - pad - element.offsetHeight - element.offsetTop;

  return {
    x: clamp(x, Math.min(minX, maxX), Math.max(minX, maxX)),
    y: clamp(y, Math.min(minY, maxY), Math.max(minY, maxY)),
  };
}
