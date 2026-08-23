/**
 * The Deck wordmark, as path data.
 *
 * Lifted out of the SVG component so the `<canvas>` share card can draw the
 * *actual* mark instead of setting the word "DECK" in Archivo Black and hoping
 * it passes. It does not pass: the K in the real mark has a chevron whose
 * vertex is cut flat and a stem that meets it square, and Archivo's K has
 * neither. Anyone who knows the logo sees the difference immediately, and a
 * share card is the one place the logo is guaranteed to be looked at.
 *
 * Canvas takes these through `new Path2D(d)`, which parses SVG path syntax, so
 * the two renderers stay byte-identical by construction rather than by anyone
 * remembering to update both.
 *
 * **Must be filled with the even-odd rule.** The D and C carry their counters
 * as second subpaths; under the default non-zero winding the holes fill in and
 * the mark turns into four solid blobs. In canvas that means
 * `ctx.fill(path, 'evenodd')`, never a bare `ctx.fill(path)`.
 */

/** The mark's own coordinate box. Scale by `size / WORDMARK_HEIGHT`. */
export const WORDMARK_WIDTH = 421;
export const WORDMARK_HEIGHT = 100;

export const WORDMARK_PATHS = [
  /* D — heavy stem, large radius on the right, rounded-rect counter */
  'M0 0H62C89 0 110 21 110 48V52C110 79 89 100 62 100H0V0ZM42 29V71H60C66 71 70 67 70 61V39C70 33 66 29 60 29H42Z',
  /* E — stem plus three arms; the middle arm stops short of the outer two */
  'M114 0H215V30H154V37H211V63H154V70H215V100H114V0Z',
  /* C — rounded left, squared aperture cut clean out of the right */
  'M263 0H323V30H259V70H323V100H263C239 100 219 82 219 58V42C219 18 239 0 263 0Z',
  /* K — stem, then a wide chevron whose vertex is cut flat, not pointed */
  'M327 0H367V33L394 0H421L369 47V53L421 100H394L367 67V100H327V0Z',
] as const;
