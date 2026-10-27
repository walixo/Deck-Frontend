import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setStoredToken } from '@/lib/api';
import { MatchApp } from './MatchApp';

/**
 * Starts Match. A Google sign-in comes back as `#token=…` (or `?error=…` on
 * the sign-in path); both are read and wiped from the address bar here,
 * before the first render, so the app starts knowing who is signed in.
 */
export function mountMatch(root: HTMLElement) {
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
