/**
 * AdSense configuration, kept out of the component file.
 *
 * The publisher id, e.g. `ca-pub-0000000000000000`, and one responsive unit id.
 * Both absent by default: with nothing configured, Deck makes no third-party
 * request at all and the consent banner has nothing to ask about.
 */
const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
const SLOT = import.meta.env.VITE_ADSENSE_SLOT as string | undefined;

export const adsense = { client: CLIENT, slot: SLOT };
export const adsenseConfigured = Boolean(CLIENT && SLOT);

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let scriptRequested = false;

/**
 * Loads Google's tag once per page, on demand.
 *
 * Deliberately not a `<script>` in index.html: putting it there would fetch
 * from googlesyndication.com on every page load, for every visitor, before
 * anyone had agreed to anything — and on pages with no ad slot at all.
 */
export function loadAdSense(): void {
  if (scriptRequested || !CLIENT) return;
  scriptRequested = true;

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CLIENT)}`;
  document.head.appendChild(script);
}
