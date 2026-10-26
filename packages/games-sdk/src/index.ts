import { createDeckGames } from './client.js';

/**
 * `@onedeck/games-sdk` — the Deck Games SDK as a module.
 *
 *   import DeckGames from '@onedeck/games-sdk';
 *   const deck = await DeckGames.init();
 *
 * Safe to import during server rendering: nothing touches `window` until it
 * exists. Testing against a local copy of Deck? Trust its origin first:
 *
 *   await DeckGames.init({ origins: ['http://localhost:3000'] });
 */

export const DeckGames = createDeckGames();
export default DeckGames;

export { createDeckGames, DeckGamesError, VERSION } from './client.js';
export type { DeckGamesClient } from './client.js';
export type * from './types.js';
