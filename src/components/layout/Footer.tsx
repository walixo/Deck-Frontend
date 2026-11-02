import { Link } from 'react-router-dom';
import { CategoryLabel } from '@/components/illustrations/CategoryIcon';
import { CurrencyPicker } from '@/components/ui/Money';
import { useConsent } from '@/hooks/useConsent';
import { useLaunches } from '@/hooks/useSite';
import { matchUrl } from '@/lib/matchUrl';
import type { Category } from '@/types';
import { Logo } from './Logo';
import { Wordmark } from './Wordmark';

const CATEGORY_ORDER: Category[] = [
  'ai-model',
  'ai-tool',
  'claude-skill',
  'developer-tool',
  'mobile-app',
];

/* A scrolling ticker closes the page — cheap energy, and it never repeats visibly. */
const TICKER = 'LAUNCH · VOTE · REVIEW · REPEAT ·';
/* While launches are off: what Deck's products are for. */
const PRODUCT_TICKER = 'PLAY · TALK · BUILD · REPEAT ·';
const LINK = 'text-[13px] text-body/80 transition-colors hover:text-body';

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
      className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-body"
    >
      Cookies: {choice === 'granted' ? 'accepted' : choice === 'denied' ? 'rejected' : 'not set'}
    </button>
  );
}

export function Footer() {
  const launches = useLaunches();
  return (
    <footer className="mt-20 border-t border-line">
      <div className="overflow-hidden border-b border-line py-3">
        <div className="flex w-max animate-[var(--animate-ticker)]">
          {[0, 1].map((copy) => (
            <span
              key={copy}
              aria-hidden={copy === 1 || undefined}
              className="shrink-0 pr-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
            >
              {Array.from({ length: 8 }, () => (launches ? TICKER : PRODUCT_TICKER)).join(' ')}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo className="h-8 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted text-pretty">
              {launches
                ? 'Deck is where makers launch new tech and the community decides what deserves attention. New launches every day.'
                : 'Deck makes Match and Deck Games — things to play, and people to talk to.'}
            </p>
          </div>

          {launches ? (
            <nav aria-label="Browse">
              <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                Browse
              </h3>
              <ul className="mt-3 space-y-2">
                {CATEGORY_ORDER.map((category) => (
                  <li key={category}>
                    <Link
                      to={`/discover?category=${category}`}
                      className="text-[13px] text-body/80 transition-colors hover:text-body"
                    >
                      <CategoryLabel slug={category} />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : (
            <nav aria-label="Products">
              <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                Products
              </h3>
              <ul className="mt-3 space-y-2">
                <li>
                  <a href={matchUrl()} className={LINK}>
                    Match
                  </a>
                </li>
                <li>
                  <Link to="/games" className={LINK}>
                    Deck Games
                  </Link>
                </li>
                <li>
                  <Link to="/games/rooms" className={LINK}>
                    Rooms
                  </Link>
                </li>
                <li>
                  <Link to="/gameid" className={LINK}>
                    GameID
                  </Link>
                </li>
                <li>
                  <Link to="/docs" className={LINK}>
                    Docs
                  </Link>
                </li>
              </ul>
            </nav>
          )}

          <nav aria-label="Deck">
            <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
              Deck
            </h3>
            <ul className="mt-3 space-y-2">
              {launches && (
                <li>
                  <Link to="/leaderboard" className={LINK}>
                    Daily leaderboard
                  </Link>
                </li>
              )}
              {launches && (
                <li>
                  <Link to="/discover?sort=newest" className={LINK}>
                    Newest launches
                  </Link>
                </li>
              )}
              {launches && (
                <li>
                  <Link to="/submit" className={LINK}>
                    Launch a product
                  </Link>
                </li>
              )}
              {!launches && (
                <>
                  <li>
                    <Link to="/forum" className={LINK}>
                      Forum
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog" className={LINK}>
                      Blog
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link
                  to="/shop"
                  className="text-[13px] text-body/80 transition-colors hover:text-body"
                >
                  Shop merch
                </Link>
              </li>
              <li>
                <Link
                  to="/handbook"
                  className="text-[13px] text-body/80 transition-colors hover:text-body"
                >
                  Build handbook
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* The mark, set huge and faint — the arcade's footer, on every page. */}
        <Wordmark className="mt-16 h-[clamp(3.5rem,13vw,9.5rem)] w-auto text-line" />

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
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
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-body"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-body"
            >
              Terms
            </Link>
            <CookieChoices />
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Launches shown are demo data
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
