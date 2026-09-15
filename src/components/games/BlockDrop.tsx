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
  CELL,
  drawPiece,
  drawSprite,
  fitCanvas,
  overlaps,
  PIECES,
  pieceSize,
  SPRITES,
} from '@/lib/pixel';

/**
 * Block Drop — junk falls, you do not get hit by it.
 *
 * The mirror of Sky Run: there the world came at you sideways and you flew;
 * here it comes down and you run along the floor. Same engine, opposite axis,
 * and it plays completely differently — sideways you thread gaps, downwards you
 * read shadows and commit early.
 *
 * This one is allowed to be loud. Sky Run lives on the home page's grid and has
 * to stay out of the way; Block Drop lives only on its own board, so it gets a
 * near-black ground and a proper arcade palette instead of one ink and a beak.
 */

/* Its own palette, on its own board. Deck's `--accent` is in here so the game
   still feels related, but the rest is arcade rather than product. */
const GROUND = '#0d0b1a';
const GRID = '#1b1733';
const BOT = '#6ad3d6';
const BOT_DIM = '#2f8a8c';
const HAZARD = '#ff5d73';
const HAZARD_ALT = '#ffc65d';
const COIN = '#b8a9fa';
const SHIELD = '#7bf59a';

/** Stage geometry. Taller than it is wide is wrong for a page; 3:2 reads well. */
const STAGE_W = 720;
const BOT_SCALE = 4;
const BOT_W = SPRITES.bot[0].length * BOT_SCALE;
const BOT_H = SPRITES.bot.length * BOT_SCALE;
/** How far the bot's feet sit above the floor. */
const FLOOR_GAP = 14;

const START_FALL = 190;
const MAX_FALL = 1000;
/** Same compounding shape as Sky Run: a warm-up, then it runs away from you. */
const FALL_LINEAR = 24;
const FALL_SQUARED = 1.25;

const MOVE_SPEED = 520;
const START_LIVES = 3;
const MAX_LIVES = 5;
const MERCY = 1.3;
/** Inset on the bot's hitbox, in stage units. Generous, never the other way. */
const FORGIVENESS = 5;

const HIGH_SCORE_KEY = 'deck-blockdrop-best';

type FallerKind = 'piece' | 'bolt' | 'girder' | 'canister';
type PickKind = 'coin' | 'shield';

interface Faller {
  kind: FallerKind;
  piece: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Sideways drift, so a column is never a safe lane for long. */
  drift: number;
  scale: number;
}

interface Pick {
  kind: PickKind;
  x: number;
  y: number;
  width: number;
  height: number;
  taken: boolean;
}

export function BlockDrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [hud, setHud] = useState(() => ({
    score: 0,
    lives: START_LIVES,
    best: readBest(HIGH_SCORE_KEY),
  }));
  const { sound, muted, toggleMuted } = useArcadeSound();
  const report = useScoreReporter('block-drop');
  const startRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let worldW = STAGE_W;
    let worldH = 480;

    const resize = () => {
      const fit = fitCanvas(canvas, ctx);
      if (!fit) return;
      worldW = fit.width;
      worldH = fit.height;
    };
    resize();

    const game = {
      phase: 'idle' as GamePhase,
      x: worldW / 2 - BOT_W / 2,
      /** -1, 0 or 1 from the keys; the pointer sets `x` directly instead. */
      move: 0,
      pointerX: null as number | null,
      fall: START_FALL,
      elapsed: 0,
      score: 0,
      lives: START_LIVES,
      mercy: 0,
      tier: 0,
      spawnIn: 0.8,
      pickIn: 3,
      fallers: [] as Faller[],
      picks: [] as Pick[],
      step: 0,
      stepClock: 0,
    };

    const reset = () => {
      game.x = worldW / 2 - BOT_W / 2;
      game.move = 0;
      game.pointerX = null;
      game.fall = START_FALL;
      game.elapsed = 0;
      game.score = 0;
      game.lives = START_LIVES;
      game.mercy = 0;
      game.tier = 0;
      game.spawnIn = 0.8;
      game.pickIn = 3;
      game.fallers = [];
      game.picks = [];
    };

    const spawnFaller = () => {
      const roll = Math.random();
      const kind: FallerKind =
        roll < 0.5 ? 'piece' : roll < 0.7 ? 'bolt' : roll < 0.87 ? 'girder' : 'canister';
      const piece = Math.floor(Math.random() * PIECES.length);
      const scale = 3;

      let width: number;
      let height: number;
      if (kind === 'piece') {
        const size = pieceSize(piece);
        width = size.cols * CELL;
        height = size.rows * CELL;
      } else {
        width = SPRITES[kind][0].length * scale;
        height = SPRITES[kind].length * scale;
      }

      game.fallers.push({
        kind,
        piece,
        x: Math.random() * Math.max(1, worldW - width),
        y: -height - 8,
        width,
        height,
        /* A third of them slide as they fall. Without it the game is solved by
           standing in one column and stepping out at the last moment. */
        drift: Math.random() < 0.34 ? (Math.random() - 0.5) * 150 : 0,
        scale,
      });
    };

    const spawnPick = () => {
      const wantsShield = game.lives < MAX_LIVES && Math.random() < 0.3;
      const kind: PickKind = wantsShield ? 'shield' : 'coin';
      const rows = wantsShield ? SPRITES.heart : SPRITES.sparkle;
      const scale = 3;
      const width = rows[0].length * scale;
      const height = rows.length * scale;

      game.picks.push({
        kind,
        x: Math.random() * Math.max(1, worldW - width),
        y: -height - 8,
        width,
        height,
        taken: false,
      });
    };

    const botBox = () => ({
      x: game.x + FORGIVENESS,
      y: worldH - FLOOR_GAP - BOT_H + FORGIVENESS,
      width: BOT_W - FORGIVENESS * 2,
      height: BOT_H - FORGIVENESS * 2,
    });

    const fallerHit = (faller: Faller, box: ReturnType<typeof botBox>) => {
      if (faller.kind !== 'piece') return overlaps(box, faller);
      /* Cell by cell, for the same reason as Sky Run: a third of an L piece's
         box is empty air, and dying in it feels broken. */
      for (const [cx, cy] of PIECES[faller.piece]) {
        if (
          overlaps(box, {
            x: faller.x + cx * CELL,
            y: faller.y + cy * CELL,
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
      game.fall = Math.min(MAX_FALL, START_FALL + t * FALL_LINEAR + t * t * FALL_SQUARED);
      game.score += game.fall * dt * 0.05;
      if (game.mercy > 0) game.mercy -= dt;

      sound.engine((game.fall - START_FALL) / (MAX_FALL - START_FALL));
      const tier = Math.floor(t / 10);
      if (tier > game.tier) {
        game.tier = tier;
        sound.levelUp();
      }

      /* The pointer wins when it has been used, otherwise the keys drive. Both
         are clamped to the floor's width so the bot cannot leave the board. */
      if (game.pointerX !== null) {
        game.x += (game.pointerX - BOT_W / 2 - game.x) * Math.min(1, dt * 18);
      } else {
        game.x += game.move * MOVE_SPEED * dt;
      }
      game.x = Math.max(0, Math.min(worldW - BOT_W, game.x));

      game.spawnIn -= dt;
      if (game.spawnIn <= 0) {
        spawnFaller();
        const base = Math.max(0.2, 0.8 - game.elapsed * 0.028);
        game.spawnIn = base + Math.random() * base * 0.6;
      }

      game.pickIn -= dt;
      if (game.pickIn <= 0) {
        spawnPick();
        game.pickIn = 3 + Math.random() * 3;
      }

      const box = botBox();

      for (const faller of game.fallers) {
        faller.y += game.fall * dt;
        if (faller.drift) {
          faller.x += faller.drift * dt;
          /* Bounce off the sides rather than vanish — an obstacle that leaves
             the board sideways is a gap the player did not earn. */
          if (faller.x < 0 || faller.x > worldW - faller.width) faller.drift *= -1;
          faller.x = Math.max(0, Math.min(worldW - faller.width, faller.x));
        }
        if (game.mercy <= 0 && fallerHit(faller, box)) {
          game.lives -= 1;
          game.mercy = MERCY;
          faller.y = worldH + 999;
          sound.crash();
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
      game.fallers = game.fallers.filter((f) => f.y < worldH + 80);

      for (const pick of game.picks) {
        pick.y += game.fall * 0.8 * dt;
        if (!pick.taken && overlaps(box, pick)) {
          pick.taken = true;
          if (pick.kind === 'shield') {
            game.lives = Math.min(MAX_LIVES, game.lives + 1);
            sound.bonus();
          } else {
            game.score += 150;
            sound.pickup();
          }
        }
      }
      game.picks = game.picks.filter((p) => p.y < worldH + 80 && !p.taken);
    };

    const draw = () => {
      ctx.fillStyle = GROUND;
      ctx.fillRect(0, 0, worldW, worldH);

      /* A receding grid on the floor plane. Cheap, and it gives the falling
         objects something to be measured against. */
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= worldW; x += 40) {
        ctx.moveTo(Math.round(x) + 0.5, 0);
        ctx.lineTo(Math.round(x) + 0.5, worldH);
      }
      for (let y = 0; y <= worldH; y += 40) {
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(worldW, Math.round(y) + 0.5);
      }
      ctx.stroke();

      /* The floor line the bot stands on. */
      ctx.fillStyle = BOT_DIM;
      ctx.fillRect(0, worldH - FLOOR_GAP + 2, worldW, 2);

      for (const faller of game.fallers) {
        const colour = faller.kind === 'girder' ? HAZARD_ALT : HAZARD;
        if (faller.kind === 'piece') {
          drawPiece(ctx, faller.piece, faller.x, faller.y, colour, { fill: 0.22, stroke: 1 });
        } else {
          drawSprite(ctx, SPRITES[faller.kind], {
            x: faller.x,
            y: faller.y,
            scale: faller.scale,
            colour,
          });
        }
      }

      for (const pick of game.picks) {
        drawSprite(ctx, pick.kind === 'shield' ? SPRITES.heart : SPRITES.sparkle, {
          x: pick.x,
          y: pick.y,
          scale: 3,
          colour: pick.kind === 'shield' ? SHIELD : COIN,
        });
      }

      const blinking = game.mercy > 0 && Math.floor(game.mercy * 12) % 2 === 0;
      if (!blinking) {
        drawSprite(ctx, SPRITES.bot, {
          x: game.x,
          y: worldH - FLOOR_GAP - BOT_H,
          scale: BOT_SCALE,
          colour: BOT,
        });
      }
    };

    resize();
    draw();

    let frame = 0;
    let last = performance.now();
    let hudClock = 0;

    const loop = (now: number) => {
      /* Clamped at both ends: the ceiling stops a backgrounded tab teleporting
         everything through the bot on its first frame back, and the floor stops
         a non-monotonic timestamp running the game backwards. */
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;

      if (game.phase === 'playing') {
        step(dt);
        hudClock += dt;
        if (hudClock >= 0.1) {
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
      sound.resume();
      reset();
      game.phase = 'playing';
      setPhase('playing');
      setHud({ score: 0, lives: START_LIVES, best: readBest(HIGH_SCORE_KEY) });
    };
    startRef.current = start;

    const onPointer = (event: PointerEvent) => {
      if (game.phase !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      game.pointerX = ((event.clientX - rect.left) / rect.width) * worldW;
    };

    const onKeyDown = (event: KeyboardEvent) => {
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
      /* Taking a key hands control back from the pointer, so the two inputs
         never fight over the bot mid-run. */
      game.pointerX = null;
      game.move = left ? -1 : 1;
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const left = event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A';
      const right = event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D';
      if ((left && game.move === -1) || (right && game.move === 1)) game.move = 0;
    };

    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const sized = new ResizeObserver(() => {
      resize();
      draw();
    });
    sized.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      sized.disconnect();
      startRef.current = null;
    };
  }, [sound, report]);

  const start = useCallback(() => startRef.current?.(), []);

  return (
    <GameFrame
      canvasRef={canvasRef}
      phase={phase}
      title="Block Drop"
      aspect="960/420"
      readouts={[
        { label: 'Score', value: hud.score.toLocaleString() },
        { label: 'Best', value: hud.best.toLocaleString() },
      ]}
      status={{
        label: 'Lives',
        value: phase === 'idle' ? '—' : '♥'.repeat(hud.lives) || 'none',
      }}
      idleBlurb="Run along the floor and do not get flattened. Sparkles are points, hearts are another go. It speeds up fast."
      overTitle="Flattened"
      overBlurb={
        <>
          You scored <strong>{hud.score.toLocaleString()}</strong>
          {hud.score >= hud.best && hud.score > 0
            ? ' — a new best.'
            : `. Your best is ${hud.best.toLocaleString()}.`}
        </>
      }
      hint="Pointer or ← → / A D to run · space to start · scores are kept on this device only"
      onStart={start}
      muted={muted}
      onToggleMute={toggleMuted}
      aside={<Leaderboard slug="block-drop" />}
      boardClassName="bg-[#0d0b1a]"
      scrimClassName="bg-[#0d0b1a]/92 text-[#f2f0ff]"
    />
  );
}
