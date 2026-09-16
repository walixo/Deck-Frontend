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
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ConsentProvider } from '@/context/ConsentContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import { RequestError } from './lib/api';
import { restoreFontset } from './lib/fontset';
import { installClickSound } from './lib/sound';

/* Before the first render, not in an effect: restoring the font preview one
   paint late would make the whole page visibly re-letter on every load. */
restoreFontset();

/* One listener for the whole site, outside React, because it belongs to the
   document rather than to any tree that mounts and unmounts inside it. Nothing
   is built until the first press — see `installClickSound`. */
installClickSound();

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

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConsentProvider>
        <CurrencyProvider>
          <ThemeProvider>
            <BrowserRouter>
              <AuthProvider>
                <CartProvider>
                  <App />
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
