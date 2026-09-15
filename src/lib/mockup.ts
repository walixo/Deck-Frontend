/**
 * Draws somebody's artwork onto a garment, in a canvas.
 *
 * **Why this is drawn rather than generated.** The obvious reach here is an
 * image model — "show me my design on a shirt" sounds like a prompt. It is the
 * wrong tool, and specifically the wrong tool for *this* job: a generative
 * model redraws the artwork. What the buyer would be approving is the model's
 * interpretation of their file, and what arrives in the post is their actual
 * file. Those differ, every time, and the gap between them is a refund.
 *
 * A mockup is a contract about what will be printed. So it composites the exact
 * uploaded pixels into a known print area at a known scale — what you see is
 * literally the file, positioned where it will be positioned.
 *
 * The shading is where the realism comes from. Fabric is not flat: the garment
 * gets a fold gradient, and that same gradient is re-applied *over* the print
 * with `multiply`, so the artwork sinks into the cloth instead of floating on
 * it like a sticker. That one pass is the difference between "pasted" and
 * "printed".
 */

export type MockupProduct = 'sticker' | 'sticker-sheet' | 'tee' | 'hoodie';
export type MockupPlacement = 'centre-chest' | 'left-chest' | 'full-front' | 'back';

/** Silhouettes in a 0–100 box, so one path serves every canvas size. */
const SHAPES: Record<'tee' | 'hoodie', string> = {
  tee:
    'M36 8 C40 16 60 16 64 8 L88 16 L96 38 L80 44 L80 95 L20 95 L20 44 L4 38 L12 16 Z',
  /* Same body, heavier: dropped shoulders, a hood behind the neck and a cuffed
     hem. Drawn as one path so the outline stays a single continuous stroke. */
  hoodie:
    'M34 10 C34 22 66 22 66 10 L90 18 L98 42 L82 48 L82 96 L18 96 L18 48 L2 42 L10 18 Z',
};

/** Where a print can land, per product and placement, in the same 0–100 box. */
const PRINT_AREAS: Record<string, { x: number; y: number; w: number; h: number }> = {
  'tee:centre-chest': { x: 32, y: 30, w: 36, h: 30 },
  'tee:left-chest': { x: 56, y: 28, w: 14, h: 12 },
  'tee:full-front': { x: 26, y: 26, w: 48, h: 56 },
  'tee:back': { x: 26, y: 24, w: 48, h: 56 },
  'hoodie:centre-chest': { x: 32, y: 34, w: 36, h: 28 },
  'hoodie:left-chest': { x: 56, y: 32, w: 14, h: 12 },
  /* Shorter than a tee's: a hoodie's pouch pocket starts around 70% down and
     nothing prints across it. */
  'hoodie:full-front': { x: 26, y: 30, w: 48, h: 40 },
  'hoodie:back': { x: 26, y: 28, w: 48, h: 52 },
};

export interface MockupInput {
  product: MockupProduct;
  placement: MockupPlacement;
  /** Garment colour as hex. Ignored for stickers. */
  garment: string;
  /** Print width as a share of the print area, 10–100. */
  scale: number;
  artwork: HTMLImageElement;
}

/** True when the garment is dark enough that a print reads as sitting on top. */
function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.3;
}

export function drawMockup(canvas: HTMLCanvasElement, input: MockupInput): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  /* Backing store at device resolution, drawing in CSS pixels. Without this a
     mockup is visibly soft on any retina screen, which undermines the one thing
     it is for — showing somebody exactly what they are buying. */
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = canvas.clientWidth || 480;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const u = size / 100;

  if (input.product === 'sticker' || input.product === 'sticker-sheet') {
    drawSticker(ctx, size, input);
    return;
  }

  const shape = new Path2D(SHAPES[input.product]);
  ctx.save();
  ctx.scale(u, u);

  ctx.fillStyle = input.garment;
  ctx.fill(shape);

  /* Folds. A vertical light-to-dark ramp plus two soft creases down the body —
     enough to read as cloth without pretending to be a photograph. */
  ctx.save();
  ctx.clip(shape);
  const fold = ctx.createLinearGradient(0, 0, 100, 100);
  fold.addColorStop(0, 'rgba(255,255,255,0.16)');
  fold.addColorStop(0.45, 'rgba(255,255,255,0)');
  fold.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = fold;
  ctx.fillRect(0, 0, 100, 100);

  const crease = ctx.createLinearGradient(20, 0, 80, 0);
  crease.addColorStop(0, 'rgba(0,0,0,0.12)');
  crease.addColorStop(0.3, 'rgba(0,0,0,0)');
  crease.addColorStop(0.7, 'rgba(0,0,0,0)');
  crease.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = crease;
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();
  ctx.restore();

  /* The print, in real pixels rather than the 0–100 space, so the artwork is
     sampled at full resolution instead of being scaled up from a 100px box. */
  const area = PRINT_AREAS[`${input.product}:${input.placement}`];
  if (area) {
    const box = {
      x: area.x * u,
      y: area.y * u,
      w: area.w * u,
      h: area.h * u,
    };

    const share = Math.max(10, Math.min(100, input.scale)) / 100;
    const maxW = box.w * share;
    const maxH = box.h * share;
    const ratio = Math.min(maxW / input.artwork.width, maxH / input.artwork.height);
    const w = input.artwork.width * ratio;
    const h = input.artwork.height * ratio;

    /* Centred horizontally in its area, and top-anchored vertically: a chest
       print keeps its distance from the collar as it grows, which is how a
       printer positions one. */
    const x = box.x + (box.w - w) / 2;
    const y = box.y;

    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    ctx.drawImage(input.artwork, x, y, w, h);

    /*
     * The fold shading, again, over the print.
     *
     * This is the whole trick. `multiply` darkens the artwork exactly where the
     * cloth beneath it is in shadow, so the print follows the garment's form. A
     * lighter hand on dark garments, where plastisol genuinely does sit proud
     * of the fabric and take less of the shading.
     */
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = isDark(input.garment) ? 0.35 : 0.55;
    const over = ctx.createLinearGradient(0, 0, size, size);
    over.addColorStop(0, 'rgba(255,255,255,1)');
    over.addColorStop(0.45, 'rgba(255,255,255,1)');
    over.addColorStop(1, 'rgba(140,140,140,1)');
    ctx.fillStyle = over;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.restore();
  }

  /* House outline last, so it sits over both cloth and print. */
  ctx.save();
  ctx.scale(u, u);
  ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--edge').trim() || '#111111';
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  ctx.stroke(shape);
  ctx.restore();
}

/**
 * A sticker: the artwork with a die-cut border around its silhouette.
 *
 * The border is drawn by stamping the artwork's own alpha outward in a ring of
 * offsets — a cheap dilation. A real die-cut follows the artwork's outline, and
 * a rounded rectangle behind it would misrepresent what arrives in the envelope.
 */
function drawSticker(ctx: CanvasRenderingContext2D, size: number, input: MockupInput): void {
  const sheet = input.product === 'sticker-sheet';
  const share = (Math.max(10, Math.min(100, input.scale)) / 100) * (sheet ? 0.42 : 0.78);
  const ratio = Math.min(
    (size * share) / input.artwork.width,
    (size * share) / input.artwork.height,
  );
  const w = input.artwork.width * ratio;
  const h = input.artwork.height * ratio;

  const positions = sheet
    ? [
        [size * 0.27, size * 0.27],
        [size * 0.73, size * 0.27],
        [size * 0.27, size * 0.73],
        [size * 0.73, size * 0.73],
      ]
    : [[size / 2, size / 2]];

  const bleed = Math.max(3, Math.round(size * 0.012));

  for (const [cx, cy] of positions) {
    const x = cx - w / 2;
    const y = cy - h / 2;

    /* Dilate: draw the artwork in white at 16 offsets around a circle, which
       fills a uniform ring outside the silhouette. */
    ctx.save();
    ctx.shadowColor = 'transparent';
    for (let i = 0; i < 16; i += 1) {
      const angle = (i / 16) * Math.PI * 2;
      ctx.drawImage(
        input.artwork,
        x + Math.cos(angle) * bleed,
        y + Math.sin(angle) * bleed,
        w,
        h,
      );
    }
    /* Everything drawn so far becomes the white border. */
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.restore();

    ctx.drawImage(input.artwork, x, y, w, h);
  }
}
