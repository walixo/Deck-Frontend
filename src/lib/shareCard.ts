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
 */

/* 2:1, which is what every social preview crops toward. */
const WIDTH = 1200;
const HEIGHT = 600;

export interface ShareCardInput {
  name: string;
  tagline: string;
  voteCount: number;
  logoUrl?: string;
}

const PALETTE = {
  canvas: '#faf9f5',
  ink: '#111111',
  lavender: '#b8a9fa',
  acid: '#c6ff3d',
};

/** Wraps to a fixed width, measuring as it goes rather than guessing. */
function wrap(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
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
    if (context.measureText(last).width > maxWidth - 20) {
      while (last.length > 1 && context.measureText(`${last}…`).width > maxWidth) {
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
      await document.fonts.load('900 82px "Archivo Black"');
      await document.fonts.load('600 34px "Geist Variable"');
      await document.fonts.ready;
    } catch {
      /* Font loading is best-effort; the card still draws. */
    }
  }

  ctx.fillStyle = PALETTE.canvas;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // The grid, the same texture the hero uses.
  ctx.strokeStyle = 'rgba(17,17,17,0.07)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= WIDTH; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  // Hard border, as on every surface in the app.
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, WIDTH - 10, HEIGHT - 10);

  const left = 80;
  let y = 118;

  // The eyebrow: a solid block with the wordmark in it.
  ctx.font = '700 22px ui-monospace, Menlo, monospace';
  const eyebrow = 'LAUNCHED ON DECK';
  const eyebrowWidth = ctx.measureText(eyebrow).width + 36;
  ctx.fillStyle = PALETTE.lavender;
  ctx.fillRect(left, y - 34, eyebrowWidth, 48);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.strokeRect(left, y - 34, eyebrowWidth, 48);
  ctx.fillStyle = PALETTE.ink;
  ctx.textBaseline = 'middle';
  ctx.fillText(eyebrow, left + 18, y - 9);

  y += 92;

  // The product name, shrinking to fit rather than wrapping to three lines.
  let nameSize = 92;
  ctx.font = `900 ${nameSize}px "Archivo Black", Impact, sans-serif`;
  while (ctx.measureText(input.name).width > WIDTH - left * 2 && nameSize > 44) {
    nameSize -= 4;
    ctx.font = `900 ${nameSize}px "Archivo Black", Impact, sans-serif`;
  }
  ctx.fillStyle = PALETTE.ink;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(input.name.toUpperCase(), left, y);

  y += 56;

  ctx.font = '400 34px "Geist Variable", system-ui, sans-serif';
  ctx.fillStyle = '#55534e';
  for (const line of wrap(ctx, input.tagline, WIDTH - left * 2 - 220, 2)) {
    y += 46;
    ctx.fillText(line, left, y);
  }

  // The vote count, bottom-left, in the acid block.
  if (input.voteCount > 0) {
    const votes = `▲ ${input.voteCount} ${input.voteCount === 1 ? 'VOTE' : 'VOTES'}`;
    ctx.font = '700 26px ui-monospace, Menlo, monospace';
    const votesWidth = ctx.measureText(votes).width + 40;
    const boxY = HEIGHT - 128;
    ctx.fillStyle = PALETTE.acid;
    ctx.fillRect(left, boxY, votesWidth, 56);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 4;
    ctx.strokeRect(left, boxY, votesWidth, 56);
    ctx.fillStyle = PALETTE.ink;
    ctx.textBaseline = 'middle';
    ctx.fillText(votes, left + 20, boxY + 29);
  }

  // The logo, right-hand side, in a bordered tile with a hard shadow.
  if (input.logoUrl) {
    const logo = await loadImage(input.logoUrl);
    if (logo) {
      const size = 200;
      const x = WIDTH - left - size;
      const top = (HEIGHT - size) / 2;
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(x + 12, top + 12, size, size);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, top, size, size);
      ctx.drawImage(logo, x, top, size, size);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 6;
      ctx.strokeRect(x, top, size, size);
    }
  }

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}
