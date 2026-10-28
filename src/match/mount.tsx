import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setStoredToken } from '@/lib/api';
import { MatchApp } from './MatchApp';
import { registerWorker } from './device';

/** Match installs as its own app: its manifest, icons and colour, not Deck's. */
function claimTheHead() {
  for (const el of document.head.querySelectorAll(
    'link[rel="manifest"], link[rel="apple-touch-icon"], link[rel="icon"], meta[name="theme-color"]',
  )) {
    el.remove();
  }
  const add = (tag: 'link' | 'meta', attrs: Record<string, string>) => {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    document.head.appendChild(el);
  };
  add('link', { rel: 'manifest', href: '/match.webmanifest' });
  add('link', { rel: 'icon', href: '/match-icon-192.png', type: 'image/png' });
  add('link', { rel: 'apple-touch-icon', href: '/match-apple-touch-icon.png' });
  add('meta', { name: 'theme-color', content: '#0b0a09' });
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });
  add('meta', { name: 'apple-mobile-web-app-title', content: 'Match' });
}

/**
 * Starts Match. A Google sign-in comes back as `#token=…` (or `?error=…` on
 * the sign-in path); both are read and wiped from the address bar here,
 * before the first render, so the app starts knowing who is signed in.
 */
export function mountMatch(root: HTMLElement) {
  claimTheHead();
  void registerWorker();
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
  const error = new URLSearchParams(window.location.search).get('error') ?? '';
  if (token) setStoredToken(token);
  if (token || error || window.location.pathname !== '/') {
    window.history.replaceState(null, '', '/');
  }
  createRoot(root).render(
    <StrictMode>
      <MatchApp signInError={error} />
    </StrictMode>,
  );
}
