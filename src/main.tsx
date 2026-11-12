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
import { GamesApp } from './games/GamesApp';
import { VaultApp } from './vault/VaultApp';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ConsentProvider } from '@/context/ConsentContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import { RequestError } from './lib/api';
import { APP } from './lib/host';
import { restoreFontset } from './lib/fontset';
import { installClickSound } from './lib/sound';

/*
 * Which site this is — see `lib/host`, which is where the hostnames live.
 *
 * Match is its own world with its own visual language, so it takes none of
 * Deck's providers and mounts itself. Vault and Deck Games are Deck's own
 * products on their own domains: they wear the design system, sign people in
 * with a Deck account and want the query client, the theme and the session.
 * They swap the route tree underneath those and nothing else — duplicating the
 * providers for either would mean a second session that logs out separately.
 */
const isMatch = APP === 'match';

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
                    {APP === 'vault' ? <VaultApp /> : APP === 'games' ? <GamesApp /> : <App />}
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
