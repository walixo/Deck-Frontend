/**
 * Builds `deck-moods.svg` — a grid of flat-vector characters, one mood each.
 *
 * Colour is read from design/tokens.json rather than hard-coded, because that
 * file is explicitly the one place a Deck hex may live. Swap `active` there (or
 * pass a palette name as argv[2]), re-run, and the whole cast re-skins:
 *
 *     node mockups/build-moods.mjs               # active palette
 *     node mockups/build-moods.mjs lime-slate    # any named palette
 *
 * The characters are composed rather than hand-drawn one by one: a set of head
 * shapes, eye sets, mouths and bodies, combined per panel. Twenty bespoke blobs
 * drift apart from each other; twenty combinations of the same primitives stay
 * a family, which is the whole point of a character system.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, '..', 'design', 'tokens.json'), 'utf8'));

const paletteName = process.argv[2] ?? tokens.active;
const palette = tokens.palettes[paletteName];
if (!palette) {
  throw new Error(
    `Unknown palette "${paletteName}". Available: ${Object.keys(tokens.palettes).join(', ')}`,
  );
}

/*
 * The cast's colour ladder, darkest to lightest. Panels and characters both
 * draw from it; a character is only ever placed on a panel far enough away in
 * value that the silhouette reads. `bone` and `pop` do the heavy lifting on
 * dark panels, `deep` and `mark` on light ones.
 */
const INK = tokens.fixed.ink;
const C = {
  deep: palette.deep,
  mid: palette['deep-hover'],
  mark: palette['mark-light'],
  pop: palette.pop,
  bone: tokens.fixed.bone,
  grey: tokens.fixed['grey-soft'],
};

/*
 * Which colour a face's features are drawn in.
 *
 * Every eye and mouth used to be hard-coded to ink, which works right up until
 * a head is filled with `deep` — then the whole face silently disappears and
 * the panel is just a dark box. Features pick ink or bone off the head's own
 * luminance instead, so any head fill in the ladder stays legible.
 */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function featureOn(fill) {
  return luminance(fill) < 0.45 ? C.bone : INK;
}

const W = 300;
// 5 x 300 wide by 4 x 375 tall = a square 1500 canvas. Square on purpose:
// several PNG exporters (macOS Quick Look among them) fill a square thumbnail
// and silently crop the overhang, which ate the right-hand column.
const H = 375;
const COLS = 5;
const ROWS = 4;
const SW = 4.5; // outline weight

/* ------------------------------------------------------------------ heads */
/* Every head is drawn around (150, 140) and returns the y of its chin, so the
   neck knows where to start. */

const heads = {
  blob: () => ({
    d: 'M150 32c48 0 76 26 76 60 0 20-8 34-8 48 0 22-28 42-68 42s-68-20-68-42c0-14-8-28-8-48 0-34 28-60 76-60Z',
    chin: 222,
  }),
  tallRounded: () => ({
    d: 'M96 60c0-18 24-32 54-32s54 14 54 32v112c0 18-24 32-54 32s-54-14-54-32V60Z',
    chin: 204,
  }),
  wideRounded: () => ({
    d: 'M72 78c0-16 14-28 32-28h92c18 0 32 12 32 28v88c0 16-14 28-32 28h-92c-18 0-32-12-32-28V78Z',
    chin: 194,
  }),
  circle: () => ({ d: 'M150 34a86 86 0 1 1 0 172 86 86 0 0 1 0-172Z', chin: 206 }),
  square: () => ({ d: 'M78 46h144v152H78V46Z', chin: 198 }),
  pentagon: () => ({ d: 'M150 30 232 92 200 194H100L68 92 150 30Z', chin: 194 }),
  // Two lobes — reads as a slightly rubbery, elongated face.
  peanut: () => ({
    d: 'M150 28c40 0 62 24 62 50 0 16-10 26-10 38s12 20 12 38c0 28-26 50-64 50s-64-22-64-50c0-18 12-26 12-38s-10-22-10-38c0-26 22-50 62-50Z',
    chin: 204,
  }),
  // Bumpy cloud — the "big hair" silhouette.
  cloud: () => ({
    d: 'M150 26c22 0 34 10 40 22 20-4 38 8 40 26 18 6 26 24 20 40 8 14 4 34-12 42-2 20-22 32-42 28-12 12-34 14-48 4-16 8-38 2-46-14-20 2-38-12-38-32-10-14-8-34 6-44-4-20 10-38 30-40 8-20 30-34 50-32Z',
    chin: 200,
  }),
  // Spikes — stress, made structural.
  spiky: () => ({
    d: 'M150 22 168 52l30-22 8 36 34-10-8 36 36 4-22 30 32 18-30 20 22 30-36 6 6 34-34-12-10 34-26-24-26 24-10-34-34 12 6-34-36-6 22-30-30-20 32-18-22-30 36-4-8-36 34 10 8-36 30 22L150 22Z',
    chin: 210,
  }),
  arch: () => ({ d: 'M80 196V102a70 70 0 0 1 140 0v94H80Z', chin: 196 }),
  diamond: () => ({ d: 'M150 26 236 118l-86 92-86-92 86-92Z', chin: 210 }),
  // Wavy mass, like hair caught mid-motion.
  wavy: () => ({
    d: 'M92 190c-14-26-16-56-6-84 10-30 34-52 64-54 32-2 60 18 70 48 10 28 6 62-10 90H92Z',
    chin: 190,
  }),
  horns: () => ({
    d: 'M84 190V78l-12-46 44 26h68l44-26-12 46v112H84Z',
    chin: 190,
  }),
  wideOval: () => ({ d: 'M150 44c52 0 88 30 88 76s-36 76-88 76-88-30-88-76 36-76 88-76Z', chin: 196 }),
  tower: () => ({ d: 'M104 20h92v176h-92V20Z', chin: 196 }),
};

/* ------------------------------------------------------------------- eyes */
/* Each takes the eye-line y and returns markup. Pupils are ink on every face
   so the gaze stays legible whatever the head is filled with. */

/* An eyeball is always bone with an ink pupil — that pairing reads on every
   head fill. Only the outline and the drawn-line eyes take the feature colour. */
const eyes = {
  dots: (y, fc) => circle(126, y, 7, fc) + circle(174, y, 7, fc),
  wideDots: (y, fc) => circle(120, y, 9, fc) + circle(180, y, 9, fc),
  rings: (y, fc) =>
    circle(124, y, 15, C.bone, fc) +
    circle(176, y, 15, C.bone, fc) +
    circle(124, y, 6, INK) +
    circle(176, y, 6, INK),
  ringsUp: (y, fc) =>
    circle(124, y, 15, C.bone, fc) +
    circle(176, y, 15, C.bone, fc) +
    circle(124, y - 5, 6, INK) +
    circle(176, y - 5, 6, INK),
  ringsSide: (y, fc) =>
    circle(124, y, 15, C.bone, fc) +
    circle(176, y, 15, C.bone, fc) +
    circle(132, y, 6, INK) +
    circle(184, y, 6, INK),
  // One wide, one small: the classic "wait, what?" asymmetry.
  odd: (y, fc) =>
    circle(124, y, 17, C.bone, fc) + circle(124, y, 7, INK) + circle(178, y, 6, fc),
  happyArcs: (y, fc) =>
    path(`M112 ${y + 4}q14 -18 28 0`, 'none', fc) + path(`M160 ${y + 4}q14 -18 28 0`, 'none', fc),
  sleepyArcs: (y, fc) =>
    path(`M112 ${y - 4}q14 16 28 0`, 'none', fc) + path(`M160 ${y - 4}q14 16 28 0`, 'none', fc),
  // Half-lidded: a full eye with a lid dropped across it.
  halfLid: (y, fc) =>
    circle(124, y, 13, C.bone, fc) +
    circle(176, y, 13, C.bone, fc) +
    circle(124, y + 3, 6, INK) +
    circle(176, y + 3, 6, INK) +
    path(`M110 ${y - 3}h28`, 'none', fc, 6) +
    path(`M162 ${y - 3}h28`, 'none', fc, 6),
  squint: (y, fc) => path(`M112 ${y}h26`, 'none', fc, 6) + path(`M162 ${y}h26`, 'none', fc, 6),
  // Brow angled inward over each eye.
  cross: (y, fc) =>
    circle(126, y + 3, 8, fc) +
    circle(174, y + 3, 8, fc) +
    path(`M110 ${y - 12}L140 ${y - 4}`, 'none', fc, 5) +
    path(`M190 ${y - 12}L160 ${y - 4}`, 'none', fc, 5),
  // One brow up.
  raised: (y, fc) =>
    circle(126, y, 8, fc) +
    circle(174, y, 8, fc) +
    path(`M112 ${y - 16}q14 -6 28 0`, 'none', fc, 5),
  // Rectangular specs, for the head that is concentrating.
  specs: (y, fc) =>
    path(`M104 ${y - 15}h40v30h-40Z`, C.bone, fc) +
    path(`M156 ${y - 15}h40v30h-40Z`, C.bone, fc) +
    path(`M144 ${y}h12`, 'none', fc) +
    circle(124, y, 6, INK) +
    circle(176, y, 6, INK),
};

/* ----------------------------------------------------------------- mouths */

const mouths = {
  smile: (y, fc) => path(`M126 ${y}q24 22 48 0`, 'none', fc),
  // Open smile: an outlined half-disc, filled bone like the teeth and gasp
  // mouths. Filled solid in the feature colour it just read as a dark lump.
  bigSmile: (y, fc) => path(`M120 ${y}a30 30 0 0 0 60 0Z`, C.bone, fc),
  grin: (y, fc) => path(`M116 ${y - 6}h68v8a34 34 0 0 1 -68 0v-8Z`, C.bone, fc),
  flat: (y, fc) => path(`M126 ${y}h48`, 'none', fc),
  frown: (y, fc) => path(`M126 ${y + 8}q24 -22 48 0`, 'none', fc),
  smirk: (y, fc) => path(`M138 ${y + 4}q22 12 34 -10`, 'none', fc),
  dot: (y, fc) => circle(150, y, 6, fc),
  oh: (y, fc) => ellipse(150, y, 12, 16, C.bone, fc),
  gasp: (y, fc) => ellipse(150, y + 2, 17, 22, C.bone, fc),
  wobble: (y, fc) => path(`M124 ${y}q9 -10 18 0t18 0t18 0`, 'none', fc),
  // Teeth: a block with bars, the "bracing myself" mouth.
  teeth: (y, fc) =>
    path(`M116 ${y - 11}h68v22h-68Z`, C.bone, fc) +
    [130, 144, 158, 172].map((x) => path(`M${x} ${y - 11}v22`, 'none', fc, 3)).join(''),
  sigh: (y, fc) => path(`M130 ${y}q20 16 40 -4`, 'none', fc),
};

/* ------------------------------------------------------------------ bodies
   All bodies are cropped by the panel edge, so only the top ~130px matters. */

/*
 * `top` is where the shoulders begin. Every body runs from there to the bottom
 * edge and is cropped by the panel — an earlier version drew fixed-height
 * blocks that stopped short, leaving a strip of background between neck and
 * body on half the grid.
 */
const bodies = {
  round: (top, fill) =>
    path(`M52 ${H}V${top + 52}Q52 ${top} 150 ${top}Q248 ${top} 248 ${top + 52}V${H}Z`, fill, INK),
  square: (top, fill) => path(`M64 ${H}V${top}H236V${H}Z`, fill, INK),
  // A gentle flare. The original ran from a narrow top to the full panel width
  // and read as a lampshade rather than a pair of shoulders.
  sloped: (top, fill) => path(`M48 ${H}L86 ${top}H214L252 ${H}Z`, fill, INK),
  narrow: (top, fill) =>
    path(`M94 ${H}V${top + 34}Q94 ${top} 150 ${top}Q206 ${top} 206 ${top + 34}V${H}Z`, fill, INK),
};

/* ------------------------------------------------------------------ props */

const props = {
  none: () => '',
  // A raised palm, fingers suggested by slots rather than modelled — the same
  // shorthand the reference art uses. Sits clear of the right edge and is
  // cropped at the bottom like the body, so it reads as an arm coming up.
  hand: () =>
    path('M198 360v-74a18 18 0 0 1 18-18h30a18 18 0 0 1 18 18v74Z', C.pop, INK) +
    path('M216 272v30M231 268v34M246 272v30', 'none', INK, 3.5),
  spark: () =>
    path('M240 62 249 90 277 99 249 108 240 136 231 108 203 99 231 90 240 62Z', C.pop, INK),
  drop: () => path('M242 92c9 14 14 21 14 28a14 14 0 0 1 -28 0c0-7 5-14 14-28Z', C.bone, INK),
  // A single antenna with a bulb — "an idea, arriving".
  antenna: () => path('M150 40V26', 'none', INK, 5) + circle(150, 14, 15, C.pop, INK),
};

/* ------------------------------------------------- tiny markup helpers */

function circle(cx, cy, r, fill, stroke) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${
    stroke ? ` stroke="${stroke}" stroke-width="${SW}"` : ''
  }/>`;
}

function ellipse(cx, cy, rx, ry, fill, stroke) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${
    stroke ? ` stroke="${stroke}" stroke-width="${SW}"` : ''
  }/>`;
}

function path(d, fill, stroke, width = SW) {
  return `<path d="${d}" fill="${fill}"${
    stroke ? ` stroke="${stroke}" stroke-width="${width}"` : ''
  } stroke-linecap="round" stroke-linejoin="round"/>`;
}

/* ------------------------------------------------------------- the cast
 *
 * Mood is carried by the combination, not by one feature: a spiky head with
 * gritted teeth is a different feeling from a spiky head with wide eyes, and
 * both are readable without a caption. `bg` and `skin` must sit far enough
 * apart on the ladder above for the silhouette to hold.
 */

const CAST = [
  { mood: 'Shipped it',   head: 'blob',        eye: 'happyArcs', eyeY: 132, mouth: 'bigSmile', mouthY: 176, bg: C.mark, skin: C.pop,  body: 'round',  bodyFill: C.bone, prop: 'none' },
  { mood: 'Curious',      head: 'tallRounded', eye: 'ringsSide', eyeY: 120, mouth: 'dot',      mouthY: 168, bg: C.pop,  skin: C.bone, body: 'narrow', bodyFill: C.mid,  prop: 'none' },
  { mood: 'Focused',      head: 'square',      eye: 'specs',     eyeY: 116, mouth: 'flat',     mouthY: 160, bg: C.bone, skin: C.deep, body: 'square', bodyFill: C.mark, prop: 'none' },
  { mood: 'Overwhelmed',  head: 'spiky',       eye: 'wideDots',  eyeY: 112, mouth: 'wobble',   mouthY: 158, bg: C.mid,  skin: C.pop,  body: 'round',  bodyFill: C.bone, prop: 'drop' },
  { mood: 'Calm',         head: 'wideOval',    eye: 'sleepyArcs', eyeY: 118, mouth: 'smile',   mouthY: 152, bg: C.deep, skin: C.bone, body: 'sloped', bodyFill: C.pop,  prop: 'none' },

  { mood: 'Surprised',    head: 'circle',      eye: 'rings',     eyeY: 112, mouth: 'gasp',     mouthY: 166, bg: C.pop,  skin: C.mark, body: 'round',  bodyFill: C.deep, prop: 'none' },
  { mood: 'Sceptical',    head: 'arch',        eye: 'raised',    eyeY: 122, mouth: 'smirk',    mouthY: 166, bg: C.mark, skin: C.bone, body: 'square', bodyFill: C.mid,  prop: 'none' },
  { mood: 'Exhausted',    head: 'peanut',      eye: 'halfLid',   eyeY: 120, mouth: 'sigh',     mouthY: 172, bg: C.bone, skin: C.mid,  body: 'round',  bodyFill: C.pop,  prop: 'none' },
  { mood: 'Excited',      head: 'cloud',       eye: 'wideDots',  eyeY: 116, mouth: 'grin',     mouthY: 166, bg: C.deep, skin: C.pop,  body: 'round',  bodyFill: C.bone, prop: 'none' },
  { mood: 'Thinking',     head: 'tower',       eye: 'ringsUp',   eyeY: 106, mouth: 'flat',     mouthY: 158, bg: C.pop,  skin: C.deep, body: 'narrow', bodyFill: C.mark, prop: 'none' },

  { mood: 'Nervous',      head: 'tallRounded', eye: 'odd',       eyeY: 118, mouth: 'wobble',   mouthY: 168, bg: C.mid,  skin: C.bone, body: 'round',  bodyFill: C.pop,  prop: 'drop' },
  { mood: 'Determined',   head: 'horns',       eye: 'cross',     eyeY: 124, mouth: 'flat',     mouthY: 166, bg: C.bone, skin: C.mark, body: 'square', bodyFill: C.deep, prop: 'none' },
  { mood: 'Delighted',    head: 'blob',        eye: 'happyArcs', eyeY: 130, mouth: 'smile',    mouthY: 174, bg: C.mark, skin: C.bone, body: 'sloped', bodyFill: C.pop,  prop: 'none' },
  { mood: 'Confused',     head: 'diamond',     eye: 'odd',       eyeY: 112, mouth: 'wobble',   mouthY: 158, bg: C.pop,  skin: C.mid,  body: 'narrow', bodyFill: C.bone, prop: 'none' },
  { mood: 'Bored',        head: 'wideRounded', eye: 'sleepyArcs', eyeY: 116, mouth: 'flat',    mouthY: 162, bg: C.deep, skin: C.grey, body: 'square', bodyFill: C.mid,  prop: 'none' },

  { mood: 'Relieved',     head: 'wavy',        eye: 'happyArcs', eyeY: 118, mouth: 'sigh',     mouthY: 160, bg: C.bone, skin: C.pop,  body: 'round',  bodyFill: C.mark, prop: 'none' },
  { mood: 'Inspired',     head: 'circle',      eye: 'rings',     eyeY: 118, mouth: 'smile',    mouthY: 168, bg: C.mid,  skin: C.pop,  body: 'narrow', bodyFill: C.bone, prop: 'antenna' },
  { mood: 'Frustrated',   head: 'square',      eye: 'cross',     eyeY: 118, mouth: 'teeth',    mouthY: 166, bg: C.pop,  skin: C.deep, body: 'square', bodyFill: C.mark, prop: 'none' },
  { mood: 'Content',      head: 'pentagon',    eye: 'dots',      eyeY: 116, mouth: 'smirk',    mouthY: 160, bg: C.mark, skin: C.pop,  body: 'round',  bodyFill: C.bone, prop: 'none' },
  { mood: 'Celebrating',  head: 'blob',        eye: 'wideDots',  eyeY: 124, mouth: 'grin',     mouthY: 172, bg: C.deep, skin: C.bone, body: 'round',  bodyFill: C.mark, prop: 'hand' },
];

/* ------------------------------------------------------------------ build */

function panel(spec, index) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const x = col * W;
  const y = row * H;

  const head = heads[spec.head]();
  const fc = featureOn(spec.skin);

  // The neck runs from just under the chin into the shoulders, overlapping
  // both, so the three pieces read as one figure rather than a stack.
  const neckTop = head.chin - 8;
  const shoulders = head.chin + 12;

  const parts = [
    `<rect width="${W}" height="${H}" fill="${spec.bg}"/>`,
    bodies[spec.body](shoulders, spec.bodyFill),
    path(`M134 ${neckTop}h32v${shoulders - neckTop + 12}h-32Z`, spec.skin, INK),
    path(head.d, spec.skin, INK),
    eyes[spec.eye](spec.eyeY, fc),
    mouths[spec.mouth](spec.mouthY, fc),
    props[spec.prop](),
  ];

  return `  <g transform="translate(${x} ${y})" clip-path="url(#cell)">
    <title>${spec.mood}</title>
${parts.map((p) => `    ${p}`).join('\n')}
  </g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COLS * W} ${ROWS * H}" width="${COLS * W}" height="${ROWS * H}" role="img" aria-label="Twenty flat-vector Deck characters, each showing a different mood">
<title>Deck moods — ${palette.label}</title>
<desc>${CAST.map((c) => c.mood).join(', ')}.</desc>
<defs>
  <clipPath id="cell"><rect width="${W}" height="${H}"/></clipPath>
</defs>
<rect width="${COLS * W}" height="${ROWS * H}" fill="${C.bone}"/>
${CAST.map(panel).join('\n')}
</svg>
`;

const out = join(here, 'deck-moods.svg');
writeFileSync(out, svg);
console.log(`Wrote ${out}`);
console.log(`Palette: ${palette.label} (${paletteName})`);
console.log(`${CAST.length} moods: ${CAST.map((c) => c.mood).join(', ')}`);
