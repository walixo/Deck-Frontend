/**
 * Pulls the dominant colour out of a product image.
 *
 * Deck's contract says the chrome stays neutral so it never fights a logo. This
 * is the other half of that idea: rather than picking a colour for a launch, the
 * launch supplies its own, so the panel can never clash with the thing sitting
 * on it. The colour on the page comes from the products — literally.
 *
 * Three decisions do most of the work:
 *
 *  1. **Chromatic pixels only.** The naive dominant colour of almost any logo is
 *     its background — white, or black. Both are useless as a panel colour and
 *     both are the majority of pixels. Near-neutral and near-transparent pixels
 *     are discarded before counting, so what comes back is the colour a person
 *     would name if you asked them what colour the logo is.
 *
 *  2. **Quantised into buckets.** Photographs never repeat an exact RGB value,
 *     so counting raw pixels returns a meaningless one-vote winner. Colours are
 *     rounded into 5-bit-per-channel bins first, then the winning bin reports
 *     the *average* of the pixels that landed in it — which keeps the result
 *     smooth rather than snapping to a bin corner.
 *
 *  3. **Its own text colour travels with it.** The whole point of extracting a
 *     colour is to put type on it, and an arbitrary hue can need either black or
 *     white. Returning the fill without the ink would guarantee a contrast bug
 *     the first time somebody launches a navy logo.
 */

export interface Swatch {
  /** The extracted fill, as a hex string. */
  hex: string;
  /**
   * The runner-up colour, when the logo has a genuine second one.
   *
   * Null for a single-colour mark, which is most of them. Only offered so a
   * caller *can* build a two-stop gradient — see the note on gradients in
   * design/CONTRACT.md before reaching for it.
   */
  secondary: string | null;
  /**
   * The far stop of a two-tone treatment. Always present.
   *
   * The genuine `secondary` when the logo has one, and otherwise a tone derived
   * from the primary — same family, rotated and deepened. Derivation matters
   * more than it sounds: most logos are one chromatic colour on white or black,
   * and both of those are discarded as non-chromatic, so a gradient that waited
   * for a real second colour would almost never render. A wall where three
   * panels in thirty have a gradient looks broken rather than varied.
   */
  gradientTo: string;
  /** Whichever of ink or bone clears more contrast on it. */
  ink: '#111111' | '#faf9f5';
  /** Contrast of `ink` against `hex`. Always the better of the two options. */
  contrast: number;
}

/* Sampling grid. 32×32 is ~1000 pixels — plenty for a dominant hue, and small
   enough that the whole thing costs well under a millisecond per image. */
const SAMPLE = 32;

/** Bin width per channel: 256 >> 3 = 32 bins, i.e. 5 bits of colour. */
const SHIFT = 3;

const cache = new Map<string, Swatch | null>();
const inflight = new Map<string, Promise<Swatch | null>>();

function channel(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const hex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/**
 * Saturation in HSL terms, without the cost of a full conversion.
 * Used only to decide whether a pixel is chromatic enough to count.
 */
function saturationOf(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const l = (max + min) / 2 / 255;
  const d = (max - min) / 255;
  return l > 0.5 ? d / (2 - max / 255 - min / 255) : d / (max / 255 + min / 255);
}

/** AA for normal text. The panel carries 10px mono labels, not just display type. */
const FLOOR = 4.5;

const INK = luminance(17, 17, 17);
const BONE = luminance(250, 249, 245);

/**
 * Nudges a fill until its text clears AA, keeping its hue.
 *
 * A dominant colour arrives from a stranger's logo, so it lands wherever it
 * lands — and plenty of real brand colours sit in the band where neither black
 * nor white reaches 4.5:1. A mid red is the classic case: 4.3:1 on black, 4.9:1
 * on white, so it reads fine under a headline and fails under a 10px label.
 *
 * Rather than reject those colours or quietly ship the failure, the fill is
 * blended toward white or black — whichever direction helps the ink already
 * winning — in small steps until it clears. Blending toward a neutral preserves
 * hue while moving lightness, so the panel still reads as the product's colour;
 * it is simply a tint or shade of it.
 *
 * The contract does not get to be optional just because the colour came from
 * outside. See design/CONTRACT.md rule 2.
 */
/**
 * A companion tone for the far end of a gradient.
 *
 * Rotated 28° around the hue wheel and deepened, which keeps it recognisably
 * the same colour while giving the ramp somewhere to go. Rotating rather than
 * only darkening is what stops it reading as a drop shadow.
 */
function companion(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    const [rr, gg, bb] = [r / 255, g / 255, b / 255];
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const h2 = (h + 28) % 360;
  const l2 = Math.max(0.16, l * 0.78);

  /* HSL back to RGB. */
  const c = (1 - Math.abs(2 * l2 - 1)) * sat;
  const x = c * (1 - Math.abs(((h2 / 60) % 2) - 1));
  const m = l2 - c / 2;
  const seg = Math.floor(h2 / 60) % 6;
  const table: [number, number, number][] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [pr, pg, pb] = table[seg];
  return hex((pr + m) * 255, (pg + m) * 255, (pb + m) * 255);
}

function legible(r: number, g: number, b: number, secondary: string | null = null): Swatch {
  let [cr, cg, cb] = [r, g, b];

  for (let step = 0; step < 24; step += 1) {
    const l = luminance(cr, cg, cb);
    const onInk = ratio(l, INK);
    const onBone = ratio(l, BONE);
    const best = Math.max(onInk, onBone);

    if (best >= FLOOR) {
      const fill = hex(cr, cg, cb);
      const gradientTo = secondary ?? companion(cr, cg, cb);
      return onInk >= onBone
        ? { hex: fill, secondary, gradientTo, ink: '#111111', contrast: onInk }
        : { hex: fill, secondary, gradientTo, ink: '#faf9f5', contrast: onBone };
    }

    /* Move away from whichever ink is currently closer to passing: a fill that
       favours dark text wants to get lighter, and vice versa. */
    const toward = onInk >= onBone ? 255 : 0;
    cr += (toward - cr) * 0.08;
    cg += (toward - cg) * 0.08;
    cb += (toward - cb) * 0.08;
  }

  /* Unreachable for any real colour — 24 steps of 8% lands on near-white or
     near-black, both of which clear easily. Kept so the function is total. */
  const l = luminance(cr, cg, cb);
  const onInk = ratio(l, INK);
  const fill = hex(cr, cg, cb);
  const gradientTo = secondary ?? companion(cr, cg, cb);
  return onInk >= ratio(l, BONE)
    ? { hex: fill, secondary, gradientTo, ink: '#111111', contrast: onInk }
    : { hex: fill, secondary, gradientTo, ink: '#faf9f5', contrast: ratio(l, BONE) };
}

/**
 * A swatch from a colour the launcher picked, rather than one sampled from art.
 *
 * Same treatment as an extracted colour, deliberately: it goes through
 * `legible`, so a maker who picks a mid-yellow gets it nudged until 10px labels
 * clear AA on it, and gets the matching ink and companion tone for free. The
 * contract does not bend for a colour just because a human chose it — a maker
 * picking their own brand colour has no idea what the panel puts on top of it.
 *
 * Returns null for anything that is not a six-digit hex, so a corrupt or
 * hand-edited value falls back to the sampled colour instead of rendering a
 * transparent panel.
 */
export function swatchFromHex(value: string | undefined): Swatch | null {
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) return null;

  const n = parseInt(value.slice(1), 16);
  return legible((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

function extract(image: HTMLImageElement): Swatch | null {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0, SAMPLE, SAMPLE);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
  } catch {
    /* A cross-origin image taints the canvas and getImageData throws. Deck's own
       uploads are same-origin; an absolute URL to somebody else's CDN is not. */
    return null;
  }

  const bins = new Map<number, { n: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];

    if (a < 200) continue;

    /* Discard the near-neutrals. Without this the answer is "white" for almost
       every logo ever drawn, because the backdrop outnumbers the mark. */
    const l = luminance(r, g, b);
    if (l > 0.86 || l < 0.02) continue;
    if (saturationOf(r, g, b) < 0.18) continue;

    const key = ((r >> SHIFT) << 10) | ((g >> SHIFT) << 5) | (b >> SHIFT);
    const bin = bins.get(key);
    if (bin) {
      bin.n += 1;
      bin.r += r;
      bin.g += g;
      bin.b += b;
    } else {
      bins.set(key, { n: 1, r, g, b });
    }
  }

  /*
   * Pick the winner by area, but break near-ties on saturation.
   *
   * Straight pixel count is wrong for a multicoloured logo. A mark split evenly
   * between two colours has no largest bin, so the winner is decided by which
   * one the scan happened to reach first — i.e. by whichever is nearer the
   * top-left. That is stable but meaningless: a red/blue logo comes out red
   * purely because red was on the left.
   *
   * Weighting by saturation fixes the tie in a way that matches what a person
   * would answer. Asked the colour of a logo that is half slate-grey and half
   * hot pink, nobody says grey. Area still dominates — a `0.5 + s` multiplier
   * can only swing a decision between bins already close in size — so a logo
   * with a genuine majority colour is unaffected.
   *
   * A greyscale logo still legitimately has no dominant colour. Returning null
   * lets the caller fall back to a neutral panel rather than inventing a hue.
   */
  let best: { n: number; r: number; g: number; b: number } | null = null;
  let bestScore = 0;

  for (const bin of bins.values()) {
    const saturation = saturationOf(bin.r / bin.n, bin.g / bin.n, bin.b / bin.n);
    const score = bin.n * (0.5 + saturation);
    if (score > bestScore) {
      bestScore = score;
      best = bin;
    }
  }

  if (!best || best.n < 8) return null;

  /*
   * The runner-up, but only when it is a real second colour.
   *
   * It has to be worth at least a fifth of the winner's area — below that it is
   * a stray antialiased edge, not part of the mark — and far enough away in RGB
   * that a gradient between the two would actually be visible. Two neighbouring
   * bins of the same red would otherwise produce a "gradient" nobody can see,
   * which is all cost and no effect.
   */
  let runnerUp: { n: number; r: number; g: number; b: number } | null = null;
  for (const bin of bins.values()) {
    if (bin === best) continue;
    const dr = bin.r / bin.n - best.r / best.n;
    const dg = bin.g / bin.n - best.g / best.n;
    const db = bin.b / bin.n - best.b / best.n;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);
    if (bin.n < best.n * 0.2 || distance < 60) continue;
    if (!runnerUp || bin.n > runnerUp.n) runnerUp = bin;
  }

  const secondary = runnerUp
    ? legible(runnerUp.r / runnerUp.n, runnerUp.g / runnerUp.n, runnerUp.b / runnerUp.n).hex
    : null;

  return legible(best.r / best.n, best.g / best.n, best.b / best.n, secondary);
}

/**
 * Resolves the dominant colour for an image URL, or null when there isn't one.
 *
 * Memoised per URL — the launch wall renders every item twice for its seamless
 * loop, and the same launches reappear across the board and the sidebar, so
 * without this the same image would be decoded a dozen times per page.
 */
export function dominantColour(src: string | undefined): Promise<Swatch | null> {
  if (!src) return Promise.resolve(null);
  if (cache.has(src)) return Promise.resolve(cache.get(src) ?? null);

  const pending = inflight.get(src);
  if (pending) return pending;

  const job = new Promise<Swatch | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(extract(image));
    image.onerror = () => resolve(null);
    image.src = src;
  }).then((swatch) => {
    cache.set(src, swatch);
    inflight.delete(src);
    return swatch;
  });

  inflight.set(src, job);
  return job;
}
