/**
 * Which face the site's headings are wearing.
 *
 * A preview mechanism, not a feature. `deck` is the system as built — Archivo
 * Black at 400 for every heading. Each of the others re-points `--font-display`
 * and its weight, and nothing else moves.
 *
 * - `geist-black` — Geist at 900, asking whether one family can carry both
 *   roles and Archivo Black can come out of the bundle entirely.
 * - `sukhumvit` — Sukhumvit Set at 700, a humanist face against a grotesque
 *   one. Apple ships it with the operating system and nobody else has it, so it
 *   previews properly on a Mac and falls back to Geist elsewhere; adopting it
 *   would mean buying a webfont.
 *
 * The switch lives on `/styleguide` and nowhere else, because this is a
 * decision to be made once rather than a preference to be offered. It persists
 * so the preview survives navigating away from the workbench, which is the
 * entire point — a font is judged on a product page, not on a specimen sheet.
 */

const STORAGE_KEY = 'deck-fontset';

export const FONTSETS = ['deck', 'geist-black', 'sukhumvit'] as const;
export type Fontset = (typeof FONTSETS)[number];

function isFontset(value: unknown): value is Fontset {
  return typeof value === 'string' && (FONTSETS as readonly string[]).includes(value);
}

export function readFontset(): Fontset {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isFontset(stored) ? stored : 'deck';
  } catch {
    /* Private windows throw on access. The system's own fonts are the right
       answer when the preference cannot be read. */
    return 'deck';
  }
}

/**
 * Puts the choice on `<html>`, and writes it down.
 *
 * `deck` removes the attribute rather than setting it to a value, so the
 * default costs nothing: no selector matches, no override cascade to reason
 * about, and the DOM of a normal visit is identical to one where this module
 * never ran.
 */
export function applyFontset(fontset: Fontset): void {
  const root = document.documentElement;
  if (fontset === 'deck') root.removeAttribute('data-fontset');
  else root.setAttribute('data-fontset', fontset);

  try {
    if (fontset === 'deck') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, fontset);
  } catch {
    /* The preview holds for this page load and is forgotten after. */
  }
}

/**
 * Restores the choice before React renders.
 *
 * Called from `main.tsx` rather than from a provider, because a provider would
 * set the attribute in an effect — one paint after the first render — and the
 * whole page would visibly re-letter on every load while previewing.
 */
export function restoreFontset(): void {
  applyFontset(readFontset());
}
