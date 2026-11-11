import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
/* The `/react` entry, not `/next`. The Next build imports `next/navigation`
   for its router hooks, and in a Vite app there is no `next` to import from —
   rolldown resolves it to an empty optional-peer stub and the named exports
   come back missing. Same component, same beacon; this one hooks the History
   API instead of a framework router. */
import { Analytics } from '@vercel/analytics/react';
import { App } from './App';
import { VaultApp } from './vault/VaultApp';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ConsentProvider } from '@/context/ConsentContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import { RequestError } from './lib/api';
import { restoreFontset } from './lib/fontset';
import { installClickSound } from './lib/sound';

/* match.onedeck.africa is Match — two voices, two minutes — served by this same
   deployment. It loads its own small app and none of Deck's providers. */
const isMatch = window.location.hostname.startsWith('match.');

/*
 * vault.onedeck.africa is Vault — gift card infrastructure — also served by
 * this deployment, but unlike Match it runs *inside* Deck's provider stack.
 *
 * Match is its own world with its own visual language, so it takes none of
 * them. Vault is a business product wearing Deck's design system and signing
 * people in with their Deck account, so it wants the query client, the theme
 * and the session — it only swaps the route tree underneath them. Duplicating
 * those providers for it would mean a second session that logs out separately.
 *
 * `?app=vault` is the development door: `vault.localhost` works in most
 * browsers but not all, and a demo should not rest on which one is open. The
 * choice is remembered for the tab so a router navigation does not drop it.
 */
function wantsVault(): boolean {
  if (window.location.hostname.startsWith('vault.')) return true;
  try {
    if (new URLSearchParams(window.location.search).get('app') === 'vault') {
      sessionStorage.setItem('deck-app', 'vault');
      return true;
    }
    return sessionStorage.getItem('deck-app') === 'vault';
  } catch {
    return false;
  }
}

const isVault = !isMatch && wantsVault();

if (!isMatch) {
  /* Before the first render, not in an effect: restoring the font preview one
     paint late would make the whole page visibly re-letter on every load. */
  restoreFontset();

  /* One listener for the whole site, outside React, because it belongs to the
     document rather than to any tree that mounts and unmounts inside it. Nothing
     is built until the first press — see `installClickSound`. */
  installClickSound();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Never retry client errors — the response will not change.
        if (error instanceof RequestError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root is missing from index.html');

if (isMatch) {
  document.title = 'Match — two voices, two minutes';
  void import('./match/mount').then(({ mountMatch }) => mountMatch(rootElement));
} else
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConsentProvider>
          <CurrencyProvider>
            <ThemeProvider>
              <BrowserRouter>
                <AuthProvider>
                  <CartProvider>
                    {isVault ? <VaultApp /> : <App />}
                    <Analytics />
                  </CartProvider>
                </AuthProvider>
              </BrowserRouter>
            </ThemeProvider>
          </CurrencyProvider>
        </ConsentProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
