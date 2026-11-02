/** Match lives on its own subdomain of wherever Deck is being served. */
export function matchUrl(): string {
  const { protocol, host } = window.location;
  return `${protocol}//match.${host.replace(/^www\./, '')}`;
}
