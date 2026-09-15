import { useEffect, useRef, useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { formatNumber } from '@/lib/utils';
import type { Item } from '@/types';

/**
 * A tunnel of type, made of the launches themselves.
 *
 * Concentric rings of tangential text falling away from a centre: small, tight
 * and almost black where they are born, wide and fully lit by the time they
 * leave the frame. A ring never gains or loses a letter — it only grows, and
 * its letters draw apart as it goes, which is the whole depth cue.
 *
 * It runs on its own and answers to nothing: no pointer, no press, no cursor.
 * A landing page section that only comes alive when you interact with it is a
 * section most people never see move.
 *
 * The words are not decoration. The stream is the names of the launches this
 * page has already fetched, so the thing drifting past is Deck's actual
 * catalogue rather than lorem — which is the only reason a section like this
 * earns a place on a landing page instead of being an effect for its own sake.
 *
 * Canvas, not DOM. This is around a thousand glyphs a frame, each one rotated
 * onto its own arc; a thousand absolutely positioned spans with transforms
 * would be a layout pass per frame for a picture nobody can select anyway.
 */

/* ------------------------------------------------------------ the tunnel --- */

/**
 * How many rings are in flight at once. One is born every 0.83s.
 *
 * Fifteen rather than eighteen. Every ring now carries a fixed glyph count, so
 * a ring costs the same whether it is a 60px circle or an 800px one — and three
 * fewer of them is a sixth off the per-frame draw with the rings 20% apart in
 * radius instead of 16%, which is if anything closer to the reference.
 */
const RINGS = 15;

/**
 * Where a ring is born, and how big its type is there.
 *
 * Radius grows exponentially, so half the rings are always inside the geometric
 * midpoint of the range — with a birth radius of 34 that midpoint was about
 * 160px, which put ten rings inside a circle the size of a beer mat and turned
 * the middle into mush. Starting them further out spends the same number of
 * rings over a range you can read.
 */
const R_MIN = 60;
const FS_MIN = 6.5;

/**
 * How much faster the type grows than the ring it sits on.
 *
 * Radius runs to roughly 15x its birth size. At an exponent of 1 the glyphs
 * would grow by the same factor: every ring identical, wallpaper rather than a
 * tunnel, and 130px letters at the edge. At 0.72 the type grows about six-fold
 * — 40px out at the rim — and because a ring keeps the glyph count it was born
 * with, the letters open out as it travels. That opening is the depth cue, and
 * it is free: nothing has to be recounted for it to happen.
 */
const SPREAD = 0.72;

/**
 * Cycles per second: a ring crosses the frame in 12.5 seconds.
 *
 * Twice what it was. The old rate was tuned around a press that could speed it
 * up on demand, and without that the drift on its own was slow enough to read
 * as a stall rather than as calm.
 */
const RATE = 0.08;

/* Mono advance width as a fraction of the em, measured for Geist Mono. Used to
   decide how many glyphs a circumference will hold. */
const ADVANCE = 0.6;

/**
 * How tightly the letters sit at the moment a ring is born.
 *
 * Slightly under 1, so the innermost rings overlap a little. That is deliberate
 * and invisible: a ring at birth is at 2% opacity, and buying that overlap is
 * what stops the outermost rings — the only ones anybody actually reads — from
 * being strung out too far to make words.
 */
const BIRTH_SPACING = 0.85;

/**
 * Glyphs per ring. Fixed, and the same for every ring, for its whole life.
 *
 * This is the fix for the stutter, and it is worth stating plainly. The count
 * used to be recomputed every frame from the ring's current circumference, so
 * as a ring grew the count ticked 47, 48, 49 — and on each tick *every glyph on
 * that ring jumped*, because the angles were `j * 2π / count`. Eighteen rings
 * crossing about 180 of those thresholds a lap meant something on screen
 * snapped roughly every eight milliseconds. That was the lag: not frame rate,
 * but a layout that could not hold still.
 *
 * Fixing the count fixes the angles, so no glyph ever moves sideways again —
 * a ring only grows, brightens, and lets its letters draw apart. It also means
 * every ring shares one angular grid, which is why the sine and cosine of every
 * slot can be worked out once here rather than a thousand times a frame.
 */
const SLOTS = Math.round((2 * Math.PI * R_MIN) / (FS_MIN * ADVANCE * BIRTH_SPACING));

const COS = new Float32Array(SLOTS);
const SIN = new Float32Array(SLOTS);
for (let j = 0; j < SLOTS; j += 1) {
  const angle = (j / SLOTS) * Math.PI * 2;
  COS[j] = Math.cos(angle);
  SIN[j] = Math.sin(angle);
}

/**
 * Turns a ring makes between being born and leaving the frame.
 *
 * The turning is not uniform, and that is the whole character of it. Rotation
 * accumulates as `ln(1 + u)`, so a ring spins fastest while it is small and dim
 * and slowest once it is wide and readable — which means the core swirls while
 * the big names out at the rim drift almost sedately past. A rigid rotation, the
 * same rate at every radius, reads as a turntable; this reads as water going
 * down a drain.
 *
 * It also stays free. Because the profile is integrable, a ring's angle is a
 * closed-form function of its own age — no per-ring accumulator to keep, and
 * nothing that can drift out of step after a tab has been asleep.
 */
const TURNS_PER_LIFE = 0.45;
const TURN_SCALE = (TURNS_PER_LIFE * Math.PI * 2) / Math.LN2;

/**
 * How many device pixels the canvas is allowed to be.
 *
 * A full-bleed 42rem band on a large screen at device ratio 2 is close to five
 * million pixels to clear and refill sixty times a second, and past a point
 * that is the cost — not the glyph count. Above this budget the backing store
 * is rendered at a lower ratio and scaled up by the compositor, which for
 * drifting decorative type is a trade nobody can see and the frame timer very
 * much can.
 */
const MAX_PIXELS = 2_600_000;

/**
 * Size steps in the glyph atlas, as a ratio.
 *
 * Every glyph here is drawn under its own rotation, and rotated `fillText` is
 * the one thing a browser cannot cache: the glyph has to be rasterised from
 * outlines for every distinct transform, which measured at 3.7µs a letter and
 * was 92% of the frame. Pre-rasterising each character once and blitting it as
 * a sprite turns that into a textured quad.
 *
 * The cost of the trick is that sizes have to be quantised. 15% steps, always
 * rounding *up* to the next atlas and scaling down to fit, so a glyph is never
 * enlarged — the worst case is a 13% reduction of an already-sharp bitmap,
 * which is invisible, where enlarging would be obvious.
 */
const ATLAS_RATIO = 1.15;

/** Bone, and fixed. This section is night in both themes — see the wrapper. */
const INK = '#f7f6f2';

/** What drifts when the board has not loaded yet. */
const FALLBACK = 'WHERE NEW TECH GETS ITS FIRST FANS';

interface VortexProps {
  /** What drifts past. The newest slice of the board, not all of it. */
  items: Item[];
  /**
   * How many launches Deck actually holds.
   *
   * Separate from `items.length` on purpose: the feed above this is capped at
   * 24, so counting the array would have the headline confidently announce
   * "24 launches" on a board of any size over 24.
   */
  total?: number;
}

export function LaunchVortex({ items, total }: VortexProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /*
   * Read once, at the first render, rather than set from inside the effect —
   * which would be a second render for something knowable before the first,
   * and which the lint rule guarding against cascading renders will not have.
   */
  const [still] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /*
   * The stream, as one long string.
   *
   * Joined with a spaced interpunct so a ring reads as a list even where it is
   * clipped to four characters — a run of names butted together reads as one
   * very long word.
   */
  const stream = items.length
    ? `${items.map((item) => item.name.toUpperCase()).join(' · ')} · `
    : `${FALLBACK} · `;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const chars = [...stream];
    /* One entry per distinct character, which is what the atlas holds. Names
       are upper-cased upstream, so this is rarely more than forty cells. */
    const alphabet = [...new Set(chars)];
    const cell = new Map(alphabet.map((ch, index) => [ch, index]));

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rMax = 0;
    let growth = 1;

    /** One pre-rasterised size of the whole alphabet, laid out in a row. */
    interface Atlas {
      sheet: HTMLCanvasElement;
      /** The size, in CSS pixels, this sheet was drawn for. */
      size: number;
      /** Cell dimensions, in device pixels. */
      w: number;
      h: number;
    }

    let atlases: Atlas[] = [];

    const buildAtlases = () => {
      const fsMax = FS_MIN * Math.pow(growth, SPREAD);
      const steps = Math.max(1, Math.ceil(Math.log(fsMax / FS_MIN) / Math.log(ATLAS_RATIO)) + 1);

      atlases = [];
      for (let step = 0; step < steps; step += 1) {
        const size = FS_MIN * Math.pow(ATLAS_RATIO, step);
        /* Padding on the width, because an italic-free mono glyph still spills
           a little past its advance once it is antialiased. */
        const w = Math.ceil(size * ADVANCE * dpr) + 4;
        const h = Math.ceil(size * 1.5 * dpr);

        const sheet = document.createElement('canvas');
        sheet.width = w * alphabet.length;
        sheet.height = h;

        const pen = sheet.getContext('2d');
        if (!pen) continue;

        /* Sized in device pixels directly rather than scaling the context: the
           sprite is blitted in device space later, so this is the space it
           needs to be sharp in. */
        pen.font = `${(size * dpr).toFixed(2)}px "Geist Mono Variable", ui-monospace, monospace`;
        pen.textAlign = 'center';
        pen.textBaseline = 'middle';
        pen.fillStyle = INK;
        alphabet.forEach((ch, index) => pen.fillText(ch, index * w + w / 2, h / 2));

        atlases.push({ sheet, size, w, h });
      }
    };

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) return false;

      width = box.width;
      height = box.height;

      /* Whichever is smaller: the screen's own ratio, two, or whatever keeps
         the backing store inside the pixel budget. */
      dpr = Math.max(
        1,
        Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(MAX_PIXELS / (width * height))),
      );

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      /* Just past the corner, so a ring is fully gone before it wraps back to
         the middle and there is never a pop. */
      rMax = Math.hypot(width, height) * 0.62;
      growth = rMax / R_MIN;

      buildAtlases();
      return true;
    };

    /*
     * Deterministic, so a ring's text and its starting angle survive a resize.
     * `Math.random` here would reshuffle the whole field every time the window
     * moved a pixel.
     */
    const noise = (a: number, b: number) =>
      Math.abs(Math.sin(a * 127.1 + b * 311.7) * 43758.5453) % 1;

    const draw = (clock: number) => {
      /* Cleared in device pixels under the identity transform, because every
         glyph below installs its own matrix and none of them leave one behind
         to clear against. */
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = width / 2;
      const cy = height / 2;

      /* Opacity is set once per ring and rides on `globalAlpha` — a number
         assignment, where an `rgba()` fill string would be a thousand string
         allocations a frame for the same result. */
      for (let i = 0; i < RINGS; i += 1) {
        const raw = i / RINGS + clock;
        const generation = Math.floor(raw);
        const u = raw - generation;

        const r = R_MIN * Math.pow(growth, u);
        const fs = FS_MIN * Math.pow(r / R_MIN, SPREAD);

        /*
         * Dim at the centre, full strength by the edge.
         *
         * This is what sells the depth: a ring is barely there when it is born
         * and arrives fully lit. It also keeps the middle of the section quiet
         * enough to put a block of type on.
         */
        const alpha = Math.min(1, 0.02 + Math.pow(u, 1.5) * 1.35);
        /* Below this a bone glyph on the near-black ground differs from it by
           under ten of 255, which is to say it is not on the screen. Skipping
           the newest ring and a half costs nothing anyone can see. */
        if (alpha < 0.045) continue;

        /*
         * Where the ring has turned to.
         *
         * A start angle it keeps for the whole pass, plus the accumulated
         * rotation for its age. Applied to the fixed grid by rotating the two
         * table values through the angle-sum identities — four multiplies a
         * glyph — rather than by calling `cos` and `sin` a thousand times a
         * frame, and without giving up the fixed grid that stopped the stutter.
         */
        const turn = noise(i, generation) * Math.PI * 2 + TURN_SCALE * Math.log1p(u);
        const cr = Math.cos(turn);
        const sr = Math.sin(turn);

        /* One sheet for the whole ring: every glyph on it is the same size. */
        const step = Math.min(
          atlases.length - 1,
          Math.max(0, Math.ceil(Math.log(fs / FS_MIN) / Math.log(ATLAS_RATIO))),
        );
        const atlas = atlases[step];
        if (!atlas) continue;

        /* At most a 13% reduction, never an enlargement — see `ATLAS_RATIO`. */
        const scale = fs / atlas.size;
        const halfW = atlas.w / 2;
        const halfH = atlas.h / 2;

        const offset = Math.floor(noise(generation, i) * chars.length);
        const reach = fs * 1.2;

        ctx.globalAlpha = alpha;

        for (let j = 0; j < SLOTS; j += 1) {
          const ca = COS[j]!;
          const sa = SIN[j]!;
          const c = ca * cr - sa * sr;
          const s = sa * cr + ca * sr;
          const x = cx + c * r;
          const y = cy + s * r;

          /* The outer rings are mostly off-screen; skipping them here is what
             keeps this at a thousand blits a frame rather than two. */
          if (x < -reach || x > width + reach || y < -reach || y > height + reach) continue;

          const index = cell.get(chars[(offset + j) % chars.length] ?? ' ');
          if (index === undefined) continue;

          /*
           * The rotation, written straight into the matrix.
           *
           * Tangential and never flipped upright — the text at the top of a
           * ring reads upside down, which is what makes it a ring rather than
           * words arranged in a circle. Rotating by `angle + 90°` turns
           * (cos, sin) into (-sin, cos), so the matrix is the two numbers
           * already in hand, with the atlas reduction folded into the same
           * call. The sprite is already in device pixels, so only the
           * translation has to be scaled.
           */
          ctx.setTransform(-s * scale, c * scale, -c * scale, -s * scale, x * dpr, y * dpr);
          ctx.drawImage(
            atlas.sheet,
            index * atlas.w,
            0,
            atlas.w,
            atlas.h,
            -halfW,
            -halfH,
            atlas.w,
            atlas.h,
          );
        }
      }

      ctx.globalAlpha = 1;
    };

    const paintStill = () => {
      if (!resize()) return;
      /* A fixed point in the cycle rather than wherever the clock happens to
         be, so the still frame is the same picture every time. */
      draw(0.42);
    };

    if (still) {
      paintStill();
      const observer = new ResizeObserver(paintStill);
      observer.observe(canvas);
      return () => observer.disconnect();
    }

    let frame = 0;
    let running = false;
    let onScreen = false;
    let sized = false;
    let last = performance.now();
    let clock = 0;

    const loop = (now: number) => {
      /*
       * Clamped at both ends. The lower clamp is not paranoia — a backwards
       * timestamp would run the tunnel inside out for a frame — and the upper
       * one stops a tab that has been away for a minute from jumping the whole
       * field forward the instant it comes back.
       */
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;

      clock += RATE * dt;
      draw(clock);
      if (running) frame = requestAnimationFrame(loop);
    };

    /* Two conditions, both of which can arrive in either order: the element has
       to have a size, and it has to be somewhere a person could see it. */
    const start = () => {
      if (running || !sized || !onScreen) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
    };

    /**
     * Take a size, and repaint at it.
     *
     * This used to be a bare `if (!resize()) return;` before any observer was
     * attached, which is a permanent blank band the first time an element has
     * no box at effect time — and it does: a section that has not been laid out
     * yet, an ancestor still `display:none`, a tab restored in the background.
     * The effect gave up and, having installed nothing, never tried again.
     *
     * Now the observers go on first and this is the only path that sizes
     * anything, so the first successful measurement — whenever it turns up —
     * is what starts the tunnel.
     *
     * It also repaints, which the old resize handler did not. Assigning
     * `canvas.width` wipes the buffer, so a resize while the loop is stopped
     * left the band empty until something else happened to redraw it.
     */
    const sync = () => {
      if (!resize()) return;
      const first = !sized;
      sized = true;
      /* One frame straight away rather than on the next animation frame: the
         tunnel is correct from the first paint, and it is a picture rather than
         a hole in a tab the browser has throttled rAF in. */
      draw(first ? 0 : clock);
      start();
    };

    const sizeWatcher = new ResizeObserver(sync);
    sizeWatcher.observe(canvas);

    /* Off-screen, stop entirely. This is the most expensive thing on the page
       and most of it is below the fold. */
    const seen = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry!.isIntersecting;
        if (onScreen) start();
        else stop();
      },
      { rootMargin: '160px' },
    );
    seen.observe(canvas);

    sync();

    return () => {
      stop();
      seen.disconnect();
      sizeWatcher.disconnect();
    };
  }, [stream, still]);

  return (
    /*
     * Night in both themes, the same way the hero is: `dark` is a plain class
     * selector, so putting it here redeclares the tokens for this subtree and
     * every child corrects itself. A tunnel of pale text needs a dark room, and
     * this one cannot borrow the page's.
     */
    <section className="dark relative isolate overflow-hidden border-b border-edge bg-canvas text-body">
      <div className="relative h-[36rem] w-full sm:h-[42rem]">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />

        {/* The dot field the rings travel through. Under the type, over the
            ground, and fixed rather than themed — it belongs to the effect. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-halftone text-edge opacity-[0.10]"
        />

        {/*
         * The one solid object in the room.
         *
         * A block with a border and a hard shadow, floated over the quiet
         * middle of the tunnel — the house move, and the only way to put a
         * sentence on top of a thousand moving glyphs and still have it read.
         */}
        <div className="absolute inset-0 grid place-items-center px-4">
          <div className="max-w-md rounded-slab border border-edge bg-canvas/95 p-6 text-center shadow-hard sm:p-8">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Everything that has shipped here
            </p>
            <h2 className="mt-2 display-tight text-3xl uppercase text-balance sm:text-4xl">
              {total ? `${formatNumber(total)} launches` : 'The whole board'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
              Every name going past is a real one. Somebody built it, posted it here, and waited to
              see what the board made of it.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink to="/discover">Browse them all</ButtonLink>
              <ButtonLink to="/submit" variant="secondary">
                Add yours
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
