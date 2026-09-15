import { useCallback, useEffect, useRef, useState } from 'react';
import { GameFrame, type GamePhase } from '@/components/games/GameFrame';
import { Leaderboard } from '@/components/games/Leaderboard';
import {
  readBest,
  useArcadeSound,
  useScoreReporter,
  writeBest,
} from '@/components/games/useArcade';
import { fitCanvas } from '@/lib/pixel';

/**
 * Snake, in the Nokia idiom.
 *
 * The one game on Deck that ignores the palette on purpose. Snake is not a
 * neutral thing you can restyle — it is a specific object people remember, and
 * the memory is of dark pixels on a green backlight. Rendering it in Deck's
 * lavender would make it a snake game rather than *that* snake game, so the
 * board carries its own two colours and does not follow the theme. The design
 * contract's rules are about Deck's chrome; this is content.
 *
 * Nokia's rules, kept: walls kill, the tail follows exactly, and the snake
 * speeds up as it grows. No wrap-around — the shrinking board is the difficulty
 * curve, and a wrap removes it.
 */

/* The LCD. Two colours, no theme, no alpha. */
const LCD = '#9bbc0f';
const LCD_DIM = '#8aa80d';
const LCD_INK = '#0f380f';

/**
 * Board in cells, shaped to the board it is drawn on.
 *
 * 41 x 18 is 2.28:1, which matches the arcade's 960x420 frame. It used to be
 * 30 x 20 — a phone's proportions — and on a wide board `fitCanvas` sized the
 * cells by whichever axis ran out first and centred the leftover, so a third of
 * the panel was empty green either side. The grid follows the frame.
 */
const COLS = 41;
const ROWS = 18;

/** Seconds per step at length 3, and the floor it accelerates towards. */
const START_TICK = 0.15;
const MIN_TICK = 0.055;
/** How much of the remaining gap to the floor each apple closes. */
const SPEED_BITE = 0.035;

const HIGH_SCORE_KEY = 'deck-snake-best';

type Vec = { x: number; y: number };

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
} as const;
type Direction = keyof typeof DIRECTIONS;

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function Snakejo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [hud, setHud] = useState(() => ({
    score: 0,
    length: 3,
    best: readBest(HIGH_SCORE_KEY),
  }));
  const { sound, muted, toggleMuted } = useArcadeSound();
  const report = useScoreReporter('snakejo');
  const startRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cell = 10;
    let originX = 0;
    let originY = 0;
    /* The drawing surface in stage units — `ctx` carries a scale transform, so
       filling `canvas.width` would overshoot by that factor. */
    let stageW = 0;
    let stageH = 0;

    const resize = () => {
      const fit = fitCanvas(canvas, ctx);
      if (!fit) return;
      stageW = fit.width;
      stageH = fit.height;
      /* Whole-number cells, then centre the leftover. A fractional cell size
         puts every gridline on a half-pixel and the whole board goes soft. */
      cell = Math.max(2, Math.floor(Math.min(fit.width / COLS, fit.height / ROWS)));
      originX = Math.floor((fit.width - cell * COLS) / 2);
      originY = Math.floor((fit.height - cell * ROWS) / 2);
    };
    resize();

    const game = {
      phase: 'idle' as GamePhase,
      body: [] as Vec[],
      dir: 'right' as Direction,
      /*
       * Turns are queued, not applied on the spot.
       *
       * Between two steps a fast player can press up then left, and applying
       * each immediately would turn the snake back onto itself and kill it for
       * playing well. The queue holds at most two, so each is consumed by its
       * own step.
       */
      queue: [] as Direction[],
      apple: { x: 0, y: 0 } as Vec,
      tick: START_TICK,
      clock: 0,
      score: 0,
      alive: false,
    };

    const placeApple = () => {
      /* Rejection sampling. The board is 600 cells and a long snake covers a
         fraction of it, so this retries a handful of times at worst — far
         cheaper than building the list of free cells every apple. */
      for (let attempt = 0; attempt < 400; attempt += 1) {
        const spot = {
          x: Math.floor(Math.random() * COLS),
          y: Math.floor(Math.random() * ROWS),
        };
        if (!game.body.some((part) => part.x === spot.x && part.y === spot.y)) {
          game.apple = spot;
          return;
        }
      }
      /* Board essentially full — put it on the first free cell there is. */
      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          if (!game.body.some((part) => part.x === x && part.y === y)) {
            game.apple = { x, y };
            return;
          }
        }
      }
    };

    const reset = () => {
      const midY = Math.floor(ROWS / 2);
      game.body = [
        { x: 5, y: midY },
        { x: 4, y: midY },
        { x: 3, y: midY },
      ];
      game.dir = 'right';
      game.queue = [];
      game.tick = START_TICK;
      game.clock = 0;
      game.score = 0;
      game.alive = true;
      placeApple();
    };

    const die = () => {
      game.alive = false;
      game.phase = 'over';
      sound.crash();
      sound.gameOver();
      const best = Math.max(readBest(HIGH_SCORE_KEY), game.score);
      writeBest(HIGH_SCORE_KEY, best);
      setPhase('over');
      setHud({ score: game.score, length: game.body.length, best });
      report(game.score);
    };

    const stepOnce = () => {
      const next = game.queue.shift();
      if (next && next !== OPPOSITE[game.dir]) game.dir = next;

      const delta = DIRECTIONS[game.dir];
      const head = { x: game.body[0].x + delta.x, y: game.body[0].y + delta.y };

      /* Walls kill. This is the whole difficulty curve — with wrap-around a
         long snake is easier than a short one, which is backwards. */
      if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS) return die();

      /*
       * The tail cell is excluded from the self-collision test.
       *
       * It moves out of the way on this very step, so running into the square
       * the tail is leaving is legal — and it happens constantly when the snake
       * is following its own body round a corner. Testing the whole body kills
       * the player for a square that is already empty.
       */
      const willGrow = head.x === game.apple.x && head.y === game.apple.y;
      const solid = willGrow ? game.body : game.body.slice(0, -1);
      if (solid.some((part) => part.x === head.x && part.y === head.y)) return die();

      game.body.unshift(head);

      if (willGrow) {
        game.score += 10;
        sound.chomp();
        /* Each apple closes a fixed fraction of the remaining gap to the floor,
           so it accelerates hard early and asymptotes rather than hitting a
           wall at some arbitrary length. */
        game.tick -= (game.tick - MIN_TICK) * SPEED_BITE;
        placeApple();
      } else {
        game.body.pop();
      }
      return undefined;
    };

    const draw = () => {
      /* The whole panel, then the board inset on it. */
      ctx.fillStyle = LCD;
      ctx.fillRect(0, 0, stageW, stageH);

      /* A faint grid, the way a segment display shows its unlit cells. */
      ctx.fillStyle = LCD_DIM;
      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          ctx.fillRect(originX + x * cell + 1, originY + y * cell + 1, cell - 2, cell - 2);
        }
      }

      ctx.fillStyle = LCD_INK;

      /* The apple blinks, which is how the phone drew it and how you find it. */
      if (Math.floor(performance.now() / 220) % 2 === 0) {
        ctx.fillRect(
          originX + game.apple.x * cell + 1,
          originY + game.apple.y * cell + 1,
          cell - 2,
          cell - 2,
        );
      }

      game.body.forEach((part, index) => {
        const inset = index === 0 ? 0 : 1;
        ctx.fillRect(
          originX + part.x * cell + inset,
          originY + part.y * cell + inset,
          cell - inset * 2,
          cell - inset * 2,
        );
      });
    };

    resize();
    reset();
    game.alive = false;
    draw();

    let frame = 0;
    let last = performance.now();

    const loop = (now: number) => {
      /* Clamped at both ends. The ceiling is generous because the snake steps
         on a fixed tick and catching up is correct; the floor stops a negative
         delta unwinding the step clock. */
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.25));
      last = now;

      if (game.phase === 'playing' && game.alive) {
        game.clock += dt;
        /* A while loop, not an if: after a stall the clock can hold several
           steps, and dropping them would teleport the snake. */
        while (game.clock >= game.tick && game.alive) {
          game.clock -= game.tick;
          stepOnce();
        }

        /* The hum tracks how fast the snake has become. */
        sound.engine((START_TICK - game.tick) / (START_TICK - MIN_TICK));

        setHud((current) =>
          current.score === game.score && current.length === game.body.length
            ? current
            : { ...current, score: game.score, length: game.body.length },
        );
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
      setHud({ score: 0, length: 3, best: readBest(HIGH_SCORE_KEY) });
    };
    startRef.current = start;

    const turn = (direction: Direction) => {
      /* At most two queued. A third press within one step is a player mashing,
         and honouring it would run turns a step behind what they can see. */
      if (game.queue.length < 2) game.queue.push(direction);
    };

    const KEYS: Record<string, Direction> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      w: 'up',
      s: 'down',
      a: 'left',
      d: 'right',
      W: 'up',
      S: 'down',
      A: 'left',
      D: 'right',
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        if (game.phase !== 'playing') {
          event.preventDefault();
          start();
        }
        return;
      }
      const direction = KEYS[event.key];
      if (!direction) return;
      event.preventDefault();
      if (game.phase === 'playing') turn(direction);
    };

    /* Swipe, for a phone. Threshold in CSS pixels so it does not depend on the
       board's scale, and the dominant axis wins so a sloppy diagonal still
       does something predictable. */
    let touchFrom: { x: number; y: number } | null = null;
    const onDown = (event: PointerEvent) => {
      touchFrom = { x: event.clientX, y: event.clientY };
    };
    const onUp = (event: PointerEvent) => {
      if (!touchFrom || game.phase !== 'playing') return;
      const dx = event.clientX - touchFrom.x;
      const dy = event.clientY - touchFrom.y;
      touchFrom = null;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 'right' : 'left');
      else turn(dy > 0 ? 'down' : 'up');
    };

    window.addEventListener('keydown', onKey);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);

    const sized = new ResizeObserver(() => {
      resize();
      draw();
    });
    sized.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      sized.disconnect();
      startRef.current = null;
    };
  }, [sound, report]);

  const start = useCallback(() => startRef.current?.(), []);

  return (
    <GameFrame
      canvasRef={canvasRef}
      phase={phase}
      title="Snakejo"
      aspect="960/420"
      readouts={[
        { label: 'Score', value: hud.score.toLocaleString() },
        { label: 'Best', value: hud.best.toLocaleString() },
      ]}
      status={{ label: 'Length', value: String(hud.length) }}
      idleBlurb="Eat, grow, and do not touch the walls or yourself. Every apple makes it faster."
      overTitle="Bonk"
      overBlurb={
        <>
          You scored <strong className="text-body">{hud.score.toLocaleString()}</strong> at{' '}
          {hud.length} long
          {hud.score >= hud.best && hud.score > 0
            ? ' — a new best.'
            : `. Your best is ${hud.best.toLocaleString()}.`}
        </>
      }
      hint="Arrows / WASD or swipe · space to start · walls kill, and it never wraps"
      onStart={start}
      /* The board brings its own colours, so the frame must not paint a
         Deck-coloured ground behind it or the letterboxing goes lavender. */
      boardClassName="bg-[#9bbc0f]"
      scrimClassName="bg-[#9bbc0f]/95 text-[#0f380f]"
      muted={muted}
      onToggleMute={toggleMuted}
      aside={<Leaderboard slug="snakejo" />}
    />
  );
}
