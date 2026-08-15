import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { useCart } from '@/hooks/useCart';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/discover', label: 'Discover' },
  { to: '/spotlight', label: 'Picks' },
  { to: '/leaderboard', label: 'Board' },
  { to: '/shop', label: 'Shop' },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { count: cartCount } = useCart();
  const [search, setSearch] = useState('');
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
    <header className="sticky top-0 z-50 border-b-2 border-edge bg-canvas">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Five links only just clear 768px, so the padding tightens a notch
            below lg to keep the row off the search field and the controls. */}
        <nav aria-label="Main" className="ml-3 hidden items-center gap-1 md:flex lg:ml-5">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'border-2 px-2.5 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] transition-colors duration-[120ms] lg:px-3',
                  isActive
                    ? 'border-edge bg-acid text-ink'
                    : 'border-transparent text-muted hover:border-edge hover:bg-surface-2 hover:text-body',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={onSearch} className="ml-auto hidden lg:block" role="search">
          <label className="relative block">
            <span className="sr-only">Search launches</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="SEARCH"
              className="h-9 w-44 border-2 border-edge bg-surface px-3 font-mono text-[12px] font-bold uppercase tracking-[0.06em] transition-[width,box-shadow] duration-[140ms] placeholder:text-muted/70 focus:w-56 focus:border-lavender focus:outline-none"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-2 lg:ml-3">
          <Link
            to="/cart"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart, empty'}
            className="relative flex size-9 items-center justify-center rounded-slab border-2 border-edge bg-surface shadow-hard-sm transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-acid hover:text-ink hover:shadow-hard"
          >
            <span aria-hidden="true" className="text-sm">
              ▣
            </span>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center border-2 border-edge bg-red px-1 font-mono text-[10px] font-bold tabular-nums text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <ThemeToggle />

          {isAuthenticated && user ? (
            <>
              <ButtonLink to="/submit" size="sm" variant="accent" className="hidden sm:inline-flex">
                + Launch
              </ButtonLink>

              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen(!accountOpen)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className="flex transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-y-0.5"
                >
                  <Avatar user={user} size="sm" />
                  <span className="sr-only">Your account</span>
                </button>

                {accountOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-12 w-56 animate-[var(--animate-slam)] border-2 border-edge bg-surface p-1.5 shadow-hard-lg"
                  >
                    <div className="border-b-2 border-edge px-3 py-2.5">
                      <p className="truncate font-display text-sm uppercase">{user.name}</p>
                      <p className="truncate font-mono text-[11px] text-muted">@{user.username}</p>
                    </div>
                    <MenuLink to={`/u/${user.username}`}>Your profile</MenuLink>
                    <MenuLink to="/submit">Launch something</MenuLink>
                    <MenuLink to="/orders">Your orders</MenuLink>
                    <MenuLink to="/sell">Sell on Deck</MenuLink>
                    <MenuLink to="/advertise">Advertise</MenuLink>
                    {user.role === 'admin' && <MenuLink to="/admin">Admin</MenuLink>}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="mt-0.5 block w-full px-3 py-2 text-left font-mono text-[12px] font-bold uppercase text-muted transition-colors hover:bg-edge hover:text-canvas"
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
            variant="secondary"
            size="sm"
            className="px-2.5 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="animate-[var(--animate-slam)] border-t-2 border-edge bg-surface px-4 pb-4 pt-3 md:hidden">
          <form onSubmit={onSearch} role="search" className="mb-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="SEARCH LAUNCHES"
              aria-label="Search launches"
              className="h-11 w-full border-2 border-edge bg-canvas px-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] placeholder:text-muted/70 focus:border-lavender focus:outline-none"
            />
          </form>

          <nav aria-label="Mobile" className="flex flex-col gap-1.5">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'border-2 border-edge px-3 py-2.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em]',
                    isActive ? 'bg-acid text-ink' : 'bg-canvas text-body',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-3 flex flex-col gap-2 border-t-2 border-edge pt-3">
            {isAuthenticated ? (
              <ButtonLink to="/submit" variant="accent" size="md" className="w-full">
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
      className="mt-0.5 block px-3 py-2 font-mono text-[12px] font-bold uppercase text-muted transition-colors hover:bg-acid hover:text-ink"
    >
      {children}
    </Link>
  );
}
