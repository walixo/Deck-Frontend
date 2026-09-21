import { Link } from 'react-router-dom';
import { CategoryLabel } from '@/components/illustrations/CategoryIcon';
import { CurrencyPicker } from '@/components/ui/Money';
import { useConsent } from '@/hooks/useConsent';
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

/**
 * Reopens the cookie notice, and says what the current answer is.
 *
 * A consent you cannot withdraw is not consent, and the only place a reader
 * will think to look for it is the footer. Stating the current choice matters
 * as much as the ability to change it — "Cookies: rejected" answers the
 * question most people actually have, which is what they picked last time.
 */
function CookieChoices() {
  const { choice, reset } = useConsent();

  return (
    <button
      type="button"
      onClick={reset}
      className="font-mono text-[11px] uppercase text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
    >
      Cookies: {choice === 'granted' ? 'accepted' : choice === 'denied' ? 'rejected' : 'not set'}
    </button>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-edge">
      <div className="overflow-hidden border-b border-edge bg-deep py-2">
        <div className="flex w-max animate-[var(--animate-ticker)]">
          {[0, 1].map((copy) => (
            <span
              key={copy}
              aria-hidden={copy === 1 || undefined}
              className="shrink-0 pr-4 font-display text-sm uppercase tracking-tight text-on-deep"
            >
              {Array.from({ length: 8 }, () => TICKER).join(' ')}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo className="h-8 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted text-pretty">
              Deck is where makers launch new tech and the community decides what deserves
              attention. New launches every day.
            </p>
          </div>

          <nav aria-label="Browse">
            <h3 className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
              Browse
            </h3>
            <ul className="mt-3 space-y-2">
              {CATEGORY_ORDER.map((category) => (
                <li key={category}>
                  <Link
                    to={`/discover?category=${category}`}
                    className="text-sm text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    <CategoryLabel slug={category} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Deck">
            <h3 className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
              Deck
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  to="/leaderboard"
                  className="text-sm text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  Daily leaderboard
                </Link>
              </li>
              <li>
                <Link
                  to="/discover?sort=newest"
                  className="text-sm text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  Newest launches
                </Link>
              </li>
              <li>
                <Link
                  to="/submit"
                  className="text-sm text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  Launch a product
                </Link>
              </li>
              <li>
                <Link
                  to="/shop"
                  className="text-sm text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  Shop merch
                </Link>
              </li>
              <li>
                <Link
                  to="/handbook"
                  className="text-sm text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  Build handbook
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-edge pt-5">
          <p className="font-mono text-[11px] uppercase text-muted">
            © {new Date().getFullYear()} Deck — built for makers
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <CurrencyPicker />
            {/* Beside the cookie control rather than up in the Deck column.
                Someone looking for the privacy policy is looking at the bottom
                of the page for the legal strip, and the three belong together:
                what we collect, what you agreed to, and the rules. */}
            <Link
              to="/privacy"
              className="font-mono text-[11px] uppercase text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="font-mono text-[11px] uppercase text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              Terms
            </Link>
            <CookieChoices />
            <p className="font-mono text-[11px] uppercase text-muted">
              Launches shown are demo data
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
