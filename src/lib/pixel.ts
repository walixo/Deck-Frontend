/**
 * Deck's pixel-art vocabulary: the shapes, and the code that puts them on a
 * canvas.
 *
 * Extracted when the arcade got a second consumer. The hero's sky and the game
 * on `/games` draw the same birds, tetrominoes and invaders, and two copies of
 * a sprite is two sprites — the moment one is tweaked they are different
 * characters wearing the same name. One definition, two scenes.
 *
 * Everything here is authored in **stage units** on a fixed virtual screen, and
 * `fitCanvas` maps that onto whatever real pixels are going. Nothing in a
 * caller should ever mention a device pixel.
 */

/** The virtual screen's width. All geometry is authored against this. */
export const STAGE = 960;

/** One tetromino cell, in stage units. */
export const CELL = 10;

/**
 * The seven tetrominoes, as unit cells in a 4x4 box, one fixed orientation
 * each.
 *
 * No rotation system. In the hero a rotating piece asks to be watched, and that
 * scene is meant to be seen out of the corner of an eye; in the game a rotating
 * hazard makes the hitbox a lie. Fixed orientations serve both.
 */
export const PIECES: readonly (readonly (readonly [number, number])[])[] = [
  [[0, 0], [1, 0], [2, 0], [3, 0]], // I
  [[0, 0], [1, 0], [0, 1], [1, 1]], // O
  [[0, 0], [1, 0], [2, 0], [1, 1]], // T
  [[1, 0], [2, 0], [0, 1], [1, 1]], // S
  [[0, 0], [1, 0], [1, 1], [2, 1]], // Z
  [[0, 0], [0, 1], [1, 1], [2, 1]], // J
  [[2, 0], [0, 1], [1, 1], [2, 1]], // L
];

/** Width and height of a piece, in cells. */
export function pieceSize(piece: number): { cols: number; rows: number } {
  const cells = PIECES[piece];
  return {
    cols: Math.max(...cells.map(([cx]) => cx)) + 1,
    rows: Math.max(...cells.map(([, cy]) => cy)) + 1,
  };
}

/*
 * The arcade, as bitmaps.
 *
 * Rows of strings rather than coordinate lists because at this size the source
 * should look like the thing it draws — a mistake in a sprite is obvious here
 * and invisible in a list of forty `[x, y]` pairs.
 *
 * These are the small solid objects; the tetrominoes are the large hollow ones.
 * That split is the visual rule both scenes keep: anything big is an outline so
 * it stays background, anything solid is small enough not to become one.
 */
export const SPRITES = {
  /* The one everybody reads as "video game" without having to be told. */
  invader: [
    '..#.....#..',
    '...#...#...',
    '..#######..',
    '.##.###.##.',
    '###########',
    '#.#######.#',
    '#.#.....#.#',
    '...##.##...',
  ],
  /* A life, in the way every game from 1985 onwards drew one. */
  heart: [
    '.##.##.',
    '#######',
    '#######',
    '.#####.',
    '..###..',
    '...#...',
  ],
  sparkle: [
    '...#...',
    '...#...',
    '..###..',
    '#######',
    '..###..',
    '...#...',
    '...#...',
  ],
  saucer: [
    '...###...',
    '..#####..',
    '#########',
    '.#.#.#.#.',
    '..#...#..',
  ],
  /* A pill and a ball: the oldest videogame there is, in nine columns. */
  pong: [
    '#.......#',
    '#...#...#',
    '#.......#',
  ],
  /* Block Drop's character. A stubby robot — the antenna gives it a front, so
     you can tell at a glance which way is up in a field of falling junk. */
  bot: [
    '...#...',
    '...#...',
    '.#####.',
    '#.#.#.#',
    '#######',
    '#.###.#',
    '#.#.#.#',
    '..#.#..',
  ],
  /* A falling wrench, girder and canister — three silhouettes that read as
     "debris" at a glance without needing colour to tell them apart. */
  bolt: [
    '.##.',
    '####',
    '.##.',
    '.##.',
    '.##.',
    '####',
  ],
  girder: [
    '########',
    '#.#..#.#',
    '########',
  ],
  canister: [
    '.####.',
    '######',
    '#.##.#',
    '######',
    '######',
    '.####.',
  ],
  /*
   * Speed X's car, seen from above: nose at the top, cabin pinched in the
   * middle, wheels proud of the body on both sides.
   *
   * Nine columns because it has to read as a car at about 36 stage units wide,
   * and an even width would put the centre line between two pixels — a car
   * whose middle is not a pixel looks lopsided the moment it is drawn at an
   * odd scale.
   */
  car: [
    '..#####..',
    '.#######.',
    '.##...##.',
    '.#######.',
    '#########',
    '##.###.##',
    '#########',
    '#########',
    '.##...##.',
    '.#######.',
    '..#####..',
    '...###...',
  ],
} as const;

export type SpriteName = keyof typeof SPRITES;

/** The bird's box, in stage units at scale 1. Its hitbox and its layout size. */
export const BIRD = { width: 16, height: 9 } as const;

/**
 * Deterministic noise in [0, 1).
 *
 * `Math.random` would reshuffle the hero's sky on every mount, so a reader
 * coming back would find a different arrangement each time and the layout could
 * not be reasoned about or checked. Hashing the index gives a fixed scene that
 * still looks scattered. The game wants real randomness and uses `Math.random`
 * directly — an arcade you can memorise frame by frame is a worse arcade.
 */
export function noise(a: number, b: number): number {
  return Math.abs(Math.sin(a * 127.1 + b * 311.7) * 43758.5453) % 1;
}

/**
 * Sizes a canvas to its CSS box and returns the stage scale.
 *
 * The scale is quantised to eighths so a stage unit lands on a whole number of
 * device pixels. Without that, every edge in the scene is a half-pixel out and
 * the whole thing renders soft — which is the one thing pixel art cannot
 * survive.
 *
 * Returns null when the element has no layout yet, which happens on the first
 * pass of a hidden or not-yet-measured container.
 */
export function fitCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): { scale: number; width: number; height: number } | null {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return null;

  const scale = Math.max(1, Math.round((width / STAGE) * 8 * dpr)) / 8;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = false;

  return { scale, width: canvas.width / scale, height: canvas.height / scale };
}

/**
 * Reads the three colours both scenes draw with, straight off the document.
 *
 * Taken from CSS variables rather than hard-coded so the canvas inherits the
 * generated palette like everything else, and taken on demand rather than once
 * because a caller cannot know when the theme lands: child effects run before
 * parent effects, so a component that samples at setup reads the *previous*
 * theme and paints near-black ink onto a near-black canvas.
 *
 * `from` is which element to resolve the variables against, and it matters
 * wherever a subtree carries its own `dark` class — the hero is a night island
 * inside a light page, and `--canvas` there is the hero's ground, not the
 * page's. Pass the canvas itself and the answer is right by construction;
 * omitting it reads the document, which is what the games want.
 */
export interface Palette {
  ink: string;
  accent: string;
  canvas: string;
}

export function readPalette(from?: Element): Palette {
  const root = from ?? document.documentElement;
  /* The fallbacks only fire when a variable is missing entirely, so they are
     keyed off the document's theme even when reading a subtree. */
  const dark = document.documentElement.classList.contains('dark');
  const styles = getComputedStyle(root);
  const value = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;

  return {
    ink: value('--edge', dark ? '#f7f6f2' : '#111111'),
    accent: value('--accent', dark ? '#b8a9fa' : '#5b46c9'),
    canvas: value('--canvas', dark ? '#151515' : '#ffffff'),
  };
}

/** True when the document's theme has changed since `was`. Cheap enough to run per frame. */
export function themeChanged(was: boolean | null): boolean {
  return document.documentElement.classList.contains('dark') !== was;
}

export function isDark(): boolean {
  return document.documentElement.classList.contains('dark');
}

interface SpriteOptions {
  x: number;
  y: number;
  scale?: number;
  colour: string;
  alpha?: number;
}

/**
 * A bitmap sprite, one `fillRect` per run of set pixels in a row.
 *
 * Per run rather than per pixel: the invader alone is 46 lit cells, and merging
 * horizontal runs takes a full cast from 120 rectangles a frame to 48 — verified
 * pixel-identical to the naive version.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  rows: readonly string[],
  { x, y, scale = 1, colour, alpha = 1 }: SpriteOptions,
): void {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  ctx.fillStyle = colour;
  ctx.globalAlpha = alpha;

  rows.forEach((row, ry) => {
    let run = 0;
    for (let rx = 0; rx <= row.length; rx += 1) {
      if (row[rx] === '#') {
        run += 1;
      } else if (run) {
        ctx.fillRect(rx - run, ry, run, 1);
        run = 0;
      }
    }
  });

  ctx.globalAlpha = 1;
  ctx.restore();
}

interface BirdOptions {
  x: number;
  y: number;
  scale?: number;
  /** Wings up on the upstroke; the body also drops a unit on the downstroke. */
  up: boolean;
  palette: Palette;
  /** The body's alpha. */
  alpha?: number;
  /** The beak and eye, which stay crisper than the body so the face reads. */
  detail?: number;
}

/**
 * The bird, drawn as seven rectangles.
 *
 * Rectangles rather than a sprite sheet or an SVG because at this size a sprite
 * is a network request and a blurry upscale, and the whole shape is sixteen
 * units wide — it is cheaper to say it in code than to fetch it. Wings up or
 * down is the entire animation; the body drops a unit on the downstroke, which
 * is what turns two poses into a bob.
 */
export function drawBird(
  ctx: CanvasRenderingContext2D,
  { x, y, scale = 1, up, palette, alpha = 1, detail = 0.85 }: BirdOptions,
): void {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y + (up ? 0 : 1)));
  ctx.scale(scale, scale);

  ctx.fillStyle = palette.ink;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 4, 4, 2); // tail
  ctx.fillRect(3, 3, 8, 4); // body
  ctx.fillRect(10, 2, 4, 3); // head
  ctx.fillRect(5, up ? 0 : 6, 5, 3); // wing

  ctx.globalAlpha = detail;
  ctx.fillStyle = palette.accent;
  ctx.fillRect(14, 3, 2, 1); // beak

  ctx.fillStyle = palette.canvas;
  ctx.fillRect(12, 3, 1, 1); // eye

  ctx.globalAlpha = 1;
  ctx.restore();
}

/**
 * One tetromino cell: a faint fill inside a hard outline.
 *
 * The half-pixel offset keeps a 1px stroke on the pixel rather than straddling
 * two, which is the difference between a crisp edge and a grey smear.
 */
export function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colour: string,
  { fill = 0.05, stroke = 0.26, size = CELL }: { fill?: number; stroke?: number; size?: number } = {},
): void {
  const px = Math.round(x);
  const py = Math.round(y);

  ctx.globalAlpha = fill;
  ctx.fillStyle = colour;
  ctx.fillRect(px, py, size, size);

  ctx.globalAlpha = stroke;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

  ctx.globalAlpha = 1;
}

/** Draws a whole tetromino from its top-left corner. */
export function drawPiece(
  ctx: CanvasRenderingContext2D,
  piece: number,
  x: number,
  y: number,
  colour: string,
  options?: { fill?: number; stroke?: number; size?: number },
): void {
  const size = options?.size ?? CELL;
  for (const [cx, cy] of PIECES[piece]) {
    drawCell(ctx, x + cx * size, y + cy * size, colour, options);
  }
}

/** Axis-aligned overlap test. Both boxes are in stage units. */
export function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  );
}
