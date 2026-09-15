import { SPRITES } from '@/lib/pixel';
import { cn } from '@/lib/utils';

/**
 * A game's mark: its own character, as pixels.
 *
 * SVG rather than a canvas. These are static, there can be a dozen on a page,
 * and a dozen canvases means a dozen contexts, a dozen resize observers and a
 * dozen things to repaint on a theme change — for a picture that never moves.
 * As SVG each one is a handful of rects that scale cleanly to any size and are
 * in the DOM where they can be inspected.
 *
 * Every game is drawn by its own protagonist, which is the only labelling
 * scheme that works on a shelf: you recognise the bird before you read "Sky
 * Run".
 */

/*
 * Two marks are spelled out here rather than taken from the shared sprite set.
 *
 * The snake is a grid of cells at runtime, not a bitmap, and the bird is drawn
 * with rectangles — neither has a single bitmap to borrow. So each gets a
 * portrait: the same character, posed for a logo rather than for a game loop.
 */
const SNAKE_MARK = [
  '..#####.',
  '..#.....',
  '..#.###.',
  '..#.#.#.',
  '####.##.',
  '.......#',
  '.#####.#',
  '.#...###',
];

const BIRD_MARK = [
  '.....###....',
  '....#####...',
  '#####.......',
  '######..##..',
  '.####.#####.',
  '..####...##.',
  '...##.......',
];

const MARKS: Record<string, readonly string[]> = {
  'sky-run': BIRD_MARK,
  snakejo: SNAKE_MARK,
  'block-drop': SPRITES.bot,
  'speed-x': SPRITES.car,
};

interface GameLogoProps {
  /** The game's component key. Unknown keys fall back to a neutral block. */
  mark: string;
  /** Foreground, as a CSS colour or `currentColor`. */
  colour?: string;
  /** One accent pixel — the beak, the eye, the antenna tip. */
  accent?: string;
  className?: string;
}

/** Which pixel gets the accent, per mark. */
const ACCENT_AT: Record<string, [number, number]> = {
  'sky-run': [11, 3],
  snakejo: [7, 5],
  'block-drop': [3, 0],
  /* The windscreen, so the mark reads as a car from above rather than a blob. */
  'speed-x': [4, 1],
};

export function GameLogo({ mark, colour = 'currentColor', accent, className }: GameLogoProps) {
  const rows = MARKS[mark] ?? ['####', '#..#', '#..#', '####'];
  const width = Math.max(...rows.map((row) => row.length));
  const height = rows.length;
  const hot = ACCENT_AT[mark];

  const cells: React.ReactElement[] = [];
  rows.forEach((row, y) => {
    /* Merged into horizontal runs, same as the canvas renderer — a shelf of
       marks is otherwise a few hundred one-pixel rects in the DOM. */
    let run = 0;
    for (let x = 0; x <= row.length; x += 1) {
      const lit = row[x] === '#';
      const isHot = hot && hot[1] === y && lit && hot[0] === x;
      if (lit && !isHot) {
        run += 1;
        continue;
      }
      if (run) {
        cells.push(
          <rect key={`${y}-${x}-r`} x={x - run} y={y} width={run} height={1} fill={colour} />,
        );
        run = 0;
      }
      if (isHot) {
        cells.push(
          <rect key={`${y}-${x}-a`} x={x} y={y} width={1} height={1} fill={accent ?? colour} />,
        );
      }
    }
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('block', className)}
      /* Keeps the pixels square whatever box it is given, and stops a browser
         smoothing them on a high-DPI screen. */
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="crispEdges"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {cells}
    </svg>
  );
}
