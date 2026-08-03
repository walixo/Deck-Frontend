import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/discover', label: 'Discover' },
  { to: '/leaderboard', label: 'Leaderboard' },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Menus are scoped to the location that opened them, so navigating anywhere —
   * including via the browser's back button — closes them without an effect.
   */
  const [panels, setPanels] = useState({ menu: false, account: false, at: location.key });
  const onCurrentRoute = panels.at === location.key;
  const menuOpen = panels.menu && onCurrentRoute;
  const accountOpen = panels.account && onCurrentRoute;

  const setMenuOpen = (open: boolean) =>
    setPanels({ menu: open, account: false, at: location.key });
  const setAccountOpen = (open: boolean) =>
    setPanels({ menu: false, account: open, at: location.key });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    // setPanels is stable, so this listener never needs re-binding on identity changes.
    const close = () => setPanels((current) => ({ ...current, account: false }));
    const onPointerDown = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) close();
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [accountOpen]);

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/discover?search=${encodeURIComponent(query)}` : '/discover');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-all duration-300',
        scrolled
          ? 'border-zinc-200/80 bg-white/85 backdrop-blur-xl dark:border-zinc-800 dark:bg-[color:var(--color-canvas-dark)]/85'
          : 'border-transparent bg-white dark:bg-[color:var(--color-canvas-dark)]',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-zinc-900 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100',
                      isActive ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={onSearch} className="ml-auto hidden lg:block" role="search">
          <label className="relative block">
            <span className="sr-only">Search launches</span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400"
            >
              ⌕
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search launches"
              className="h-9 w-56 rounded-xl border border-zinc-200 bg-zinc-50/60 pl-8 pr-3 text-sm transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:w-64 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900/60 dark:placeholder:text-zinc-500 dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:ring-white/5"
            />
          </label>
        </form>

        <div className={cn('flex items-center gap-2', 'ml-auto lg:ml-3')}>
          <ThemeToggle />

          {isAuthenticated && user ? (
            <>
              <ButtonLink to="/submit" size="sm" className="hidden sm:inline-flex">
                <span aria-hidden="true">+</span> Launch
              </ButtonLink>

              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen(!accountOpen)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-1.5 rounded-full p-0.5 transition-transform hover:scale-105 active:scale-95"
                >
                  <Avatar user={user} size="sm" />
                  <span className="sr-only">Your account</span>
                </button>

                {accountOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-11 w-56 origin-top-right animate-[var(--animate-fade-in)] overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-[var(--shadow-lifted)] dark:border-zinc-800 dark:bg-[color:var(--color-surface-dark)]"
                  >
                    <div className="border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">
                        @{user.username}
                      </p>
                    </div>
                    <MenuLink to={`/u/${user.username}`}>Your profile</MenuLink>
                    <MenuLink to="/submit">Launch something</MenuLink>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="mt-0.5 block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <ButtonLink to="/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink to="/register" size="sm">
                Join Deck
              </ButtonLink>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="px-2 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            <span aria-hidden="true" className="text-base">
              {menuOpen ? '✕' : '☰'}
            </span>
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="animate-[var(--animate-fade-in)] border-t border-zinc-200/80 bg-white px-4 pb-4 pt-3 md:hidden dark:border-zinc-800 dark:bg-[color:var(--color-canvas-dark)]">
          <form onSubmit={onSearch} role="search" className="mb-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search launches"
              aria-label="Search launches"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/60 dark:placeholder:text-zinc-500"
            />
          </form>

          <nav aria-label="Mobile" className="flex flex-col gap-0.5">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                      : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            {isAuthenticated ? (
              <ButtonLink to="/submit" size="md" className="w-full">
                Launch something
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/register" size="md" className="w-full">
                  Join Deck
                </ButtonLink>
                <ButtonLink to="/login" variant="secondary" size="md" className="w-full">
                  Sign in
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="mt-0.5 block rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
    >
      {children}
    </Link>
  );
}
