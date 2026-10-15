import { createContext, useContext } from 'react';

/**
 * Which world a built-in game is being drawn in.
 *
 * Deck's four originals were built for the launch board's brutalist chrome.
 * Inside Deck Games they sit in a softer room, so the shared frame reads this
 * and dresses itself to match — the games themselves (their canvases, loops
 * and palettes) are untouched either way.
 */
export type ArcadeSkin = 'deck' | 'games';

export const ArcadeSkinContext = createContext<ArcadeSkin>('deck');

export const useArcadeSkin = (): ArcadeSkin => useContext(ArcadeSkinContext);
