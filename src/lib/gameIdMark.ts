/**
 * The GameID mark's drawing, as markup: rendered by `GameIdMark` and pasted
 * into the copy-and-paste sign-in button, so both are exactly the same.
 */

/** The controller's outline, shared by the face, its rim and the slab beneath. */
const BODY =
  'M19 4H45C53.5 4 58.6 9.6 60.2 18L62.4 30.4C63.4 36.6 59.6 41 54.6 41C51 41 48.6 39 46.6 36.4L45.2 34.4H18.8L17.4 36.4C15.4 39 13 41 9.4 41C4.4 41 0.6 36.6 1.6 30.4L3.8 18C5.4 9.6 10.5 4 19 4Z';

export const GAMEID_MARK_VIEWBOX = '-3 -1 70 51';

export const GAMEID_MARK_LAYERS = [
  /* A faint edge, so the slab shows on paper. */
  `<path d="${BODY}" transform="translate(0 3)" fill="none" stroke="#000" stroke-opacity="0.12" stroke-width="5.4" stroke-linejoin="round"/>`,
  /* The slab: its shaded foot, its face, and the rim around the controller. */
  `<path d="${BODY}" transform="translate(0 6)" fill="#cfcac0" stroke="#cfcac0" stroke-width="3.4" stroke-linejoin="round"/>`,
  `<path d="${BODY}" transform="translate(0 4)" fill="#f7f5f0" stroke="#f7f5f0" stroke-width="3.4" stroke-linejoin="round"/>`,
  `<path d="${BODY}" fill="#f7f5f0" stroke="#f7f5f0" stroke-width="3.4" stroke-linejoin="round"/>`,
  /* The controller. */
  `<path d="${BODY}" fill="#ff5a14"/>`,
  `<rect x="16.9" y="14.6" width="4.4" height="13" rx="1.3" fill="#fff"/>`,
  `<rect x="12.6" y="18.9" width="13" height="4.4" rx="1.3" fill="#fff"/>`,
  `<circle cx="44.6" cy="16.6" r="2.3" fill="#fff"/>`,
  `<circle cx="49.4" cy="21.1" r="2.3" fill="#fff"/>`,
  `<circle cx="44.6" cy="25.6" r="2.3" fill="#fff"/>`,
  `<circle cx="39.8" cy="21.1" r="2.3" fill="#fff"/>`,
].join('');

/** The mark as standalone SVG markup, for HTML that cannot load Deck's code. */
export function gameIdMarkSvg(size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="${GAMEID_MARK_VIEWBOX}" aria-hidden="true">${GAMEID_MARK_LAYERS}</svg>`;
}
