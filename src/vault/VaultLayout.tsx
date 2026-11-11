import { Suspense } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { SectionSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { VaultMark } from './VaultMark';

/**
 * The chrome on vault.onedeck.africa.
 *
 * Vault gets its own shell rather than Deck's: it is a business product with a
 * different audience and a different nav, and nothing on it belongs under a
 * launch board. It keeps Deck's design system, theme and session, because a
 * second visual language would be a second thing to maintain for no reader's
 * benefit — and because somebody signed in to Deck is already signed in here.
 */

const LINKS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/shop', label: 'Buy a card' },
  { to: '/issue', label: 'Issue cards' },
  { to: '/distribute', label: 'Distribute' },
  { to: '/docs', label: 'API' },
];

export function VaultLayout() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-body">
      <a
        href="#vault-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-deep focus:px-4 focus:py-2 focus:text-sm focus:text-on-deep"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Vault — home">
            <VaultMark className="size-7" />
            <span className="font-display text-lg tracking-tight">Vault</span>
          </Link>

          <nav aria-label="Vault" className="ml-4 hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] transition-colors',
                    isActive ? 'bg-deep text-on-deep' : 'text-muted hover:text-body',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated && user ? (
              <Link
                to="/cards"
                className="rounded-full border border-line px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted transition-colors hover:text-body"
              >
                My cards
              </Link>
            ) : (
              /* A full reload, not a router link: sign-in lives on the Deck
                 app at the apex domain, which this bundle does not route. */
              <a
                href="https://onedeck.africa/login"
                className="rounded-full border border-line px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted transition-colors hover:text-body"
              >
                Sign in
              </a>
            )}
          </div>
        </div>

        {/* The nav again, as a scroller, once the row above runs out of room. */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'shrink-0 whitespace-nowrap rounded-full border border-line px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em]',
                  isActive ? 'bg-deep text-on-deep' : 'bg-surface text-muted',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </header>

      <main id="vault-main" className="flex-1">
        <Suspense fallback={<SectionSkeleton />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="mt-20 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
            Vault — a Deck product
          </p>
          <nav className="flex gap-4">
            <a
              href="https://onedeck.africa"
              className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted hover:text-body"
            >
              onedeck.africa
            </a>
            <Link
              to="/docs"
              className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted hover:text-body"
            >
              API docs
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
