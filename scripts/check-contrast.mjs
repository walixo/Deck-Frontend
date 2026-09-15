/**
 * Asserts every colour pairing in every palette clears WCAG.
 *
 *   npm run check:contrast
 *
 * Exits non-zero on failure, so it can gate a build. This is rule 2 of
 * design/CONTRACT.md, mechanised.
 *
 * It exists because two real regressions shipped past manual review during this
 * project and were caught by eye, late:
 *
 *   - link text at 1.87:1 on the light canvas, which survived three palette
 *     changes because nobody re-measured a colour that had not moved
 *   - a fundraise progress bar at 1.40:1 against its own track, introduced by a
 *     mechanical rename that was correct everywhere else
 *
 * Both are the same failure: a pairing nobody thought to check, because
 * checking by hand means knowing which pairs exist. This enumerates them.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'design/tokens.json'), 'utf8'));

const channel = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

function luminance(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG floors. Text is AA normal; marks are the non-text graphic threshold. */
const TEXT = 4.5;
const MARK = 3;

const failures = [];
const checks = [];

function expect(label, fg, bg, floor) {
  const value = ratio(fg, bg);
  const ok = value >= floor;
  checks.push({ label, value, floor, ok });
  if (!ok) failures.push({ label, value, floor, fg, bg });
}

const { light, dark } = tokens.neutrals;
const { ink, bone, grey, 'grey-soft': greySoft, red } = tokens.fixed;

/* ---- neutrals, which every palette shares -------------------------------- */

for (const [theme, n] of [
  ['light', light],
  ['dark', dark],
]) {
  expect(`${theme}: body on canvas`, n['body-ink'], n.canvas, TEXT);
  expect(`${theme}: body on surface`, n['body-ink'], n.surface, TEXT);
  expect(`${theme}: body on surface-2`, n['body-ink'], n['surface-2'], TEXT);
  expect(`${theme}: muted on canvas`, n['muted-ink'], n.canvas, TEXT);
  expect(`${theme}: muted on surface`, n['muted-ink'], n.surface, TEXT);
  expect(`${theme}: edge border on canvas`, n.edge, n.canvas, MARK);
  /* Errors are expressed by inversion rather than a hue — canvas type on an
     edge-coloured block. If that pairing ever fails, the whole scheme does. */
  expect(`${theme}: inverted error block`, n.canvas, n.edge, TEXT);
}

expect('notification count', '#ffffff', red, TEXT);

/* The three status colours. Each must carry its own text, and — except the
   warning, which is a filled block and separates by its border — read against
   both canvases. See design/CONTRACT.md rule 6. */
const { success, danger, warning } = tokens.fixed;
expect('success takes ink', ink, success, TEXT);
expect('danger takes bone', bone, danger, TEXT);
expect('warning takes ink', ink, warning, TEXT);
expect('success block on light', success, light.canvas, MARK);
expect('success block on dark', success, dark.canvas, MARK);
expect('danger block on light', danger, light.canvas, MARK);
expect('danger block on dark', danger, dark.canvas, MARK);
expect('ink on grey', ink, grey, TEXT);
expect('ink on grey-soft', ink, greySoft, TEXT);
expect('ink on bone', ink, bone, TEXT);

/* Badge tiles draw their icon in ink unconditionally, so every badge tone has
   to carry it — that is the price of being exempt from the palette. */
for (const [name, value] of Object.entries(tokens.badges)) {
  expect(`badge ${name} takes ink`, ink, value, TEXT);
}

/* ---- every palette ------------------------------------------------------- */

for (const [id, p] of Object.entries(tokens.palettes)) {
  /* Blocks carry their own text, and are fixed, so one check covers both themes. */
  expect(`${id}: on-pop text on pop`, p['on-pop'], p.pop, TEXT);
  expect(`${id}: on-deep text on deep`, p['on-deep'], p.deep, TEXT);
  expect(`${id}: on-pop text on pop-hover`, p['on-pop'], p['pop-hover'], TEXT);
  expect(`${id}: on-deep text on deep-hover`, p['on-deep'], p['deep-hover'], TEXT);

  /* Marks are themed, and read against three surfaces in their own theme. The
     progress-bar regression lived exactly here: a fill checked against the
     canvas but never against the track it actually sits in. */
  for (const [theme, n, mark] of [
    ['light', light, p['mark-light']],
    ['dark', dark, p['mark-dark']],
  ]) {
    expect(`${id}/${theme}: mark text on canvas`, mark, n.canvas, TEXT);
    expect(`${id}/${theme}: mark text on surface`, mark, n.surface, TEXT);
    expect(`${id}/${theme}: mark text on surface-2`, mark, n['surface-2'], TEXT);
    expect(`${id}/${theme}: focus ring on canvas`, mark, n.canvas, MARK);
    expect(`${id}/${theme}: progress fill on its track`, mark, n['surface-2'], MARK);
  }
}

/* ---- report -------------------------------------------------------------- */

const pad = (s, n) => String(s).padEnd(n);

if (failures.length === 0) {
  console.log(`\n  ${checks.length} pairings checked, all pass.`);
  const tightest = [...checks].sort((a, b) => a.value - b.value)[0];
  console.log(
    `  Tightest: ${tightest.label} at ${tightest.value.toFixed(2)}:1 (floor ${tightest.floor})\n`,
  );
  process.exit(0);
}

console.error(`\n  ${failures.length} of ${checks.length} pairings FAIL:\n`);
for (const f of failures) {
  console.error(
    `    ${pad(f.label, 44)} ${f.value.toFixed(2)}:1  needs ${f.floor}  (${f.fg} on ${f.bg})`,
  );
}
console.error('\n  See design/CONTRACT.md rule 2.\n');
process.exit(1);
