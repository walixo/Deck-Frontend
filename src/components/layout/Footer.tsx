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
];

/* A scrolling ticker closes the page — cheap energy, and it never repeats visibly. */
const TICKER = 'LAUNCH · VOTE · REVIEW · REPEAT ·';

export function Footer() {
  return (
    <footer className="mt-20 border-t-2 border-edge">
      <div className="overflow-hidden border-b-2 border-edge bg-acid py-2">
        <div className="flex w-max animate-[var(--animate-ticker)]">
          {[0, 1].map((copy) => (
            <span
              key={copy}
              aria-hidden={copy === 1 || undefined}
              className="shrink-0 pr-4 font-display text-sm uppercase tracking-tight text-ink"
            >
              {Array.from({ length: 8 }, () => TICKER).join(' ')}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo className="h-8 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted text-pretty">
              Deck is where makers launch new tech and the community decides what deserves
              attention. New launches every day.
            </p>
          </div>

          <nav aria-label="Browse">
            <h3 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
              Browse
            </h3>
            <ul className="mt-3 space-y-2">
              {CATEGORY_ORDER.map((category) => (
                <li key={category}>
                  <Link
                    to={`/discover?category=${category}`}
                    className="text-sm text-muted underline-offset-4 transition-colors hover:text-cobalt hover:underline"
                  >
                    {CATEGORY_PLURAL[category]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Deck">
            <h3 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
              Deck
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  to="/leaderboard"
                  className="text-sm text-muted underline-offset-4 transition-colors hover:text-cobalt hover:underline"
                >
                  Daily leaderboard
                </Link>
              </li>
              <li>
                <Link
                  to="/discover?sort=newest"
                  className="text-sm text-muted underline-offset-4 transition-colors hover:text-cobalt hover:underline"
                >
                  Newest launches
                </Link>
              </li>
              <li>
                <Link
                  to="/submit"
                  className="text-sm text-muted underline-offset-4 transition-colors hover:text-cobalt hover:underline"
                >
                  Launch a product
                </Link>
              </li>
              <li>
                <Link
                  to="/shop"
                  className="text-sm text-muted underline-offset-4 transition-colors hover:text-cobalt hover:underline"
                >
                  Shop merch
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t-2 border-edge pt-5">
          <p className="font-mono text-[11px] uppercase text-muted">
            © {new Date().getFullYear()} Deck — built for makers
          </p>
          <p className="font-mono text-[11px] uppercase text-muted">Launches shown are demo data</p>
        </div>
      </div>
    </footer>
  );
}
