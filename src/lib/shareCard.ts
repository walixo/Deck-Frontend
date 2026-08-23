/**
 * Draws the launch announcement card and hands back a PNG.
 *
 * Rendered on the client, in a canvas, for one reason that decides everything
 * else: the browser already has Deck's fonts loaded. A server-side renderer
 * would need Archivo Black and Geist installed alongside it, and would quietly
 * fall back to something generic the day a deploy forgot them — producing a
 * brand card that is off-brand, with nothing to alert anyone.
 *
 * PNG rather than SVG because this is made to be dropped into a post. X,
 * LinkedIn and Slack all reject SVG; a raster is the only thing that pastes.
 *
 * The composition is two stacked objects: the launch card itself, and an
 * announcement sticker overlapping its bottom edge. The overlap is the whole
 * trick — it is what makes the thing read as a designed artefact rather than a
 * screenshot, and it is why the sticker is drawn last and allowed to break the
 * card's border.
 */
import { PALETTE } from './palette.generated';

/* 4:3. Taller than the 2:1 most previews crop to, because this is made to be
   posted as an image rather than scraped as an OG card — the unfurl uses its
   own tags. The extra height is what the sticker sits in. */
const WIDTH = 1200;
const HEIGHT = 900;

export interface ShareCardInput {
  name: string;
  tagline: string;
  voteCount: number;
  logoUrl?: string;
  /** Shown on the sticker's call to action. Falls back to the slug. */
  shareUrl?: string;
}

/* ------------------------------------------------------------- primitives --- */

/** A hard offset shadow, then the block on top. The house move, in canvas. */
function block(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  { offset = 8, stroke = PALETTE.ink, lineWidth = 5 } = {},
) {
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(x + offset, y + offset, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(x, y, w, h);
}

/** Measures, then draws a labelled chip sized to its own text. */
function chip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  fill: string,
  ink: string,
  { size = 24, padX = 20, height = 50, offset = 6 } = {},
): number {
  ctx.font = `700 ${size}px "Geist Mono Variable", ui-monospace, monospace`;
  const w = ctx.measureText(text).width + padX * 2;

  block(ctx, x, y, w, height, fill, { offset, lineWidth: 4 });

  ctx.fillStyle = ink;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + padX, y + height / 2 + 1);

  return w;
}

/** Wraps to a fixed width, measuring as it goes rather than guessing. */
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }

  if (line && lines.length < maxLines) lines.push(line);

  /* Rather than clipping mid-word, the last line gets an ellipsis — a card that
     ends on a truncated word looks like a bug, not a summary. */
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    if (ctx.measureText(last).width > maxWidth - 20) {
      while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = `${last}…`;
    }
  }

  return lines;
}

/** Loads an image for the canvas, or gives up quietly. */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    /* Needed or the canvas is tainted and toBlob throws. Deck's own uploads are
       same-origin so this is belt and braces for absolute URLs. */
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/** The rocket, drawn as paths — no icon font to load, no glyph to go missing. */
function rocket(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.strokeStyle = PALETTE.ink;
  ctx.fillStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Body, nose up-right.
  ctx.beginPath();
  ctx.moveTo(-6, 6);
  ctx.quadraticCurveTo(6, -16, 26, -24);
  ctx.quadraticCurveTo(18, -4, -2, 12);
  ctx.closePath();
  ctx.stroke();

  // Fins.
  ctx.beginPath();
  ctx.moveTo(-6, 6);
  ctx.lineTo(-18, 10);
  ctx.lineTo(-10, 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2, 12);
  ctx.lineTo(2, 22);
  ctx.lineTo(8, 14);
  ctx.stroke();

  // Window.
  ctx.beginPath();
  ctx.arc(9, -7, 4.5, 0, Math.PI * 2);
  ctx.stroke();

  // Exhaust streaks.
  for (const [x1, y1, x2, y2] of [
    [-14, 20, -24, 30],
    [-4, 26, -12, 34],
    [-22, 12, -32, 18],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

/** Little four-point sparkles, the marks scattered around the sticker. */
function sparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.stroke();
}

/* ------------------------------------------------------------------ card --- */

export async function drawShareCard(input: ShareCardInput): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  /* The fonts are bundled and may not have been used yet on this page; without
     this the first draw silently falls back to a system face. */
  if (document.fonts?.ready) {
    try {
      await document.fonts.load('900 96px "Archivo Black"');
      await document.fonts.load('400 30px "Geist Variable"');
      await document.fonts.load('700 24px "Geist Mono Variable"');
      await document.fonts.ready;
    } catch {
      /* Font loading is best-effort; the card still draws. */
    }
  }

  ctx.fillStyle = PALETTE.canvas;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  /* ---- the launch card ---------------------------------------------------- */

  const cardX = 56;
  const cardY = 48;
  const cardW = WIDTH - cardX * 2;
  const cardH = 560;

  block(ctx, cardX, cardY, cardW, cardH, PALETTE.canvas, { offset: 12, lineWidth: 6 });

  // Grid, clipped to the card so it reads as the card's own paper.
  ctx.save();
  ctx.beginPath();
  ctx.rect(cardX, cardY, cardW, cardH);
  ctx.clip();
  ctx.strokeStyle = 'rgba(17,17,17,0.06)';
  ctx.lineWidth = 2;
  for (let x = cardX; x <= cardX + cardW; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, cardY);
    ctx.lineTo(x, cardY + cardH);
    ctx.stroke();
  }
  for (let y = cardY; y <= cardY + cardH; y += 48) {
    ctx.beginPath();
    ctx.moveTo(cardX, y);
    ctx.lineTo(cardX + cardW, y);
    ctx.stroke();
  }
  ctx.restore();

  const left = cardX + 52;

  chip(ctx, left, cardY + 44, 'LAUNCHED ON DECK', PALETTE.pop, PALETTE.onPop);

  // The product name, shrinking to fit rather than wrapping to three lines.
  let nameSize = 108;
  const nameRoom = cardW - 104 - 340;
  ctx.font = `900 ${nameSize}px "Archivo Black", Impact, sans-serif`;
  while (ctx.measureText(input.name.toUpperCase()).width > nameRoom && nameSize > 48) {
    nameSize -= 4;
    ctx.font = `900 ${nameSize}px "Archivo Black", Impact, sans-serif`;
  }
  ctx.fillStyle = PALETTE.ink;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillText(input.name.toUpperCase(), left, cardY + 232);

  // Tagline.
  ctx.font = '400 30px "Geist Variable", system-ui, sans-serif';
  ctx.fillStyle = '#55534e';
  let ty = cardY + 282;
  for (const line of wrap(ctx, input.tagline, nameRoom, 2)) {
    ty += 42;
    ctx.fillText(line, left, ty);
  }

  // Votes, in the inverted pairing so the two chips are a pair.
  if (input.voteCount > 0) {
    chip(
      ctx,
      left,
      cardY + 400,
      `▲ ${input.voteCount} ${input.voteCount === 1 ? 'VOTE' : 'VOTES'}`,
      PALETTE.deep,
      PALETTE.onDeep,
      { size: 26, height: 56 },
    );
  }

  // The logo tile, top right.
  const tile = 300;
  const tileX = cardX + cardW - tile - 52;
  const tileY = cardY + 80;

  if (input.logoUrl) {
    const logo = await loadImage(input.logoUrl);
    if (logo) {
      block(ctx, tileX, tileY, tile, tile, '#ffffff', { offset: 10, lineWidth: 6 });
      ctx.save();
      ctx.beginPath();
      ctx.rect(tileX + 3, tileY + 3, tile - 6, tile - 6);
      ctx.clip();
      ctx.drawImage(logo, tileX, tileY, tile, tile);
      ctx.restore();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 6;
      ctx.strokeRect(tileX, tileY, tile, tile);
    }
  }

  /* ---- the announcement sticker ------------------------------------------- */

  /* Drawn last and overlapping the card's bottom edge on purpose — the break is
     what makes the two read as separate objects stacked, rather than one panel
     with a dark region in it. */
  const stickX = 300;
  const stickY = 520;
  const stickW = WIDTH - stickX - 90;
  const stickH = 300;

  // A bone keyline behind the sticker, so it separates from the card it covers.
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(stickX - 6 + 10, stickY - 6 + 10, stickW + 12, stickH + 12);
  ctx.fillStyle = PALETTE.canvas;
  ctx.fillRect(stickX - 10, stickY - 10, stickW + 20, stickH + 20);

  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(stickX, stickY, stickW, stickH);

  // Eyebrow: a dot, the sentence, and the wordmark reversed out.
  ctx.fillStyle = PALETTE.pop;
  ctx.beginPath();
  ctx.arc(stickX + 40, stickY + 44, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '700 23px "Geist Mono Variable", ui-monospace, monospace';
  ctx.fillStyle = PALETTE.canvas;
  ctx.textBaseline = 'middle';
  ctx.fillText('WE JUST LAUNCHED ON', stickX + 64, stickY + 45);

  const markX = stickX + 64 + ctx.measureText('WE JUST LAUNCHED ON').width + 22;
  ctx.font = '900 30px "Archivo Black", Impact, sans-serif';
  const markW = ctx.measureText('DECK').width + 28;
  ctx.fillStyle = PALETTE.canvas;
  ctx.fillRect(markX, stickY + 22, markW, 46);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText('DECK', markX + 14, stickY + 46);

  // The shout.
  ctx.font = '900 84px "Archivo Black", Impact, sans-serif';
  ctx.fillStyle = PALETTE.canvas;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText("WE'RE LIVE!", stickX + 40, stickY + 152);

  ctx.font = '400 26px "Geist Variable", system-ui, sans-serif';
  ctx.fillStyle = PALETTE.canvas;
  ctx.fillText(`Check out ${input.name} on Deck and support us!`, stickX + 40, stickY + 196);

  // Call to action bar.
  const barY = stickY + 220;
  const barH = 58;
  ctx.fillStyle = PALETTE.pop;
  ctx.fillRect(stickX + 40, barY, stickW - 80, barH);

  ctx.font = '700 24px "Geist Mono Variable", ui-monospace, monospace';
  ctx.fillStyle = PALETTE.onPop;
  ctx.textBaseline = 'middle';
  ctx.fillText('SUPPORT US', stickX + 62, barY + barH / 2 + 1);

  ctx.font = '400 26px "Geist Variable", system-ui, sans-serif';
  ctx.fillText('→', stickX + 220, barY + barH / 2 + 1);

  ctx.font = '700 24px "Geist Mono Variable", ui-monospace, monospace';
  ctx.fillText(input.shareUrl ?? 'deck.so', stickX + 280, barY + barH / 2 + 1);

  // The rocket square, hanging off the sticker's left edge.
  const rocketSize = 176;
  const rocketX = stickX - rocketSize + 4;
  const rocketY = stickY + 46;
  block(ctx, rocketX, rocketY, rocketSize, rocketSize, PALETTE.pop, { offset: 0, lineWidth: 6 });
  rocket(ctx, rocketX + rocketSize / 2, rocketY + rocketSize / 2, 2.1);

  // Sparkles, the hand-drawn marks around the sticker.
  sparkle(ctx, 148, 700, 18);
  sparkle(ctx, 108, 760, 12);
  sparkle(ctx, 196, 776, 10);
  sparkle(ctx, WIDTH - 52, 700, 14);
  sparkle(ctx, WIDTH - 96, 840, 11);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}
