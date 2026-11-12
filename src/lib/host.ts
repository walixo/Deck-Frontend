/**
 * Which of Deck's sites this bundle is serving.
 *
 * One deployment answers for four hostnames — Deck itself, Match, Vault and
 * Deck Games — because they share a design system, a session, an API and most
 * of their components. Four builds of the same code would only mean four
 * things to deploy and four chances to deploy three of them. The hostname
 * picks the route tree; everything underneath is the same bundle.
 *
 * `?app=vault` and `?app=games` are the development door. `vault.localhost`
 * works in most browsers but not all, and a demo should not rest on which one
 * is open. The choice is remembered for the tab so a router navigation does
 * not drop it, and `?app=deck` gets you back out.
 */

export type DeckApp = 'deck' | 'match' | 'vault' | 'games';

/** Deck proper, which none of the subdomains route. */
export const DECK_ORIGIN = 'https://onedeck.africa';

const SUBDOMAIN: [string, DeckApp][] = [
  ['match.', 'match'],
  ['vault.', 'vault'],
  ['game.', 'games'],
];

const DOOR_KEY = 'deck-app';

function fromHostname(): DeckApp | null {
  const host = window.location.hostname;
  return SUBDOMAIN.find(([prefix]) => host.startsWith(prefix))?.[1] ?? null;
}

function fromQuery(): DeckApp | null {
  try {
    const asked = new URLSearchParams(window.location.search).get('app');
    if (asked === 'deck') {
      sessionStorage.removeItem(DOOR_KEY);
      return null;
    }
    if (asked === 'vault' || asked === 'games') {
      sessionStorage.setItem(DOOR_KEY, asked);
      return asked;
    }
    const remembered = sessionStorage.getItem(DOOR_KEY);
    return remembered === 'vault' || remembered === 'games' ? remembered : null;
  } catch {
    /* Private mode, or storage refused. The hostname still decides. */
    return null;
  }
}

/** Decided once, at load: a hostname cannot change under a running tab. */
export const APP: DeckApp = fromHostname() ?? fromQuery() ?? 'deck';

/**
 * Where a Deck page lives, from wherever you are.
 *
 * On Deck itself this is the path it was handed and nothing changes. On a
 * subdomain it is an absolute URL, because `/terms` from Deck Games would
 * otherwise land on Deck Games' catch-all — the page exists, just not on this
 * host. Use it with `DeckLink`, which picks a router link or a plain anchor to
 * match.
 */
export function deckHref(path: string): string {
  return APP === 'deck' ? path : `${DECK_ORIGIN}${path}`;
}

/** True on a real deployment of one of the subdomains, not the `?app=` door. */
export function onDeckDomain(): boolean {
  return window.location.hostname.endsWith('onedeck.africa');
}
