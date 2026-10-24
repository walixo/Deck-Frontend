import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Wordmark } from '@/components/layout/Wordmark';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

/**
 * The frame around every page of Deck Games.
 *
 * Deliberately not Deck's `Layout`. The arcade is its own place with its own
 * voice, and borrowing the launch board's navbar would drag the brutalist
 * chrome — hard shadows, uppercase slabs — over a world built from soft light.
 * The way back to Deck is always one click away, top left and in the footer.
 *
 * The header floats over the home page's amber hero in light ink, and turns
 * to frosted glass once the page has scrolled past it.
 */
export function GamesShell() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  /* Open for the page it was opened on — navigating anywhere closes it
     without an effect having to notice. */
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const menuOpen = menuFor === pathname;
  /* The front doors and the developer page open on a dark hero the header
     floats over. */
  const overHero =
    (pathname === '/games' || pathname === '/games/agents' || pathname === '/games/developers') &&
    !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  /* A new page starts at the top. */
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="deck-games min-h-dvh bg-g-paper font-sans text-g-ink antialiased selection:bg-g-ember selection:text-g-on-ember">
      <a
        href="#games-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-g-ink focus:px-4 focus:py-2 focus:text-g-paper"
      >
        Skip to content
      </a>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,color,border-color,backdrop-filter] duration-500 ease-glide',
          overHero
            ? 'border-b border-transparent bg-transparent text-white'
            : 'border-b border-g-line bg-g-glass text-g-ink backdrop-blur-xl',
        )}
      >
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <GamesWordmark />

          <nav aria-label="Deck Games" className="hidden items-center gap-7 md:flex">
            <TopLink to="/games#library">Games</TopLink>
            <TopLink to="/games/agents">Circuit</TopLink>
            <TopLink to="/games/developers">Developers</TopLink>
            <TopLink to="/games/developers/docs">Docs</TopLink>
            <TopLink to="/gameid">GameID</TopLink>
            <Link
              to="/"
              className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] opacity-75 transition-opacity hover:opacity-100"
            >
              ← Deck
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <GamesThemeToggle />
            <AccountLink />
            <Link
              to="/games#library"
              className="glass-primary hidden rounded-xl px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-[filter,transform] duration-300 ease-glide active:scale-[0.98] sm:inline-flex"
            >
              Play now
            </Link>
            <button
              type="button"
              onClick={() => setMenuFor(menuOpen ? null : pathname)}
              aria-expanded={menuOpen}
              aria-controls="games-menu"
              className="grid size-9 place-items-center rounded-full md:hidden"
            >
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
              <span aria-hidden="true" className="relative block h-3 w-4">
                <span
                  className={cn(
                    'absolute inset-x-0 top-0 h-px bg-current transition-transform duration-300 ease-glide',
                    menuOpen && 'top-1.5 rotate-45',
                  )}
                />
                <span
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-300 ease-glide',
                    menuOpen && 'bottom-1.5 -rotate-45',
                  )}
                />
              </span>
            </button>
          </div>
        </div>

        <div
          id="games-menu"
          hidden={!menuOpen}
          className="border-t border-g-line bg-g-paper px-4 pb-6 pt-2 text-g-ink md:hidden"
        >
          {[
            ['/games#library', 'Games'],
            ['/games/agents', 'Deck Circuit'],
            ['/games/developers', 'Developers'],
            ['/games/developers/docs', 'Docs'],
            ['/gameid', 'GameID'],
            ['/', 'Back to Deck'],
          ].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className="block border-b border-g-line py-4 text-2xl font-medium tracking-[-0.03em]"
            >
              {label}
            </Link>
          ))}
        </div>
      </header>

      <main id="games-main">
        {/* Inside the shell, so a page arriving cold swaps only itself — the
            header and footer never blink. */}
        <Suspense
          fallback={
            /* On the home page the header is already in its over-the-hero
               light ink, so the wait is drawn in the hero's dark amber —
               white type on a white loading screen would vanish. */
            <div
              className={cn(
                'grid place-items-center',
                pathname === '/games' ? 'min-h-[100svh] bg-g-amber-5' : 'min-h-[70svh]',
              )}
            >
              <span className="size-8 animate-spin rounded-full border-2 border-g-line border-t-g-ember" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <GamesFooter />
    </div>
  );
}

/**
 * Deck's own wordmark, with "games" set beside it.
 *
 * The same vector mark as the launch board's header, filled with
 * `currentColor` so it reads in white over the hero and in ink on the glass
 * header. Without the lavender flicker Deck's header gives it: lavender has
 * no place in this world's palette.
 */
export function GamesWordmark({ className }: { className?: string }) {
  return (
    <Link
      to="/games"
      aria-label="Deck Games home"
      className={cn('group flex items-center gap-2 leading-none', className)}
    >
      <Wordmark className="h-5 w-auto" />
      <span className="text-[19px] font-normal tracking-[-0.04em] opacity-60 transition-opacity duration-300 group-hover:opacity-100">
        games
      </span>
      <span
        aria-hidden="true"
        className="size-1.5 translate-y-[-1px] rounded-full bg-g-glow shadow-[0_0_12px_2px] shadow-g-glow/70"
      />
    </Link>
  );
}

function TopLink({ to, children }: { to: string; children: string }) {
  return (
    <NavLink
      to={to}
      end
      className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] opacity-85 transition-opacity hover:opacity-100"
    >
      {children}
    </NavLink>
  );
}

function AccountLink() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) {
    return (
      <Link
        to="/login"
        state={{ from: pathname }}
        className="px-2 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] opacity-85 transition-opacity hover:opacity-100"
      >
        Log in
      </Link>
    );
  }

  return (
    <Link
      to="/games/developers"
      title={`Signed in as ${user.name}`}
      className="grid size-8 place-items-center overflow-hidden rounded-full border border-current/20 font-mono text-[10px] font-semibold uppercase"
    >
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        user.name.slice(0, 2)
      )}
      <span className="sr-only">Your games</span>
    </Link>
  );
}

/** The theme switch, in this world's voice: a soft pill, not a slab. */
function GamesThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="relative h-6 w-10 rounded-full border border-current/25 transition-colors duration-300"
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-1/2 size-4 -translate-y-1/2 rounded-full transition-[left,background-color,box-shadow] duration-500 ease-glide',
          isDark
            ? 'left-[19px] bg-g-glow shadow-[0_0_10px_1px] shadow-g-glow/70'
            : 'left-[3px] bg-current',
        )}
      />
    </button>
  );
}

function GamesFooter() {
  return (
    <footer className="border-t border-g-line bg-g-paper">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="flex flex-wrap items-end gap-x-[0.25em] text-[clamp(3rem,10vw,8rem)] font-normal leading-[0.85] tracking-[-0.06em] text-g-line">
            <Wordmark title="Deck" className="h-[0.72em] w-auto" />
            <span>games</span>
          </p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-g-mute">
            Games made across Africa and beyond, played in the browser. A world inside{' '}
            <Link to="/" className="text-g-ink underline underline-offset-4">
              Deck
            </Link>
            .
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-10 gap-y-3 self-end font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute"
        >
          <Link to="/games#library" className="hover:text-g-ink">
            Play
          </Link>
          <Link to="/games/agents" className="hover:text-g-ink">
            Circuit
          </Link>
          <Link to="/games/developers" className="hover:text-g-ink">
            Developers
          </Link>
          <Link to="/games/developers/docs" className="hover:text-g-ink">
            Docs
          </Link>
          <Link to="/terms" className="hover:text-g-ink">
            Terms
          </Link>
          <Link to="/privacy" className="hover:text-g-ink">
            Privacy
          </Link>
          <Link to="/" className="hover:text-g-ink">
            Deck →
          </Link>
        </nav>
      </div>
    </footer>
  );
}
