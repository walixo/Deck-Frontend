import { Link } from 'react-router-dom';
import { CATEGORY_PLURAL } from '@/lib/utils';
import type { Category } from '@/types';
import { Logo } from './Logo';

const CATEGORY_ORDER: Category[] = [
  'ai-model',
  'ai-tool',
  'claude-skill',
  'developer-tool',
  'mobile-app',
  'website',
  'hardware',
];

export function Footer() {
  return (
    <footer className="relative isolate mt-24 overflow-hidden border-t border-zinc-200/80 dark:border-zinc-800">
      {/* Gradient rises from the bottom edge, so the page closes rather than stops. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-64 bg-halo dark:bg-halo-dark"
        style={{ maskImage: 'linear-gradient(to top, black, transparent)' }}
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-600 text-pretty dark:text-zinc-400">
              Deck is where makers launch new tech and the community decides what deserves
              attention. New launches every day.
            </p>
          </div>

          <nav aria-label="Browse">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
              Browse
            </h3>
            <ul className="mt-4 space-y-2.5">
              {CATEGORY_ORDER.slice(0, 5).map((category) => (
                <li key={category}>
                  <Link
                    to={`/discover?category=${category}`}
                    className="text-sm text-zinc-600 transition-colors hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
                  >
                    {CATEGORY_PLURAL[category]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Deck">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
              Deck
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  to="/leaderboard"
                  className="text-sm text-zinc-600 transition-colors hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
                >
                  Daily leaderboard
                </Link>
              </li>
              <li>
                <Link
                  to="/discover?sort=newest"
                  className="text-sm text-zinc-600 transition-colors hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
                >
                  Newest launches
                </Link>
              </li>
              <li>
                <Link
                  to="/submit"
                  className="text-sm text-zinc-600 transition-colors hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
                >
                  Launch a product
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-6 dark:border-zinc-800/80">
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            © {new Date().getFullYear()} Deck. Built for makers.
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Launches shown are demo data.
          </p>
        </div>
      </div>
    </footer>
  );
}
