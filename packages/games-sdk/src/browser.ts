import { createDeckGames } from './client.js';

/*
 * The script-tag build, served by Deck at /sdk/deck-games-v1.js:
 *
 *   <script src="https://onedeck.africa/sdk/deck-games-v1.js"></script>
 *   const deck = await DeckGames.init();
 *
 * Testing against a local copy of Deck? Allow its origin on the script tag:
 *   <script src="…/deck-games-v1.js" data-deck-origins="http://localhost:3000"></script>
 */

declare global {
  interface Window {
    DeckGames?: ReturnType<typeof createDeckGames>;
  }
}

if (!window.DeckGames) {
  const script = document.currentScript;
  const extra = (script && script.getAttribute('data-deck-origins')) || '';
  window.DeckGames = createDeckGames({ origins: extra.split(/[\s,]+/) });
}
