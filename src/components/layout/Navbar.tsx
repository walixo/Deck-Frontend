import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Star } from '@/components/ui/Star';
import { useCart } from '@/hooks/useCart';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { cn, profilePath } from '@/lib/utils';
import { Logo } from './Logo';
import { SoundToggle } from './SoundToggle';
import { ThemeToggle } from './ThemeToggle';

/**
 * The nav.
 *
 * `star` marks a link as new or special. It is a shape, not a colour — this has
 * to survive greyscale like everything else (CONTRACT rule 5) — and it is the
 * sparkle from the neobrutalism.dev set rather than a text `★`, which renders
 * as a different glyph in every font stack and sits off-baseline in most.
 *
 * `children` turns a link into a dropdown. Picks lives under Discover because
 * they are the same activity at two levels of curation: everything, and the
 * handful Deck is pointing at. As a sibling it read as a seventh unrelated
 * destination; nested, the relationship is the label. Both routes stay live and
 * the parent is still a link in its own right — see the note on the trigger.
 */
interface NavItem {
  to: string;
  label: string;
  star?: boolean;
  children?: { to: string; label: string; blurb: string }[];
}

const NAV_LINKS: NavItem[] = [
  { to: '/', label: 'Home' },
  {
    to: '/discover',
    label: 'Discover',
    children: [
      { to: '/discover', label: 'All launches', blurb: 'Everything on Deck, filtered how you like' },
      { to: '/spotlight', label: 'Picks', blurb: 'The handful Deck is pointing at this week' },
    ],
  },
  { to: '/leaderboard', label: 'Board' },
  { to: '/future-gen', label: 'Future Gen', star: true },
  { to: '/forum', label: 'Forum' },
  {
    to: '/shop',
    label: 'Shop',
    children: [
      { to: '/shop', label: 'Merch', blurb: 'T-shirts, stickers and print from makers' },
      {
        to: '/customise',
        label: 'Print your own',
        blurb: 'Send us a PNG and we put it on a shirt',
      },
      {
        to: '/acquisitions',
        label: 'Acquisitions',
        blurb: 'Whole products and tools, for sale outright',
      },
    ],
  },
  { to: '/games', label: 'Games' },
  { to: '/blog', label: 'Blog' },
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
    <header className="sticky top-0 z-50 border-b border-edge bg-canvas">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/*
         * Seven links, and the seventh is the longest word in the set.
         *
         * The row was already tight at md — six links measured 788px of content
         * in a 768px viewport, fixed then by shaving 2px a side off each. "Future
         * Gen" is another ~95px on top of that, which puts md back over the edge
         * with no padding left to give. So the full row now starts at lg and the
         * hamburger covers md, where it costs one tap and nothing is hidden.
         *
         * `lg:px-2 xl:px-3`: the tightened padding now belongs to lg, since that
         * is the breakpoint doing the squeezing.
         */}
        <nav aria-label="Main" className="ml-2 hidden items-center gap-1 lg:flex lg:ml-4">
          {NAV_LINKS.map((link) =>
            link.children ? (
              <NavDropdown key={link.to} item={link} />
            ) : (
              <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navClass}>
                {link.label}
                {link.star && <Star className="size-2.5 shrink-0" spin={-8} />}
              </NavLink>
            ),
          )}
        </nav>

        {/*
         * No search in the header row.
         *
         * It had already been pushed out to xl — at lg the header measured
         * 1131px of content in a 1024px viewport and something had to leave —
         * so on every screen below a very wide desktop this row has looked like
         * this for a while. Now it looks like it everywhere.
         *
         * Search itself is not gone: /discover carries its own field, and the
         * menu below keeps one, so there is still a way in from any width.
         */}

        {/*
         * `ml-auto` at every width, with no `lg:` override.
         *
         * It used to carry `lg:ml-3`, which beat `ml-auto` from lg up and left
         * these pinned to the end of the nav links instead of the end of the
         * row. That was invisible while the search field sat between them
         * holding its own `ml-auto`; the moment the field came out, the whole
         * group slid left into the space. The gap belongs here, not there.
         */}
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/cart"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart, empty'}
            className="relative flex size-9 items-center justify-center rounded-slab border border-edge bg-surface shadow-hard-sm transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-deep hover:text-on-deep hover:shadow-hard"
          >
            <span aria-hidden="true" className="text-sm">
              ▣
            </span>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center border border-edge bg-red px-1 font-mono text-[10px] font-bold tabular-nums text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <SoundToggle />

          <ThemeToggle />

          {isAuthenticated && user ? (
            <>
              <ButtonLink to="/submit" size="sm" className="hidden sm:inline-flex">
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
                    className="absolute right-0 top-12 w-56 animate-[var(--animate-slam)] border border-edge bg-surface p-1.5 shadow-hard-lg"
                  >
                    <div className="border-b border-edge px-3 py-2.5">
                      <p className="truncate font-display text-sm uppercase">{user.name}</p>
                      <p className="truncate font-mono text-[11px] text-muted">@{user.username}</p>
                    </div>
                    {/* Public page first: it is what most people are looking for when they
                        click their own avatar — "how do I look to everyone else". */}
                    <MenuLink to={profilePath(user.username)}>Public page</MenuLink>
                    <MenuLink to="/settings">Your profile</MenuLink>
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
            className="px-2.5 lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="animate-[var(--animate-slam)] border-t border-edge bg-surface px-4 pb-4 pt-3 lg:hidden">
          <form onSubmit={onSearch} role="search" className="mb-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="SEARCH LAUNCHES"
              aria-label="Search launches"
              className="h-11 w-full border border-edge bg-canvas px-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] placeholder:text-muted/70 focus:border-accent focus:outline-none"
            />
          </form>

          {/* Nested items are indented rather than collapsed behind a
              disclosure. There is no shortage of vertical room in a sheet, and
              a menu that hides two links behind a tap is worse than a menu that
              is two rows longer. */}
          <nav aria-label="Mobile" className="flex flex-col gap-1.5">
            {NAV_LINKS.map((link) => (
              <div key={link.to} className="contents">
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 border border-edge px-3 py-2.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em]',
                      isActive ? 'bg-deep text-on-deep' : 'bg-canvas text-body',
                    )
                  }
                >
                  {link.label}
                  {link.star && <Star className="size-2.5 shrink-0" spin={-8} />}
                </NavLink>

                {link.children
                  ?.filter((child) => child.to !== link.to)
                  .map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className={({ isActive }) =>
                        cn(
                          'ml-5 border border-edge px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.06em]',
                          isActive ? 'bg-deep text-on-deep' : 'bg-surface-2 text-muted',
                        )
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
              </div>
            ))}
          </nav>

          <div className="mt-3 flex flex-col gap-2 border-t border-edge pt-3">
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

/** Shared between the plain links and the dropdown trigger, so they match. */
const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-1.5 whitespace-nowrap border px-2 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] transition-colors duration-[120ms] xl:px-3',
    isActive
      ? 'border-edge bg-deep text-on-deep'
      : 'border-transparent text-muted hover:border-edge hover:bg-surface-2 hover:text-body',
  );

/**
 * A nav item with a panel under it.
 *
 * The trigger is a real `<NavLink>`, not a button: Discover is a page, and a
 * parent that only opens a menu strands the destination people actually wanted.
 * The chevron beside it is the disclosure, and it is what opens the panel.
 *
 * Opens on hover *and* on click of the chevron, closes on pointer-leave, Escape
 * or a navigation. Hover alone is a trap for anyone on a touch screen or a
 * keyboard, and click alone loses the speed that makes a dropdown worth having.
 */
function NavDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  /* The parent lights up when any of its children is the current page —
     otherwise landing on Picks makes the whole nav look like nowhere. */
  const within = item.children?.some((child) => child.to === location.pathname) ?? false;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      <div className="flex items-stretch">
        <NavLink
          to={item.to}
          className={({ isActive }) => navClass({ isActive: isActive || within })}
          onClick={() => setOpen(false)}
        >
          {item.label}
        </NavLink>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={`${item.label} sections`}
          className="ml-0.5 flex items-center border border-transparent px-1 text-muted transition-colors duration-[120ms] hover:border-edge hover:bg-surface-2 hover:text-body"
        >
          <span aria-hidden="true" className="text-[9px] leading-none">
            ▼
          </span>
        </button>
      </div>

      {open && (
        <div
          /* `top-full` with no gap: a panel that starts a few pixels below its
             trigger loses the pointer on the way down and closes itself. */
          className="absolute left-0 top-full z-50 w-64 animate-[var(--animate-slam)] border border-edge bg-surface p-1.5 shadow-hard-lg"
        >
          {item.children?.map((child) => (
            <Link
              key={child.to}
              to={child.to}
              onClick={() => setOpen(false)}
              className="block border border-transparent px-2.5 py-2 transition-colors duration-[120ms] hover:border-edge hover:bg-surface-2"
            >
              <span className="font-mono text-[12px] font-bold uppercase tracking-[0.06em]">
                {child.label}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted text-pretty">
                {child.blurb}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MenuLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="mt-0.5 block px-3 py-2 font-mono text-[12px] font-bold uppercase text-muted transition-colors hover:bg-deep hover:text-on-deep"
    >
      {children}
    </Link>
  );
}
