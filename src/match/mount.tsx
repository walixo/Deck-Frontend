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
  /* The heart from the love morph, drawn by the same shader. */
  add('link', { rel: 'icon', href: '/match-favicon-32.png', type: 'image/png', sizes: '32x32' });
  add('link', { rel: 'icon', href: '/match-icon-192.png', type: 'image/png', sizes: '192x192' });
  add('link', { rel: 'apple-touch-icon', href: '/match-apple-touch-icon.png' });
  add('meta', { name: 'theme-color', content: '#0b0a09' });
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });
  add('meta', { name: 'apple-mobile-web-app-title', content: 'Match' });
}

/**
 * Starts Match. A Google sign-in comes back as `#token=…` (or `?error=…` on
 * the sign-in path), and a top-up as `?topup=…` (`&cancelled=1` if they backed
 * out); all are read and wiped from the address bar here, before the first
 * render, so the app starts knowing who is signed in and what just happened.
 */
export function mountMatch(root: HTMLElement) {
  claimTheHead();
  void registerWorker();
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
  const query = new URLSearchParams(window.location.search);
  const error = query.get('error') ?? '';
  const topup = query.get('topup');
  if (token) setStoredToken(token);
  if (token || error || topup || window.location.pathname !== '/') {
    window.history.replaceState(null, '', '/');
  }
  createRoot(root).render(
    <StrictMode>
      <MatchApp
        signInError={error}
        topup={topup ? { reference: topup, cancelled: query.get('cancelled') === '1' } : null}
      />
    </StrictMode>,
  );
}
