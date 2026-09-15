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

/**
 * Three cards, not one, because "share" is three different posts.
 *
 * The shape is the feature. A landscape card posted to Instagram is a letterbox
 * with grey above and below it; a portrait poster pasted into Slack is a column
 * nobody scrolls. So each variant owns an aspect ratio *and* the composition
 * that ratio can actually hold — the landscape one has room beside the name for
 * a sticker, the square one puts a number where the sticker was, and the tall
 * one stacks because a 4:5 column has no sideways to spare.
 *
 * They share every primitive below and the palette, so all three are the same
 * artefact in three cuts rather than three designs that happen to coexist.
 */
export type ShareCardVariant = 'launch' | 'board' | 'poster';

export interface ShareCardInput {
  name: string;
  tagline: string;
  voteCount: number;
  logoUrl?: string;
  /** Shown on the call to action. Falls back to the slug. */
  shareUrl?: string;
  /** Which cut to draw. The landscape announcement, unless told otherwise. */
  variant?: ShareCardVariant;
  /** Position on the day's board. Only the `board` cut shows it. */
  rank?: number;
  /** ISO launch date. The `board` cut stamps it when there is no rank. */
  launchDate?: string;
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

/** `chip`, measured first so it can be hung off a centre line. */
function centreChip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  text: string,
  fill: string,
  ink: string,
  options: { size?: number; padX?: number; height?: number; offset?: number } = {},
): number {
  const size = options.size ?? 24;
  const padX = options.padX ?? 20;
  ctx.font = `700 ${size}px "Geist Mono Variable", ui-monospace, monospace`;
  const w = ctx.measureText(text).width + padX * 2;
  return chip(ctx, cx - w / 2, y, text, fill, ink, options);
}

/**
 * The faint 48px grid, clipped to one block.
 *
 * Clipped rather than drawn across the whole canvas, so it reads as that card's
 * own paper stock instead of as a background the card is sitting on.
 */
function paper(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(17,17,17,0.06)';
  ctx.lineWidth = 2;
  for (let gx = x; gx <= x + w; gx += 48) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y; gy <= y + h; gy += 48) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Sets the display face as large as will fit on one line, and leaves it set.
 *
 * Shrinking rather than wrapping, because a product name is a name — broken
 * over two lines it stops being read as one word, and the cards are built
 * around the name occupying exactly one band.
 */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  room: number,
  from: number,
  floor: number,
): number {
  let size = from;
  ctx.font = `900 ${size}px "Archivo Black", Impact, sans-serif`;
  while (ctx.measureText(text).width > room && size > floor) {
    size -= 4;
    ctx.font = `900 ${size}px "Archivo Black", Impact, sans-serif`;
  }
  return size;
}

/**
 * The product mark in a white tile.
 *
 * Always draws something. A launch with no logo used to leave the corner it
 * would have occupied simply empty, which reads as a card that failed to load
 * rather than as a card without a logo — so the tile falls back to the initial,
 * the same answer `Avatar` and `ItemLogo` give everywhere else on the site.
 */
async function stamp(
  ctx: CanvasRenderingContext2D,
  src: string | undefined,
  x: number,
  y: number,
  size: number,
  fallback = '',
) {
  block(ctx, x, y, size, size, '#ffffff', { offset: 10, lineWidth: 6 });

  const image = src ? await loadImage(src) : null;
  if (image) {
    ctx.save();
    ctx.beginPath();
    /* Inset by the stroke so the image never paints over its own border. */
    ctx.rect(x + 3, y + 3, size - 6, size - 6);
    ctx.clip();
    ctx.drawImage(image, x, y, size, size);
    ctx.restore();
  } else if (fallback) {
    ctx.fillStyle = PALETTE.pop;
    ctx.fillRect(x + 3, y + 3, size - 6, size - 6);
    ctx.fillStyle = PALETTE.onPop;
    ctx.font = `900 ${Math.round(size * 0.5)}px "Archivo Black", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fallback.slice(0, 1).toUpperCase(), x + size / 2, y + size / 2 + size * 0.04);
    ctx.textAlign = 'left';
  }

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 6;
  ctx.strokeRect(x, y, size, size);
}

/** The launch day as a two-line stamp — "08" over "SEP 2026". */
function dayStamp(iso?: string): { big: string; small: string } | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return {
    big: String(date.getUTCDate()),
    /* UTC, because the board's day is UTC — a card that says the 8th to its
       maker and the 7th to a reader further west is worse than no date. */
    small: date
      .toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
      .toUpperCase(),
  };
}

/** DECK, reversed out of a block. Returns its width so a line can carry on. */
function wordmark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fill: string,
  ink: string,
  size = 30,
): number {
  ctx.font = `900 ${size}px "Archivo Black", Impact, sans-serif`;
  const w = ctx.measureText('DECK').width + 28;
  const h = size + 16;

  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('DECK', x + 14, y + h / 2 + 1);

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

/* --------------------------------------------------------------- the cuts --- */

/**
 * The announcement. 1200x900, for X, LinkedIn and Slack.
 *
 * Two stacked objects: the launch card, and a sticker overlapping its bottom
 * edge. The overlap is the whole trick — it is what makes the thing read as a
 * designed artefact rather than a screenshot, and it is why the sticker is
 * drawn last and allowed to break the card's border.
 */
async function paintLaunch(ctx: CanvasRenderingContext2D, input: ShareCardInput) {
  /* Restated here rather than read from the registry: every number below is a
     position inside this frame, and a painter that could be handed a different
     one would be lying about that. */
  const WIDTH = 1200;

  /* ---- the launch card ---------------------------------------------------- */

  const cardX = 56;
  const cardY = 48;
  const cardW = WIDTH - cardX * 2;
  const cardH = 560;

  block(ctx, cardX, cardY, cardW, cardH, PALETTE.canvas, { offset: 12, lineWidth: 6 });
  paper(ctx, cardX, cardY, cardW, cardH);

  const left = cardX + 52;

  chip(ctx, left, cardY + 44, 'LAUNCHED ON DECK', PALETTE.pop, PALETTE.onPop);

  // The product name, shrinking to fit rather than wrapping to three lines.
  const nameRoom = cardW - 104 - 340;
  fitText(ctx, input.name.toUpperCase(), nameRoom, 108, 48);
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
  await stamp(ctx, input.logoUrl, cardX + cardW - tile - 52, cardY + 80, tile, input.name);

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
  wordmark(ctx, markX, stickY + 22, PALETTE.canvas, PALETTE.ink);

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
}

/**
 * The scoreboard. 1080x1080, for Instagram and LinkedIn.
 *
 * Square is the ratio with the least room for a sentence, so this one leads
 * with a number instead. The vote count is the largest thing on the card and
 * the product name sits under it — the opposite emphasis to the announcement,
 * which is the point: this is the card you post on day two, when the number is
 * the news.
 */
async function paintBoard(ctx: CanvasRenderingContext2D, input: ShareCardInput) {
  const SIDE = 1080;
  const cardX = 48;
  const cardW = SIDE - cardX * 2;

  block(ctx, cardX, cardX, cardW, cardW, PALETTE.canvas, { offset: 12, lineWidth: 6 });
  paper(ctx, cardX, cardX, cardW, cardW);

  const left = cardX + 56;
  const right = cardX + cardW - 56;

  chip(ctx, left, cardX + 44, input.rank ? 'ON THE BOARD' : 'LAUNCHED ON DECK', PALETTE.pop, PALETTE.onPop);

  /* The tile and the medal are the same 232px square, side by side, because a
     product mark and a placing are the two facts this card is making — sizing
     one above the other would be an argument about which. */
  const tile = 232;
  const tileY = cardX + 132;
  await stamp(ctx, input.logoUrl, left, tileY, tile, input.name);

  /*
   * The block beside the mark says where the launch placed, or when it went
   * up.
   *
   * It is never empty, which is why the fallback exists at all. A placing is
   * the better fact and most cards will not have one — a square with a hole in
   * the top right reads as a card that failed to finish rather than as a card
   * about a launch that has not been ranked.
   */
  const stampText = input.rank
    ? { big: `#${input.rank}`, small: 'TODAY' }
    : dayStamp(input.launchDate);

  if (stampText) {
    const medalX = right - tile;
    block(ctx, medalX, tileY, tile, tile, PALETTE.pop, { offset: 10, lineWidth: 6 });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = PALETTE.onPop;
    fitText(ctx, stampText.big, tile - 40, 130, 64);
    ctx.fillText(stampText.big, medalX + tile / 2, tileY + 148);
    ctx.font = '700 24px "Geist Mono Variable", ui-monospace, monospace';
    ctx.fillText(stampText.small, medalX + tile / 2, tileY + 190);
    ctx.textAlign = 'left';
  }

  // The name, shrinking to fit one line rather than wrapping.
  fitText(ctx, input.name.toUpperCase(), cardW - 112, 96, 46);
  ctx.fillStyle = PALETTE.ink;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(input.name.toUpperCase(), left, 560);

  ctx.font = '400 30px "Geist Variable", system-ui, sans-serif';
  ctx.fillStyle = '#55534e';
  let ty = 590;
  for (const line of wrap(ctx, input.tagline, cardW - 112, 2)) {
    ty += 42;
    ctx.fillText(line, left, ty);
  }

  /* The tally bar, in the inverted pair. Full width of the card's text column,
     because a number this size wants a wall behind it rather than a chip. */
  const barY = 736;
  const barH = 200;
  block(ctx, left, barY, cardW - 112, barH, PALETTE.deep, { offset: 10, lineWidth: 6 });

  ctx.fillStyle = PALETTE.onDeep;
  ctx.textBaseline = 'alphabetic';
  ctx.font = '900 132px "Archivo Black", Impact, sans-serif';
  ctx.fillText(String(input.voteCount), left + 44, barY + 138);

  const countW = ctx.measureText(String(input.voteCount)).width;
  ctx.font = '700 26px "Geist Mono Variable", ui-monospace, monospace';
  ctx.fillText(input.voteCount === 1 ? 'VOTE' : 'VOTES', left + 68 + countW, barY + 92);
  ctx.fillText(input.shareUrl ?? 'deck.so', left + 68 + countW, barY + 138);

  wordmark(ctx, right - 148, barY + 44, PALETTE.canvas, PALETTE.ink);

  sparkle(ctx, cardX + 22, 520, 16);
  sparkle(ctx, SIDE - 40, 300, 13);
  sparkle(ctx, SIDE - 66, 360, 9);
}

/**
 * The poster. 1080x1350, for Stories, Threads and anywhere that crops tall.
 *
 * Everything on one centre line. A 4:5 column has no sideways to spare, so the
 * two-object overlap the landscape cut is built around would have nowhere to
 * overlap *into* — this one stacks instead, and the product mark gets to be
 * 500px because that is the one thing a tall frame can afford.
 */
async function paintPoster(ctx: CanvasRenderingContext2D, input: ShareCardInput) {
  const WIDTH = 1080;
  const HEIGHT = 1350;
  const cardX = 48;
  const cardW = WIDTH - cardX * 2;
  const cardH = HEIGHT - cardX * 2;
  const mid = WIDTH / 2;

  block(ctx, cardX, cardX, cardW, cardH, PALETTE.canvas, { offset: 12, lineWidth: 6 });
  paper(ctx, cardX, cardX, cardW, cardH);

  centreChip(ctx, mid, cardX + 56, 'NOW ON DECK', PALETTE.pop, PALETTE.onPop);

  const tile = 460;
  await stamp(ctx, input.logoUrl, mid - tile / 2, cardX + 168, tile, input.name);

  ctx.textAlign = 'center';
  fitText(ctx, input.name.toUpperCase(), cardW - 120, 104, 44);
  ctx.fillStyle = PALETTE.ink;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(input.name.toUpperCase(), mid, 830);

  ctx.font = '400 32px "Geist Variable", system-ui, sans-serif';
  ctx.fillStyle = '#55534e';
  let ty = 862;
  for (const line of wrap(ctx, input.tagline, cardW - 160, 3)) {
    ty += 46;
    ctx.fillText(line, mid, ty);
  }
  ctx.textAlign = 'left';

  if (input.voteCount > 0) {
    centreChip(
      ctx,
      mid,
      1050,
      `▲ ${input.voteCount} ${input.voteCount === 1 ? 'VOTE' : 'VOTES'}`,
      PALETTE.deep,
      PALETTE.onDeep,
      { size: 28, height: 62 },
    );
  }

  /* The footer is the only full-bleed element on any of the three cuts. On a
     poster the eye leaves at the bottom edge, so that is where the address
     goes — a chip floating above it would be one more thing to look past. */
  const footY = cardX + cardH - 108;
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(cardX + 3, footY, cardW - 6, 105);

  wordmark(ctx, cardX + 44, footY + 30, PALETTE.canvas, PALETTE.ink);

  ctx.font = '700 26px "Geist Mono Variable", ui-monospace, monospace';
  ctx.fillStyle = PALETTE.canvas;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(input.shareUrl ?? 'deck.so', cardX + cardW - 44, footY + 54);
  ctx.textAlign = 'left';

  sparkle(ctx, 92, 300, 17);
  sparkle(ctx, WIDTH - 78, 268, 12);
  sparkle(ctx, WIDTH - 108, 330, 8);
  sparkle(ctx, 108, 980, 11);
}

/* -------------------------------------------------------------- registry --- */

interface Cut {
  /** What the maker picks it by. */
  label: string;
  /** Where it is meant to go, which is the only reason to choose one. */
  blurb: string;
  width: number;
  height: number;
  paint: (ctx: CanvasRenderingContext2D, input: ShareCardInput) => Promise<void>;
}

export const SHARE_CARD_CUTS: Record<ShareCardVariant, Cut> = {
  launch: {
    label: 'Announcement',
    blurb: 'Landscape, 1200×900 — X, LinkedIn, Slack',
    width: 1200,
    height: 900,
    paint: paintLaunch,
  },
  board: {
    label: 'Scoreboard',
    blurb: 'Square, 1080×1080 — Instagram, LinkedIn',
    width: 1080,
    height: 1080,
    paint: paintBoard,
  },
  poster: {
    label: 'Poster',
    blurb: 'Portrait, 1080×1350 — Stories, Threads',
    width: 1080,
    height: 1350,
    paint: paintPoster,
  },
};

/** Fixed order, so the picker and the showcase never disagree. */
export const SHARE_CARD_VARIANTS: ShareCardVariant[] = ['launch', 'board', 'poster'];

/**
 * The fonts are bundled and may not have been used yet on this page; without
 * this the first draw silently falls back to a system face.
 */
async function ensureFonts(): Promise<void> {
  if (!document.fonts?.ready) return;
  try {
    await document.fonts.load('900 96px "Archivo Black"');
    await document.fonts.load('400 30px "Geist Variable"');
    await document.fonts.load('700 24px "Geist Mono Variable"');
    await document.fonts.ready;
  } catch {
    /* Font loading is best-effort; the card still draws. */
  }
}

/**
 * Paints one cut into a canvas that is already on the page.
 *
 * `scale` is the whole reason this is separate from `drawShareCard`. The
 * showcase on the home page draws all three at once, and three canvases at
 * full size is 4.3 million pixels of backing store for pictures that are
 * rendered 300px wide. Everything is drawn in the cut's own coordinates and the
 * transform does the reduction, so a preview and a download are the same
 * composition rather than two that have to be kept in step.
 */
export async function paintShareCard(
  canvas: HTMLCanvasElement,
  input: ShareCardInput,
  scale = 1,
): Promise<void> {
  const cut = SHARE_CARD_CUTS[input.variant ?? 'launch'];
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = Math.round(cut.width * scale);
  canvas.height = Math.round(cut.height * scale);

  await ensureFonts();

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = PALETTE.canvas;
  ctx.fillRect(0, 0, cut.width, cut.height);

  await cut.paint(ctx, input);
}

/* ------------------------------------------------------------------ card --- */

/** Paints a cut off-screen at full size and hands back a PNG. */
export async function drawShareCard(input: ShareCardInput): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  await paintShareCard(canvas, input);
  if (!canvas.width) return null;

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}
