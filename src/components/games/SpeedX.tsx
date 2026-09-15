import { useCallback, useEffect, useRef, useState } from 'react';
import { GameFrame, type GamePhase } from '@/components/games/GameFrame';
import { Leaderboard } from '@/components/games/Leaderboard';
import {
  readBest,
  useArcadeSound,
  useScoreReporter,
  writeBest,
} from '@/components/games/useArcade';
import { drawSprite, fitCanvas, overlaps, SPRITES } from '@/lib/pixel';

/**
 * Speed X — a road, some traffic, and no second chances.
 *
 * The other three give you lives. This one does not: one touch ends the run,
 * which is what makes a racing game a racing game. A car that can be hit three
 * times is a car with nothing at stake, and the whole tension of overtaking at
 * speed comes from the cost of getting it wrong.
 *
 * Score is distance, in metres, exactly as asked. Nothing else adds to it —
 * there are no pickups and no combo, so the only way to a bigger number is to
 * stay on the road longer while the road gets faster.
 */

/* Its own board, like the rest of the arcade. Asphalt needs to be dark for the
   lane markings to read, and the traffic needs saturated colour to be sorted at
   speed — neither works on the site's near-white surface. */
const ASPHALT = '#16161d';
const VERGE = '#232a1c';
const KERB_LIGHT = '#f7f6f2';
const KERB_DARK = '#ff5d73';
const LANE_PAINT = '#e8e6dd';
const PLAYER = '#4fc3f7';
const PLAYER_TRIM = '#ffffff';

/** Traffic colours. Never the player's cyan — you must always find yourself. */
const TRAFFIC = ['#ff5d73', '#ffc65d', '#7bf59a', '#b8a9fa', '#ff8a3d'] as const;

const LANES = 5;
/** How much of the board is road; the rest is verge on both sides. */
const ROAD_FRACTION = 0.74;

const CAR_SCALE = 4;
const CAR_W = SPRITES.car[0].length * CAR_SCALE; // 36
const CAR_H = SPRITES.car.length * CAR_SCALE; // 48

/** Metres per second at the start, and the ceiling. */
const START_SPEED = 260;
const MAX_SPEED = 1500;
/* Same compounding shape as the rest of the arcade: a warm-up, then it gets
   away from you. Reaches the cap at about 26 seconds. */
const RAMP_LINEAR = 22;
const RAMP_SQUARED = 1.35;

/** How fast the car slides between lanes. Not instant — this is a car. */
const STEER_SPEED = 620;

/**
 * The hitbox, as a fraction of the drawn car.
 *
 * Proportional, never a fixed unit count. Sky Run had a hitbox sized against
 * an unscaled sprite and it produced a lane where nothing could touch you; the
 * fix there and the rule here are the same.
 */
const INSET_X = 0.18;
const INSET_Y = 0.12;

const HIGH_SCORE_KEY = 'deck-speedx-best';

interface Traffic {
  lane: number;
  x: number;
  y: number;
  /** Metres per second. Slower than you, so it comes towards you. */
  speed: number;
  colour: string;
}

export function SpeedX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [hud, setHud] = useState(() => ({
    metres: 0,
    kph: 0,
    best: readBest(HIGH_SCORE_KEY),
  }));
  const { sound, muted, toggleMuted } = useArcadeSound();
  const report = useScoreReporter('speed-x');
  const startRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let worldW = 720;
    let worldH = 480;
    let roadLeft = 0;
    let roadWidth = 0;
    let laneWidth = 0;

    const resize = () => {
      const fit = fitCanvas(canvas, ctx);
      if (!fit) return;
      worldW = fit.width;
      worldH = fit.height;
      roadWidth = worldW * ROAD_FRACTION;
      roadLeft = (worldW - roadWidth) / 2;
      laneWidth = roadWidth / LANES;
    };
    resize();

    /** The centre of a lane, in stage units. */
    const laneCentre = (lane: number) => roadLeft + laneWidth * (lane + 0.5);

    const game = {
      phase: 'idle' as GamePhase,
      /** The car's centre. Chased towards `targetX`, never snapped. */
      x: 0,
      targetX: 0,
      speed: START_SPEED,
      elapsed: 0,
      metres: 0,
      alive: false,
      spawnIn: 0.8,
      tier: 0,
      traffic: [] as Traffic[],
      /** Scrolls the lane markings and the kerb stripes. */
      paint: 0,
      /** Which lane the last wave left open, so a wall is never sealed. */
      lastGap: 2,
    };

    const reset = () => {
      game.x = laneCentre(2);
      game.targetX = game.x;
      game.speed = START_SPEED;
      game.elapsed = 0;
      game.metres = 0;
      game.alive = true;
      game.spawnIn = 0.8;
      game.tier = 0;
      game.traffic = [];
      game.paint = 0;
      game.lastGap = 2;
    };

    /**
     * A wave of traffic.
     *
     * Between one and three cars across five lanes, and the gap lane is
     * remembered so two consecutive waves never leave the player boxed in: a
     * wall you cannot pass is not difficulty, it is a bug that arrives at
     * random.
     */
    const spawnWave = () => {
      const lanes = [0, 1, 2, 3, 4];
      /* Always keep last wave's gap open, plus at least one more lane. */
      const blocked = lanes.filter((lane) => lane !== game.lastGap);
      const howMany = Math.min(
        blocked.length - 1,
        1 + Math.floor(Math.random() * (game.elapsed > 12 ? 3 : 2)),
      );

      const shuffled = blocked.sort(() => Math.random() - 0.5).slice(0, howMany);
      for (const lane of shuffled) {
        game.traffic.push({
          lane,
          x: laneCentre(lane) - CAR_W / 2,
          y: -CAR_H - Math.random() * 60,
          /* Between half and four-fifths of your current speed, so overtaking
             always happens but never at a constant closing rate. */
          speed: game.speed * (0.5 + Math.random() * 0.3),
          colour: TRAFFIC[Math.floor(Math.random() * TRAFFIC.length)],
        });
      }
      /* The lane left open this time becomes the one guaranteed open next. */
      const open = lanes.filter((lane) => !shuffled.includes(lane));
      game.lastGap = open[Math.floor(Math.random() * open.length)] ?? 2;
    };

    const carBox = (x: number, y: number) => ({
      x: x + CAR_W * INSET_X,
      y: y + CAR_H * INSET_Y,
      width: CAR_W * (1 - INSET_X * 2),
      height: CAR_H * (1 - INSET_Y * 2),
    });

    const playerY = () => worldH - CAR_H - 18;

    const crash = () => {
      game.alive = false;
      game.phase = 'over';
      sound.engineOff();
      sound.crash();
      sound.gameOver();
      const metres = Math.floor(game.metres);
      const best = Math.max(readBest(HIGH_SCORE_KEY), metres);
      writeBest(HIGH_SCORE_KEY, best);
      report(metres);
      setPhase('over');
      setHud({ metres, kph: 0, best });
    };

    const step = (dt: number) => {
      game.elapsed += dt;
      const t = game.elapsed;
      game.speed = Math.min(MAX_SPEED, START_SPEED + t * RAMP_LINEAR + t * t * RAMP_SQUARED);
      game.metres += game.speed * dt;
      game.paint += game.speed * dt;

      sound.engine((game.speed - START_SPEED) / (MAX_SPEED - START_SPEED));
      const tier = Math.floor(t / 10);
      if (tier > game.tier) {
        game.tier = tier;
        sound.levelUp();
      }

      /* Steering is a chase, not a jump. Clamped so the car stays on the road —
         the verge is scenery, not a shortcut. */
      const towards = game.targetX - game.x;
      const move = Math.sign(towards) * Math.min(Math.abs(towards), STEER_SPEED * dt);
      game.x = Math.max(
        roadLeft + CAR_W / 2,
        Math.min(roadLeft + roadWidth - CAR_W / 2, game.x + move),
      );

      game.spawnIn -= dt;
      if (game.spawnIn <= 0) {
        spawnWave();
        const base = Math.max(0.34, 1.05 - game.elapsed * 0.026);
        game.spawnIn = base + Math.random() * base * 0.4;
      }

      const me = carBox(game.x - CAR_W / 2, playerY());
      for (const car of game.traffic) {
        /* Relative motion: the road moves past you at `speed`, and they move
           along it at theirs, so they close at the difference. */
        car.y += (game.speed - car.speed) * dt;
        if (overlaps(me, carBox(car.x, car.y))) {
          crash();
          return;
        }
      }
      game.traffic = game.traffic.filter((car) => car.y < worldH + CAR_H);
    };

    const draw = () => {
      /* Verge, then road, then paint. */
      ctx.fillStyle = VERGE;
      ctx.fillRect(0, 0, worldW, worldH);
      ctx.fillStyle = ASPHALT;
      ctx.fillRect(roadLeft, 0, roadWidth, worldH);

      /*
       * Kerb stripes and lane dashes scroll with distance travelled, not with
       * time. Tie them to the clock and the road appears to move at a constant
       * rate however fast you are going, which reads as the car standing still.
       */
      const KERB = 26;
      const offset = game.paint % (KERB * 2);
      for (let y = -KERB * 2; y < worldH + KERB * 2; y += KERB * 2) {
        ctx.fillStyle = KERB_DARK;
        ctx.fillRect(roadLeft - 8, y + offset, 8, KERB);
        ctx.fillRect(roadLeft + roadWidth, y + offset, 8, KERB);
        ctx.fillStyle = KERB_LIGHT;
        ctx.fillRect(roadLeft - 8, y + offset + KERB, 8, KERB);
        ctx.fillRect(roadLeft + roadWidth, y + offset + KERB, 8, KERB);
      }

      const DASH = 34;
      const dashOffset = game.paint % (DASH * 2);
      ctx.fillStyle = LANE_PAINT;
      for (let lane = 1; lane < LANES; lane += 1) {
        const x = roadLeft + laneWidth * lane - 2;
        for (let y = -DASH * 2; y < worldH + DASH * 2; y += DASH * 2) {
          ctx.fillRect(x, y + dashOffset, 4, DASH);
        }
      }

      for (const car of game.traffic) {
        drawSprite(ctx, SPRITES.car, {
          x: car.x,
          y: car.y,
          scale: CAR_SCALE,
          colour: car.colour,
        });
      }

      /* The player last, so nothing is ever drawn over the one car you are
         actually steering. */
      drawSprite(ctx, SPRITES.car, {
        x: game.x - CAR_W / 2,
        y: playerY(),
        scale: CAR_SCALE,
        colour: PLAYER,
      });
      /* A windscreen, so your car is not just "the blue one" at a glance. */
      ctx.fillStyle = PLAYER_TRIM;
      ctx.fillRect(
        Math.round(game.x - CAR_W / 2 + 3 * CAR_SCALE),
        Math.round(playerY() + 2 * CAR_SCALE),
        3 * CAR_SCALE,
        CAR_SCALE,
      );
    };

    resize();
    reset();
    game.alive = false;
    draw();

    let frame = 0;
    let last = performance.now();
    let hudClock = 0;

    const loop = (now: number) => {
      /* Clamped at both ends: the ceiling stops a backgrounded tab teleporting
         traffic through the car, the floor stops a non-monotonic timestamp
         running the road backwards. */
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;

      if (game.phase === 'playing' && game.alive) {
        step(dt);
        hudClock += dt;
        if (hudClock >= 0.1) {
          hudClock = 0;
          setHud((current) => {
            const metres = Math.floor(game.metres);
            const kph = Math.round(game.speed / 2.6);
            if (current.metres === metres && current.kph === kph) return current;
            return { ...current, metres, kph };
          });
        }
      }

      draw();
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);

    const start = () => {
      sound.resume();
      reset();
      game.phase = 'playing';
      setPhase('playing');
      setHud({ metres: 0, kph: 0, best: readBest(HIGH_SCORE_KEY) });
    };
    startRef.current = start;

    const onPointer = (event: PointerEvent) => {
      if (game.phase !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      game.targetX = ((event.clientX - rect.left) / rect.width) * worldW;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        if (game.phase !== 'playing') {
          event.preventDefault();
          start();
        }
        return;
      }
      const left = event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A';
      const right = event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D';
      if (!left && !right) return;
      event.preventDefault();
      if (game.phase !== 'playing') return;
      /*
       * Keys move a whole lane at a time, from wherever the car currently is —
       * not from wherever the last key press aimed. Queuing off `targetX` lets
       * a fast double-tap skip a lane the car never actually crossed.
       */
      const lane = Math.round((game.x - roadLeft - laneWidth / 2) / laneWidth);
      const next = Math.max(0, Math.min(LANES - 1, lane + (left ? -1 : 1)));
      game.targetX = laneCentre(next);
    };

    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);

    const sized = new ResizeObserver(() => {
      resize();
      draw();
    });
    sized.observe(canvas);

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
      title="Speed X"
      aspect="960/420"
      readouts={[
        { label: 'Metres', value: hud.metres.toLocaleString() },
        { label: 'Best', value: hud.best.toLocaleString() },
      ]}
      status={{ label: 'Speed', value: phase === 'playing' ? `${hud.kph} kph` : '—' }}
      idleBlurb="Steer through the traffic. One touch ends the run — there are no spare lives here. Your score is how far you get."
      overTitle="Wreck"
      overBlurb={
        <>
          You covered <strong>{hud.metres.toLocaleString()}m</strong>
          {hud.metres >= hud.best && hud.metres > 0
            ? ' — a new best.'
            : `. Your best is ${hud.best.toLocaleString()}m.`}
        </>
      }
      hint="Pointer or ← → / A D to steer · space to start · one hit and it is over"
      onStart={start}
      muted={muted}
      onToggleMute={toggleMuted}
      aside={<Leaderboard slug="speed-x" />}
      boardClassName="bg-[#16161d]"
      scrimClassName="bg-[#16161d]/92 text-[#f2f0ff]"
    />
  );
}
