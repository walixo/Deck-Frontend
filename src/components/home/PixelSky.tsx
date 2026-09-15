import { useEffect, useRef } from 'react';
import {
  BIRD,
  drawBird,
  drawSprite,
  fitCanvas,
  isDark,
  noise,
  readPalette,
  SPRITES,
  STAGE,
  type Palette,
} from '@/lib/pixel';

/**
 * A starfield, with birds and a small arcade drifting through it.
 *
 * The brief was "something like thejasminejade.com" — pixel-art shapes crossing
 * a sky. What is borrowed is the technique, not the artwork: a fixed virtual
 * pixel grid, hash noise instead of `Math.random` so the layout is stable, and
 * time that advances in visible steps rather than smoothly. The shapes, the
 * palette and the bird are Deck's, and they live in `lib/pixel` because the
 * game on `/games` draws the same cast.
 *
 * It is deliberately quiet, because the last two things put behind this
 * headline were removed for being chaotic. Nothing that moves crosses the
 * headline — the stars are the one exception, and they hold still and shrink to
 * a single pixel where they pass behind it — and everything is drawn at well
 * under full strength.
 *
 * The tetrominoes are gone. They were the large hollow half of the scene and
 * the only part that read as texture rather than as characters — with them out,
 * what is left is a cast rather than a pattern.
 *
 * The stars are the layer that makes it a sky rather than a blank field, and
 * they are pale, full stop.
 *
 * They used to carry a colour per theme, because a fixed hex can be legible on
 * both canvases but a *star* cannot — pale on near-black and pale on white are
 * not the same picture, and the light version was a scatter of dark dots that
 * read as a star map rather than as space. The hero settled that by becoming a
 * dark island in both themes (see `Hero.tsx`), so there is one canvas here now
 * and one set of stars.
 *
 * The other colours are fixed rather than read from the palette. Everything else on
 * Deck follows the active palette, and under a monochrome one this sky went
 * grey along with it — but these are the one decorative thing on the site whose
 * whole job is to be a bit of life, and life is not a palette decision. Each
 * hex is chosen to be visible on a white canvas and on a near-black one, since
 * unlike a token it cannot swap per theme.
 */

/**
 * The six things that cross the hero.
 *
 * Named explicitly rather than typed as `'bird' | SpriteName`. The shared
 * sprite set also holds the games' own pieces — a robot, a car, falling scrap —
 * and none of those belong in the sky; spelling the cast out means adding one
 * to `lib/pixel` for a game cannot quietly make it eligible here, and the
 * colour table below is exhaustive by construction.
 */
type CastKind = 'bird' | 'invader' | 'saucer' | 'heart' | 'sparkle' | 'pong';

/** A bird, or one of the arcade sprites. Everything small that crosses. */
interface Flyer {
  kind: CastKind;
  x: number;
  y: number;
  speed: number;
  scale: number;
  /** Full height in stage units, after scale. Used to keep it out of the band. */
  height: number;
  /** True when no band at this viewport is tall enough to hold it. */
  hidden: boolean;
  /** Puts each one on its own point in the flap loop, so they are not a rank. */
  phase: number;
}

/**
 * The cast's own colours, which no palette touches.
 *
 * Mid-luminance on purpose: a fixed colour has to survive both canvases, and
 * these run from 2.16:1 to 4.35:1 against white and 4.20:1 to 8.47:1 against
 * the dark canvas — visible on either without ever being loud enough to
 * compete with a launch.
 */
const COLOURS: Record<CastKind, string> = {
  bird: '#e0663c',
  invader: '#3f9e5e',
  saucer: '#2f8f9d',
  heart: '#d94a63',
  sparkle: '#d3961f',
  pong: '#7c5cff',
};

/** The bird's beak and eye. Warmer than its body, so the face still reads. */
const BEAK = '#e8a33d';

/**
 * One star. Positions are normalised, not in stage units.
 *
 * The hero's box changes height whenever the headline rewraps, and stage width
 * tracks the viewport. Storing 0..1 and multiplying at draw time means a resize
 * moves the field with the box instead of re-rolling it — the sky you scrolled
 * away from is the sky you scroll back to.
 */
interface Star {
  nx: number;
  ny: number;
  /** 0 dim single pixel, 1 a two-pixel block, 2 a four-armed cross. */
  tier: 0 | 1 | 2;
  /** Which tint a tier-2 star wears. Ignored below that. */
  tint: number;
  /** Ticks between winks, and where in that cycle this star sits. */
  cycle: number;
  offset: number;
}

/**
 * The pool, and how much sky one star is worth.
 *
 * Density rather than a count: the hero is 327 stage units tall on a desktop
 * and better than twice that on a phone with a four-line headline, and a fixed
 * count would be a scatter on one and a crowd on the other. One star per 2,600
 * square units is roughly one per 51x51 box, which lands near 120 on a laptop.
 *
 * The pool is drawn from front to back, and every star's position is an
 * independent sample, so any prefix of it is still an even scatter — the count
 * can move with the viewport without disturbing the stars already placed.
 */
const STAR_POOL = 320;
const STAR_AREA = 2600;
const STAR_MIN = 24;

/** The ordinary star. Warm rather than pure white: a field of #ffffff pinpricks
    reads as dust on the lens. */
const STAR_INK = '#f4f1e8';

/* Only the crosses are tinted, and only three ways. Real starfields are nearly
   colourless with the occasional blue or amber giant; tinting the whole field
   would read as confetti. */
const STAR_TINTS = ['#ffffff', '#9fc4e8', '#e8c48a'] as const;

/** Strength per tier: dim pixel, block, cross. */
const STAR_ALPHA = [0.34, 0.55, 0.82] as const;

/** How far a star dims where it passes behind the headline. */
const STAR_BEHIND = 0.7;

export function PixelSky({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /*
     * The palette, re-read whenever the theme actually changes on the document.
     *
     * Sampling it once when the effect runs looked obvious and was wrong: child
     * effects run before parent effects, so this component reads
     * `getComputedStyle` before ThemeProvider — its ancestor — has put the
     * `dark` class on `<html>`. It therefore always saw the *previous* theme,
     * and on a first load in dark mode painted near-black ink onto a near-black
     * canvas, i.e. nothing.
     *
     * Watching the class instead of a React value removes the ordering question
     * altogether, and means a theme flip no longer tears the effect down and
     * restarts the scene from its opening positions.
     */
    let paletteIsDark: boolean | null = null;
    let palette: Palette = readPalette(canvas);

    const syncPalette = () => {
      if (isDark() === paletteIsDark) return;
      paletteIsDark = isDark();
      palette = readPalette(canvas);
    };

    /* Scale is quantised to eighths so a stage unit lands on a whole number of
       device pixels. Without that, every edge in the scene is a half-pixel out
       and the whole thing renders soft — which is the one thing pixel art
       cannot survive. */
    let n = 1;
    let stageW = 0;
    let stageH = 0;
    /* How much of the pool this viewport is worth. Set in `resize`. */
    let starCount = 0;
    /* The headline's band, in stage units. Nothing is drawn between these. */
    let keepFrom = 0;
    let keepTo = 0;

    const resize = () => {
      const fit = fitCanvas(canvas, ctx);
      if (!fit) return;
      n = fit.scale;
      stageW = fit.width;
      stageH = fit.height;
      starCount = Math.max(
        STAR_MIN,
        Math.min(STAR_POOL, Math.round((stageW * stageH) / STAR_AREA)),
      );

      /*
       * Measure the headline rather than assume where it is.
       *
       * The first version placed a top and a bottom band at fixed fractions of
       * the canvas and got away with it only because there were seven objects
       * and none happened to land badly. Adding the arcade broke it
       * immediately — 1512 pixels of sprite behind the words. Fractions were
       * never a constraint, just a lucky arrangement, so the keep-out is now
       * taken from the element itself and holds at any viewport.
       */
      const mark = canvas.parentElement?.querySelector('[data-sky-keepout]');
      if (mark) {
        const box = mark.getBoundingClientRect();
        const own = canvas.getBoundingClientRect();
        /* CSS pixels to stage units: the canvas spans `own.height` on screen
           and `fit.height` in stage space, so one ratio converts both edges. */
        const perCssPx = fit.height / own.height;
        keepFrom = (box.top - own.top) * perCssPx;
        keepTo = (box.bottom - own.top) * perCssPx;
      } else {
        keepFrom = stageH * 0.2;
        keepTo = stageH * 0.62;
      }
    };

    resize();

    /*
     * Everything rides above the headline, never across it.
     *
     * The headline is the reason anyone is looking at this section. Shapes
     * drifting behind it would be read as part of it, and a moving thing behind
     * type is the definition of hard to read — so the sky opens above the words
     * and closes below them, and never crosses.
     */
    /*
     * The field, rolled once and never again.
     *
     * `noise` rather than `Math.random`, for the same reason the rest of the
     * scene uses it: two people opening the page see the same sky, and a
     * remount does not reshuffle the one thing on the page that ought to look
     * permanent.
     *
     * Tiers are 68 / 25 / 7. Weighting it towards the dim end is what makes a
     * scatter of dots read as distance — an even split across three sizes reads
     * as a pattern, because nothing that far away is that uniformly bright.
     */
    const stars: Star[] = Array.from({ length: STAR_POOL }, (_, i) => {
      const roll = noise(i, 13);
      /* Never 0: at tick zero — reduced motion, or the very first paint — a
         star with no offset would be caught mid-wink and simply never appear. */
      const cycle = 20 + Math.floor(noise(i, 23) * 37);
      return {
        nx: noise(i, 3),
        ny: noise(i, 7),
        tier: roll < 0.68 ? 0 : roll < 0.93 ? 1 : 2,
        tint: Math.floor(noise(i, 19) * 3),
        cycle,
        offset: 1 + Math.floor(noise(i, 29) * (cycle - 1)),
      };
    });

    /*
     * The flyers, spread across the whole stage width so they arrive spaced out
     * rather than as a formation.
     *
     * Ordered slowest to fastest and given a scale each, which is the only
     * depth cue here: the big saucer crawls, the small bird darts, and nothing
     * is drawn in front of anything else because nothing overlaps for long.
     */
    const CAST: { kind: CastKind; scale: number; speed: number; y: number }[] = [
      { kind: 'bird', scale: 2, speed: 74, y: 26 },
      { kind: 'bird', scale: 1, speed: 96, y: 52 },
      { kind: 'invader', scale: 2, speed: 34, y: 34 },
      { kind: 'saucer', scale: 2, speed: 44, y: 18 },
      { kind: 'heart', scale: 2, speed: 52, y: 60 },
      { kind: 'sparkle', scale: 2, speed: 28, y: 40 },
      { kind: 'pong', scale: 2, speed: 60, y: 68 },
    ];

    const flyers: Flyer[] = CAST.map((entry, i) => ({
      kind: entry.kind,
      x: -40 + (STAGE + 240) * ((i + noise(i, 11) * 0.6) / CAST.length),
      y: 0,
      speed: entry.speed,
      scale: entry.scale,
      height: (entry.kind === 'bird' ? BIRD.height : SPRITES[entry.kind].length) * entry.scale,
      hidden: false,
      phase: noise(i, 9) * Math.PI * 2,
    }));

    /*
     * Hangs everything inside whichever band it belongs to.
     *
     * Runs on every resize, because both bands are defined by the headline's
     * measured position and that moves whenever the line rewraps. Each object
     * is placed by its full box rather than its origin — the difference between
     * "the top of this sprite clears the words" and "all of it does".
     */
    const PAD = 8;
    const settle = () => {
      /*
       * Returns null when the band cannot hold the object at this viewport.
       *
       * An earlier version pinned it to the top of the band instead and let it
       * clip, which on a 390px screen — where a four-line headline leaves
       * almost nothing above it — put 1827 pixels of sprite straight through
       * the words. Dropping the object is the right answer: on a phone the
       * hero is the headline, and an empty sky is better than a decorated one
       * that is hard to read.
       */
      const place = (i: number, height: number, band: 'top' | 'bottom') => {
        const from = band === 'top' ? PAD : keepTo + PAD;
        const to = (band === 'top' ? keepFrom : stageH) - PAD - height;
        if (to <= from) return null;
        return from + noise(i, 4) * (to - from);
      };

      flyers.forEach((flyer, i) => {
        /* Flyers all ride the upper band: they are the fast-moving things, and
           fast movement beside body copy is worse than above a headline. */
        const y = place(i + 40, flyer.height, 'top');
        flyer.hidden = y === null;
        flyer.y = y ?? 0;
      });
    };

    /**
     * The starfield, painted before anything crosses it.
     *
     * Stars are the one layer allowed behind the headline. The keep-out exists
     * because a moving shape behind type is unreadable — a single pixel that
     * holds still is not that, and a starfield with a rectangular hole punched
     * through the middle of it stops being a sky and starts being a mistake.
     * So the rule is kept where it matters: inside the band every star drops to
     * one pixel, loses its tint, stops winking and dims further.
     */
    const drawStars = () => {
      for (let i = 0; i < starCount; i += 1) {
        const star = stars[i];
        /* Rounded to whole stage units. A star on a half unit is two dim
           pixels instead of one bright one, which is the whole field going
           soft. */
        const x = Math.round(star.nx * stageW);
        const y = Math.round(star.ny * stageH);
        const behind = y >= keepFrom - PAD && y <= keepTo + PAD;

        /* Off for one tick in twenty-odd. A wink, not a fade: nothing in this
           system tweens, and a star that ramps down reads as a dimmer being
           turned rather than as air moving in front of it. */
        if (!behind && star.tier > 0 && (flapTick + star.offset) % star.cycle === 0) continue;

        const tier = behind ? 0 : star.tier;
        ctx.globalAlpha = STAR_ALPHA[tier] * (behind ? STAR_BEHIND : 1);
        ctx.fillStyle = tier === 2 ? STAR_TINTS[star.tint] : STAR_INK;

        if (tier === 2) {
          /* A four-armed cross, five units across. The only shape here that is
             recognisably a star rather than a dot, which is why there are so
             few of them. */
          ctx.fillRect(x, y - 2, 1, 5);
          ctx.fillRect(x - 2, y, 5, 1);
        } else {
          const size = tier + 1;
          ctx.fillRect(x, y, size, size);
        }
      }

      ctx.globalAlpha = 1;
    };

    const drawFlyer = (flyer: Flyer, up: boolean) => {
      if (flyer.kind === 'bird') {
        drawBird(ctx, {
          x: flyer.x,
          y: flyer.y,
          scale: flyer.scale,
          up,
          /* `canvas` is the eye: a hole punched in the head has to match what
             is behind the head. Read off the canvas element rather than off the
             document, so it resolves to the hero's own dark ground and not to
             the light page the hero sits on. The body and beak follow nothing. */
          palette: { ink: COLOURS.bird, accent: BEAK, canvas: palette.canvas },
          alpha: 0.62,
          detail: 0.85,
        });
        return;
      }
      /* The sparkle is the one thing that does not simply drift: it blinks off
         for a beat now and then, which is what makes it read as a twinkle
         rather than as a plus sign sliding across the page. */
      if (flyer.kind === 'sparkle' && Math.sin(flyer.phase + flyer.x * 0.05) < -0.55) return;
      /* Below the bird's 0.5 — these are set dressing, and the bird is the
         thing that is actually meant to catch an eye. */
      drawSprite(ctx, SPRITES[flyer.kind], {
        x: flyer.x,
        y: flyer.y,
        scale: flyer.scale,
        colour: COLOURS[flyer.kind],
        /* Below the bird's, still — these are set dressing, and the bird is the
           thing actually meant to catch an eye. */
        alpha: 0.45,
      });
    };

    const draw = (flapUp: (flyer: Flyer) => boolean) => {
      /* One boolean compare per frame; `getComputedStyle` only on a real
         change. */
      syncPalette();
      ctx.clearRect(0, 0, canvas.width / n, stageH);
      drawStars();
      for (const flyer of flyers) if (!flyer.hidden) drawFlyer(flyer, flapUp(flyer));
    };

    /* Wings change ten times a second, not sixty. Stepped time is what reads as
       pixel art; interpolated wings read as a smooth canvas demo. */
    let flapTick = 0;
    const flap = (flyer: Flyer) => Math.sin(flapTick * 0.9 + flyer.phase) > 0;

    settle();

    /* One frame straight away, before any animation frame is asked for. The
       scene is then correct from the first paint rather than a frame late, and
       it still renders in a tab the browser has throttled rAF in. */
    draw(flap);

    /*
     * Repaint the moment the theme changes, rather than waiting for the next
     * animation frame.
     *
     * Not an optimisation — a correctness fix for the two states where there is
     * no next frame: reduced motion, where the loop never starts, and a hero
     * scrolled out of view, where the observer below has cancelled it. Without
     * this, a theme flip in either state leaves the previous theme's ink on the
     * canvas.
     */
    const themed = new MutationObserver(() => draw(flap));
    themed.observe(document.documentElement, { attributeFilter: ['class'] });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      /* Held on that frame: the global CSS rule that flattens animations
         cannot reach a canvas, so the loop is simply never started. */
      const still = () => {
        resize();
        settle();
        draw(flap);
      };
      const observer = new ResizeObserver(still);
      observer.observe(canvas);
      return () => {
        observer.disconnect();
        themed.disconnect();
      };
    }

    let frame = 0;
    let last = performance.now();
    let running = true;
    let flapClock = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      flapClock += dt;
      while (flapClock >= 0.1) {
        flapClock -= 0.1;
        flapTick += 1;
      }

      for (const flyer of flyers) {
        flyer.x -= flyer.speed * dt;
        if (flyer.x < -60) flyer.x = STAGE + 40 + noise(flapTick, flyer.y) * 160;
      }

      draw(flap);
      if (running) frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);

    /* Off-screen, stop entirely. The hero scrolls away within one screen and a
       canvas repainting behind the fold is pure battery. */
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          last = performance.now();
          frame = requestAnimationFrame(loop);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(frame);
        }
      },
      { rootMargin: '120px' },
    );
    seen.observe(canvas);

    const sized = new ResizeObserver(() => {
      resize();
      settle();
      /* Repaint here, not on the next animation frame. Setting `canvas.width`
         inside `resize` clears the buffer, so without this the sky is blank
         from the resize until the next frame — and stays blank for good if the
         loop happens to be stopped. */
      draw(flap);
    });
    sized.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      seen.disconnect();
      sized.disconnect();
      themed.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
