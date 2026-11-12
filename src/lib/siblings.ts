/**
 * Deck's sibling sites.
 *
 * Match, Vault and Deck Games are served by this same deployment under their
 * own hostnames, so a link to one from Deck has to be a real navigation to
 * another origin rather than a router link — see `lib/host` for the other half
 * of this, which decides which site a given hostname is.
 *
 * Built from the current host rather than hardcoded, so a preview deployment
 * and a local tunnel point at their own siblings instead of at production.
 */
import { APP } from '@/lib/host';

function sibling(prefix: string): string {
  const { protocol, host } = window.location;
  return `${protocol}//${prefix}.${host.replace(/^www\./, '')}`;
}

export const matchUrl = (): string => sibling('match');
export const vaultUrl = (): string => sibling('vault');
export const gamesUrl = (): string => sibling('game');

/**
 * A path on a sibling site, from wherever you happen to be.
 *
 * The docs are the reason this exists: one shell serves them on Deck and on
 * the Games subdomain, so a link to `/games/developers` is same-origin from
 * one and cross-origin from the other. Returning a bare path when it is the
 * same site keeps that navigation inside the router instead of reloading the
 * whole bundle to land on a page it already had.
 *
 * The caller decides how to render what comes back — `Link` for a path, an
 * anchor for a URL. `isExternal` does that test.
 */
export function gamesHref(path = ''): string {
  return APP === 'games' ? path || '/' : `${gamesUrl()}${path}`;
}

export function vaultHref(path = ''): string {
  return APP === 'vault' ? path || '/' : `${vaultUrl()}${path}`;
}

/** True when a href has to leave this origin, so it needs an anchor. */
export const isExternal = (href: string): boolean => /^https?:\/\//.test(href);
