import { useCallback, useEffect, useRef, useState } from 'react';
import { GameFrame, type GamePhase } from '@/components/games/GameFrame';
import { Leaderboard } from '@/components/games/Leaderboard';
import {
  readBest,
  useArcadeSound,
  useScoreReporter,
  writeBest,
} from '@/components/games/useArcade';
import {
  BIRD,
  CELL,
  drawBird,
  drawPiece,
  drawSprite,
  fitCanvas,
  overlaps,
  PIECES,
  pieceSize,
  SPRITES,
} from '@/lib/pixel';

/**
 * Sky Run — Deck's own game.
 *
 * The bird out of the hero, given something to do. Same sprites, same fixed
 * virtual pixel grid, same rule that nothing eases; the difference is that here
 * the cast is in the way rather than in the background, so everything is drawn
 * at full strength instead of at a tenth of it.
 *
 * Deliberately one screen and one mechanic. A launch board's arcade earns its
 * place by being the thing you play twice while a build runs, not by being a
 * second product — so there is no tutorial, no menu tree and no account: press
 * a key, dodge for ninety seconds, see if you beat the number.
 */

/** Where the bird sits. It never moves horizontally; the world moves past it. */
const BIRD_X = 96;

/** Drawn at three times the sprite, so 48x27 stage units. */
const BIRD_SCALE = 3;
const BIRD_W = BIRD.width * BIRD_SCALE;
const BIRD_H = BIRD.height * BIRD_SCALE;

/**
 * The hitbox, as a fraction of the drawn bird.
 *
 * Fractions, not a fixed unit count. It used to be `BIRD.width - 2*2` against a
 * sprite drawn at scale 2 — the *unscaled* size, so the hitbox was a quarter of
 * the bird and sat in its top-left corner. Combined with hazards that never
 * spawned in the top ten units, that produced a strip along the top of the
 * screen where nothing could ever touch you: park the bird there and the run
 * lasted forever.
 *
 * Keeping the inset proportional means the hitbox tracks the sprite whatever
 * scale it is drawn at, and this class of bug cannot come back by changing one
 * number.
 */
const INSET_X = 0.16;
const INSET_Y = 0.2;

/*
 * Sky Run's own board.
 *
 * It no longer follows the site theme, for the same reason Snakejo and Block
 * Drop do not: the obstacles need to be red and yellow to be told apart at
 * speed, and neither reads at 3:1 on a near-white surface. On its own dark
 * ground both are unmistakable, and the board matches the game's cabinet.
 */
const GROUND = '#2a2440';
const HAZARD_COLOURS = {
  /* Roughly two in five plain, then red, then yellow — enough colour to sort
     them at a glance, not so much that the field turns into confetti. */
  plain: '#f7f6f2',
  red: '#ff5d73',
  yellow: '#ffc65d',
} as const;
type HazardColour = keyof typeof HAZARD_COLOURS;

const SPARKLE_COLOUR = '#b8a9fa';
const HEART_COLOUR = '#7bf59a';

const START_SPEED = 175;
const MAX_SPEED = 1150;

/**
 * The ramp, which accelerates rather than climbs.
 *
 * It used to be linear at 5.5 units per second, which took two full minutes to
 * become interesting and never became hard — you could hold a line and watch a
 * build finish. Now there is a quadratic term, so the pressure compounds:
 *
 *   speed = 175 + 26·t + 1.35·t²
 *
 *      t=0s   175      t=45s  4088 → capped at 1150
 *      t=10s  570      the cap is reached at about 24 seconds
 *      t=20s  1235 → capped
 *
 * So the first ten seconds are a warm-up, the next ten are a real game, and
 * after that it is flat out and the only variable left is how tight the gaps
 * have become. A run is meant to end.
 */
const RAMP_LINEAR = 26;
const RAMP_SQUARED = 1.35;

const START_LIVES = 3;
const MAX_LIVES = 5;
/** Seconds of blinking immunity after a hit, so one mistake is not three. */
const MERCY = 1.4;

const HIGH_SCORE_KEY = 'deck-skyrun-best';

type Phase = GamePhase;

type HazardKind = 'piece' | 'invader' | 'saucer';
type PickupKind = 'sparkle' | 'heart';

interface Thing {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Per-object drift, so a wall of hazards is never a straight line. */
  bob: number;
  bobPhase: number;
}

interface Hazard extends Thing {
  kind: HazardKind;
  piece: number;
  colour: HazardColour;
  /**
   * Vertical speed, in stage units per second.
   *
   * Replaces a `sin` bob applied at draw time only. The hazard was *drawn*
   * bobbing and *collided* at its un-bobbed y, so for the ~45% that bobbed, the
   * thing on screen and the thing you could hit were up to 14 units apart.
   * Moving `y` itself in the step means there is only one position and the two
   * cannot disagree.
   */
  vy: number;
}

interface Pickup extends Thing {
  kind: PickupKind;
  taken: boolean;
}

interface Hud {
  score: number;
  lives: number;
  best: number;
}

export function SkyRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  /* Read once, lazily, rather than in an effect: an effect would render the
     board with a zero best and then immediately re-render with the real one,
     which both flickers and trips `react-hooks/set-state-in-effect`. */
  const [hud, setHud] = useState<Hud>(() => ({
    score: 0,
    lives: START_LIVES,
    best: readBest(HIGH_SCORE_KEY),
  }));
  const { sound, muted, toggleMuted } = useArcadeSound();
  const report = useScoreReporter('sky-run');

  /* The authoritative game lives in a ref, not in state. Sixty setState calls a
     second would re-render the page sixty times a second to move four numbers
     that only the canvas reads. React is told what to show, at ten hertz. */
  const startRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /*
     * No palette tracking here any more.
     *
     * Sky Run used to draw in `--edge` and re-read the theme whenever it
     * changed. It now owns its board — a fixed dark ground with red and yellow
     * obstacles — because neither of those colours reads at 3:1 on a near-white
     * surface, and telling hazards apart at speed is the point of colouring
     * them. Snakejo and Block Drop already work this way.
     */
    const INK = '#f7f6f2';
    const BIRD_PALETTE = { ink: INK, accent: '#ffc65d', canvas: GROUND };

    let worldW = 960;
    let worldH = 420;

    const resize = () => {
      const fit = fitCanvas(canvas, ctx);
      if (!fit) return;
      worldW = fit.width;
      worldH = fit.height;
    };
    resize();

    /* Every mutable thing about a run, in one object so restarting is one
       assignment rather than eight and cannot half-reset. */
    const game = {
      phase: 'idle' as Phase,
      y: worldH / 2,
      targetY: worldH / 2,
      speed: START_SPEED,
      elapsed: 0,
      score: 0,
      lives: START_LIVES,
      mercy: 0,
      spawnIn: 0.9,
      pickupIn: 2.2,
      hazards: [] as Hazard[],
      pickups: [] as Pickup[],
      flap: 0,
      flapClock: 0,
      /* Which ten-second band we are in, so the warning sting fires once. */
      tier: 0,
    };

    const reset = () => {
      game.y = worldH / 2 - BIRD_H / 2;
      game.targetY = worldH / 2 - BIRD_H / 2;
      game.speed = START_SPEED;
      game.elapsed = 0;
      game.score = 0;
      game.lives = START_LIVES;
      game.mercy = 0;
      game.spawnIn = 0.9;
      game.pickupIn = 2.2;
      game.hazards = [];
      game.pickups = [];
      game.tier = 0;
    };

    const spawnHazard = () => {
      const roll = Math.random();
      const kind: HazardKind = roll < 0.58 ? 'piece' : roll < 0.83 ? 'invader' : 'saucer';
      const piece = Math.floor(Math.random() * PIECES.length);

      let width: number;
      let height: number;
      if (kind === 'piece') {
        const size = pieceSize(piece);
        width = size.cols * CELL;
        height = size.rows * CELL;
      } else {
        const rows = SPRITES[kind];
        width = rows[0].length * 2;
        height = rows.length * 2;
      }

      const tint = Math.random();
      const colour: HazardColour = tint < 0.42 ? 'plain' : tint < 0.74 ? 'red' : 'yellow';

      game.hazards.push({
        kind,
        piece,
        colour,
        x: worldW + 30,
        /*
         * The whole column, edge to edge.
         *
         * The old range started at 10 and stopped 10 short of the floor, which
         * left a lane at the top and the bottom that nothing ever entered. The
         * top one was reachable and permanently safe.
         */
        y: Math.random() * Math.max(1, worldH - height),
        width,
        height,
        /* Half of them cross the screen at an angle, so no horizontal line is
           safe for long either. */
        vy: Math.random() < 0.5 ? (Math.random() - 0.5) * 90 : 0,
        bob: 0,
        bobPhase: 0,
      });
    };

    const spawnPickup = () => {
      /* Hearts are rare and only worth spawning when they can be used. */
      const wantsHeart = game.lives < MAX_LIVES && Math.random() < 0.28;
      const kind: PickupKind = wantsHeart ? 'heart' : 'sparkle';
      const rows = SPRITES[kind];
      const width = rows[0].length * 2;
      const height = rows.length * 2;

      game.pickups.push({
        kind,
        x: worldW + 30,
        y: 10 + Math.random() * Math.max(10, worldH - height - 20),
        width,
        height,
        bob: 6 + Math.random() * 10,
        bobPhase: Math.random() * Math.PI * 2,
        taken: false,
      });
    };

    /** The bird's box for collision: the drawn box, pulled in proportionally. */
    const birdBox = () => ({
      x: BIRD_X + BIRD_W * INSET_X,
      y: game.y + BIRD_H * INSET_Y,
      width: BIRD_W * (1 - INSET_X * 2),
      height: BIRD_H * (1 - INSET_Y * 2),
    });

    const hazardHit = (hazard: Hazard, box: ReturnType<typeof birdBox>) => {
      if (hazard.kind !== 'piece') return overlaps(box, hazard);
      /*
       * Tetrominoes are tested cell by cell, not by their bounding box.
       *
       * An L piece is four cells in a six-cell box, so a third of its box is
       * empty air. Dying in that air is the single most annoying thing a game
       * of this shape can do, and it is entirely avoidable for four
       * comparisons.
       */
      for (const [cx, cy] of PIECES[hazard.piece]) {
        if (
          overlaps(box, {
            x: hazard.x + cx * CELL,
            y: hazard.y + cy * CELL,
            width: CELL,
            height: CELL,
          })
        ) {
          return true;
        }
      }
      return false;
    };

    const step = (dt: number) => {
      game.elapsed += dt;
      const t = game.elapsed;
      game.speed = Math.min(MAX_SPEED, START_SPEED + t * RAMP_LINEAR + t * t * RAMP_SQUARED);

      /*
       * The engine follows the speed, and a sting marks each new ten.
       *
       * Sound is the only channel that can say "this is getting away from you"
       * without taking your eyes off the bird, which is exactly when you cannot
       * afford to read a number.
       */
      sound.engine((game.speed - START_SPEED) / (MAX_SPEED - START_SPEED));
      const tier = Math.floor(t / 10);
      if (tier > game.tier) {
        game.tier = tier;
        sound.levelUp();
      }

      /* Distance is the base score, so simply staying alive counts. */
      game.score += game.speed * dt * 0.05;
      if (game.mercy > 0) game.mercy -= dt;

      /* Chase the pointer rather than snap to it: instant tracking makes the
         bird feel like a cursor, and a cursor cannot be dodged with. */
      game.y += (game.targetY - game.y) * Math.min(1, dt * 14);
      game.y = Math.max(0, Math.min(worldH - BIRD_H, game.y));

      game.spawnIn -= dt;
      if (game.spawnIn <= 0) {
        spawnHazard();
        /*
         * Gaps shrink faster than before, and the floor is lower.
         *
         * Speed alone does not make a dodging game hard — it makes it a
         * reaction test with the same amount of empty air. Closing the gaps at
         * the same time is what turns the late run into a real wall. The floor
         * is 0.26s, which at the capped speed is still about 300 units of
         * clearance: tight, and passable.
         */
        /* A second one, at a different height, a third of the time once the
           run is properly going — density as well as speed. */
        if (game.elapsed > 6 && Math.random() < 0.33) spawnHazard();
        const base = Math.max(0.22, 0.78 - game.elapsed * 0.032);
        game.spawnIn = base + Math.random() * base * 0.5;
      }

      game.pickupIn -= dt;
      if (game.pickupIn <= 0) {
        spawnPickup();
        game.pickupIn = 2.4 + Math.random() * 2.6;
      }

      const box = birdBox();

      for (const hazard of game.hazards) {
        hazard.x -= game.speed * dt;
        if (hazard.vy) {
          hazard.y += hazard.vy * dt;
          /* Bounce rather than drift off — a hazard that leaves the top of the
             board is a free gap the player did not earn. */
          if (hazard.y < 0 || hazard.y > worldH - hazard.height) hazard.vy *= -1;
          hazard.y = Math.max(0, Math.min(worldH - hazard.height, hazard.y));
        }
        if (game.mercy <= 0 && hazardHit(hazard, box)) {
          game.lives -= 1;
          game.mercy = MERCY;
          sound.crash();
          /* The thing that hit you leaves, so you are not hit again by it while
             blinking and then a third time on the way out. */
          hazard.x = -999;
          if (game.lives <= 0) {
            sound.engineOff();
            sound.gameOver();
            game.phase = 'over';
            const best = Math.max(readBest(HIGH_SCORE_KEY), Math.floor(game.score));
            writeBest(HIGH_SCORE_KEY, best);
            setPhase('over');
            setHud({ score: Math.floor(game.score), lives: 0, best });
            report(Math.floor(game.score));
          }
        }
      }
      game.hazards = game.hazards.filter((h) => h.x > -120);

      for (const pickup of game.pickups) {
        pickup.x -= game.speed * dt;
        if (!pickup.taken && overlaps(box, pickup)) {
          pickup.taken = true;
          if (pickup.kind === 'heart') {
            game.lives = Math.min(MAX_LIVES, game.lives + 1);
            sound.bonus();
          } else {
            game.score += 120;
            sound.pickup();
          }
        }
      }
      game.pickups = game.pickups.filter((p) => p.x > -120 && !p.taken);
    };

    const draw = () => {
      ctx.fillStyle = GROUND;
      ctx.fillRect(0, 0, worldW, worldH);

      for (const hazard of game.hazards) {
        const y = hazard.y;
        const colour = HAZARD_COLOURS[hazard.colour];
        if (hazard.kind === 'piece') {
          /* Full strength here, unlike the hero: these are obstacles, and an
             obstacle you have to squint at is a bug. */
          drawPiece(ctx, hazard.piece, hazard.x, y, colour, { fill: 0.2, stroke: 1 });
        } else {
          drawSprite(ctx, SPRITES[hazard.kind], {
            x: hazard.x,
            y,
            scale: 2,
            colour,
          });
        }
      }

      for (const pickup of game.pickups) {
        /* Pickups keep their gentle bob — nothing collides with a hazard's
           position here, and a moving sparkle is easier to spot. Collision uses
           `pickup.y`, and the bob is small enough not to matter for something
           you are trying to touch rather than avoid. */
        const y = pickup.y + Math.sin(pickup.bobPhase + pickup.x * 0.02) * pickup.bob;
        drawSprite(ctx, SPRITES[pickup.kind], {
          x: pickup.x,
          y,
          scale: 2,
          /* Green and lavender: nothing a hazard is, so "take this" reads
             without having to recognise the shape. */
          colour: pickup.kind === 'heart' ? HEART_COLOUR : SPARKLE_COLOUR,
        });
      }

      /* Blink through the mercy window: visible on, invisible off, in steps. */
      const blinking = game.mercy > 0 && Math.floor(game.mercy * 12) % 2 === 0;
      if (!blinking) {
        drawBird(ctx, {
          x: BIRD_X,
          y: game.y,
          /* Must stay `BIRD_SCALE`: the hitbox is derived from it, and a
             literal here would size the two differently — which is the bug
             that created the safe strip along the top in the first place. */
          scale: BIRD_SCALE,
          up: game.flap % 2 === 0,
          palette: BIRD_PALETTE,
          alpha: 1,
          /* Full strength, not the 0.85 default. That default exists so the
             hero's decorative birds sit back; the player's bird is the one
             thing on the board that should be crisp. */
          detail: 1,
        });
      }
    };

    /* One frame before any animation frame is asked for, so the board is drawn
       the moment it mounts rather than 16ms later — and so it is drawn at all
       in a tab where the browser has parked rAF. */
    draw();

    let frame = 0;
    let last = performance.now();
    let hudClock = 0;

    const loop = (now: number) => {
      /*
       * Clamped at both ends.
       *
       * The ceiling is the one that matters day to day: a backgrounded tab
       * returns with a gap of seconds, and an unclamped delta teleports every
       * hazard straight through the bird in a single frame.
       *
       * The floor is cheap insurance. Frame timestamps are meant to be
       * monotonic, but a negative delta would run the whole simulation
       * backwards — hazards retreating, the clock unwinding — and one
       * `Math.max` is a better answer than trusting every browser.
       */
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;

      if (game.phase === 'playing') {
        game.flapClock += dt;
        while (game.flapClock >= 0.1) {
          game.flapClock -= 0.1;
          game.flap += 1;
        }
        step(dt);

        hudClock += dt;
        if (hudClock >= 0.1 && game.phase === 'playing') {
          hudClock = 0;
          setHud((current) => {
            const score = Math.floor(game.score);
            if (current.score === score && current.lives === game.lives) return current;
            return { ...current, score, lives: game.lives };
          });
        }
      }

      draw();
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);

    const start = () => {
      /* Only ever reached from a click or a keypress, which is the one moment a
         browser will let an AudioContext start. */
      sound.resume();
      reset();
      game.phase = 'playing';
      setPhase('playing');
      setHud({ score: 0, lives: START_LIVES, best: readBest(HIGH_SCORE_KEY) });
    };
    startRef.current = start;

    /* ------------------------------------------------------------ input */
    const pointerY = (clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const ratio = worldH / rect.height;
      game.targetY = (clientY - rect.top) * ratio - BIRD_H / 2;
    };

    const onPointer = (event: PointerEvent) => {
      if (game.phase !== 'playing') return;
      pointerY(event.clientY);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        if (game.phase !== 'playing') {
          event.preventDefault();
          start();
        }
        return;
      }
      if (game.phase !== 'playing') return;
      const up = event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W';
      const down = event.key === 'ArrowDown' || event.key === 's' || event.key === 'S';
      if (!up && !down) return;
      /* Arrows would otherwise scroll the page out from under the game. */
      event.preventDefault();
      game.targetY = Math.max(0, Math.min(worldH - BIRD.height, game.targetY + (up ? -48 : 48)));
    };

    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);

    const sized = new ResizeObserver(() => {
      resize();
      draw();
    });
    sized.observe(canvas);

    const themed = new MutationObserver(draw);
    themed.observe(document.documentElement, { attributeFilter: ['class'] });

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
      sized.disconnect();
      startRef.current = null;
    };
  }, [sound, report]);

  const start = useCallback(() => startRef.current?.(), []);

  return (
    <GameFrame
      canvasRef={canvasRef}
      phase={phase}
      title="Sky Run"
      aspect="960/420"
      readouts={[
        { label: 'Score', value: hud.score.toLocaleString() },
        { label: 'Best', value: hud.best.toLocaleString() },
      ]}
      status={{
        label: 'Lives',
        value: phase === 'idle' ? '—' : '\u2665'.repeat(hud.lives) || 'none',
      }}
      idleBlurb="Move the pointer to fly. Dodge the blocks, take the sparkles, and grab a heart when you see one. It gets faster — quickly."
      overTitle="Down you go"
      overBlurb={
        <>
          You scored <strong>{hud.score.toLocaleString()}</strong>
          {hud.score >= hud.best && hud.score > 0
            ? ' — a new best.'
            : `. Your best is ${hud.best.toLocaleString()}.`}
        </>
      }
      hint="Pointer or ↑ ↓ / W S to fly · space to start · scores are kept on this device only"
      onStart={start}
      muted={muted}
      onToggleMute={toggleMuted}
      aside={<Leaderboard slug="sky-run" />}
      /* Its own board, like the other two. The obstacle reds and yellows do
           not reach 3:1 on the site's near-white surface, and being able to
           sort hazards by colour at speed is the whole reason they have one. */
      boardClassName="bg-[#2a2440]"
      scrimClassName="bg-[#2a2440]/92 text-[#f2f0ff]"
    />
  );
}
