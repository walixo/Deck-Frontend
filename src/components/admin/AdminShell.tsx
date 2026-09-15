import {
  BanknotesIcon,
  BuildingStorefrontIcon,
  PaintBrushIcon,
  PuzzlePieceIcon,
  ChartPieIcon,
  ChevronDoubleLeftIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  HandRaisedIcon,
  MegaphoneIcon,
  Squares2X2Icon,
  SquaresPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { useAdminOverview } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

/**
 * The staff sidebar.
 *
 * Grouped rather than a flat list: eight destinations in one column is a wall,
 * and the groups say what each one is *for* — things needing a decision, things
 * that are configuration, things that are the record.
 */
/** Which overview counter a destination shows, when it shows one. */
type QueueKey = 'pendingListings' | 'awaitingFulfilment' | 'sellersOwed' | 'pendingAds';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Squares2X2Icon;
  end?: boolean;
  badge?: QueueKey;
}

/* Annotated rather than inferred: `flatMap` across the groups widens the badge
   union to `{}` otherwise, and the index into `overview.queues` stops typing. */
const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: Squares2X2Icon, end: true },
      { to: '/admin/audit', label: 'Trail', icon: ClipboardDocumentListIcon },
    ],
  },
  {
    label: 'Queues',
    items: [
      {
        to: '/admin/listings',
        label: 'Review',
        icon: ClipboardDocumentCheckIcon,
        badge: 'pendingListings',
      },
      { to: '/admin/orders', label: 'Orders', icon: ChartPieIcon, badge: 'awaitingFulfilment' },
      { to: '/admin/disbursements', label: 'Payouts', icon: BanknotesIcon, badge: 'sellersOwed' },
      { to: '/admin/ads', label: 'Ads', icon: MegaphoneIcon, badge: 'pendingAds' },
      { to: '/admin/fundraises', label: 'Fundraises', icon: HandRaisedIcon },
      { to: '/admin/acquisitions', label: 'Acquisitions', icon: BuildingStorefrontIcon },
      { to: '/admin/custom', label: 'Custom prints', icon: PaintBrushIcon },
      { to: '/admin/games', label: 'Games', icon: PuzzlePieceIcon },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '/admin/categories', label: 'Categories', icon: SquaresPlusIcon },
      { to: '/admin/users', label: 'People', icon: UsersIcon },
    ],
  },
];

const STORAGE_KEY = 'deck-admin-sidebar';

/**
 * The staff area: one gate, one nav, one place every admin function lives.
 *
 * Guarding here rather than in each page means a new admin route is protected
 * by existing under this element — nobody has to remember to add a check. It
 * waits for the session to resolve before deciding: redirecting on a merely
 * unloaded session would bounce an admin off their own dashboard on refresh.
 */
export function AdminShell() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const { data: overview } = useAdminOverview(isAdmin);

  /* Read once during initial state rather than in an effect — the collapsed
     sidebar should be collapsed on first paint, not flick open then shut. */
  const [collapsed, setCollapsed] = useState(
    () => globalThis.localStorage?.getItem(STORAGE_KEY) === 'collapsed',
  );

  useEffect(() => {
    globalThis.localStorage?.setItem(STORAGE_KEY, collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <span
          role="status"
          aria-label="Checking your session"
          className="size-6 animate-spin border border-edge border-t-transparent"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  /* Signed in but not staff. Home rather than a "forbidden" page: there is
     nothing here for them, and saying so in detail only advertises the area. */
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <aside
        className={cn(
          /* Sticky and self-sizing: the nav should stay put while a long order
             list scrolls beside it. Hidden below md, where the horizontal strip
             below takes over — a 240px sidebar on a phone is the whole screen. */
          'sticky top-24 hidden shrink-0 self-start md:block',
          'rounded-slab border border-edge bg-surface shadow-hard',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        {/* Brand block, in the accent. The one filled area in the sidebar, so
            the eye lands on it first and everything below reads as a list. */}
        <div className="flex items-center gap-2.5 border-b border-edge bg-pop p-3">
          <Link
            to="/"
            aria-label="Back to Deck"
            className="flex size-9 shrink-0 items-center justify-center border border-edge bg-canvas font-display text-sm uppercase text-body"
          >
            D
          </Link>
          {!collapsed && (
            <span className="truncate font-display text-sm uppercase text-on-pop">Deck admin</span>
          )}
        </div>

        <nav aria-label="Admin sections" className="p-2">
          {GROUPS.map((group) => (
            <div key={group.label} className="mb-2 last:mb-0">
              {collapsed ? (
                /* A rule instead of a label. The grouping is still worth
                   showing when there is no room for its name. */
                <div aria-hidden="true" className="mx-2 my-2 border-t border-edge/30" />
              ) : (
                <p className="px-2 pb-1 pt-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  {group.label}
                </p>
              )}

              <ul className="space-y-1">
                {group.items.map((item) => {
                  const count = item.badge ? (overview?.queues[item.badge] ?? 0) : 0;

                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 border px-2.5 py-2 font-display text-[13px] uppercase transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)]',
                            collapsed && 'justify-center px-0',
                            isActive
                              ? 'border-edge bg-pop text-on-pop shadow-hard-sm'
                              : 'border-transparent text-body hover:border-edge hover:bg-surface-2',
                          )
                        }
                      >
                        <item.icon aria-hidden="true" className="size-5 shrink-0" />
                        {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}

                        {/* Only shown when there is something waiting — a
                            permanent "0" trains people to stop looking. */}
                        {count > 0 && (
                          <span
                            className={cn(
                              'shrink-0 border border-edge bg-red text-center font-mono text-[10px] tabular-nums text-white',
                              collapsed
                                ? 'absolute -mt-6 ml-6 size-4 leading-3'
                                : 'min-w-5 px-1 leading-4',
                            )}
                          >
                            {collapsed ? '' : count}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Who is signed in, pinned to the bottom — the sidebar's answer to
            "whose actions is the trail about to record". */}
        <div className="flex items-center gap-2.5 border-t border-edge p-3">
          <Avatar user={user!} size="sm" />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[13px] uppercase">{user!.name}</span>
              <span className="block truncate font-mono text-[10px] uppercase text-muted">
                Admin
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((open) => !open)}
            aria-label={collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
            aria-expanded={!collapsed}
            className={cn(
              'flex size-7 shrink-0 items-center justify-center border border-edge bg-surface transition-transform duration-[120ms] hover:-translate-y-0.5',
              collapsed && 'absolute -mt-16 ml-1',
            )}
          >
            <ChevronDoubleLeftIcon
              aria-hidden="true"
              className={cn('size-3.5 transition-transform duration-[160ms]', collapsed && 'rotate-180')}
            />
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Below md the sidebar is gone, so the sections need somewhere to live.
            A scrollable strip keeps every destination reachable without the
            column eating the screen. */}
        <nav
          aria-label="Admin sections"
          className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:hidden"
        >
          {GROUPS.flatMap((group) => group.items).map((item) => {
            const count = item.badge ? (overview?.queues[item.badge] ?? 0) : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-2 border px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em]',
                    isActive
                      ? 'border-edge bg-pop text-on-pop'
                      : 'border-transparent text-muted hover:border-edge hover:text-body',
                  )
                }
              >
                {item.label}
                {count > 0 && (
                  <span className="min-w-5 border border-edge bg-red px-1 text-center text-[10px] tabular-nums text-white">
                    {count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <Outlet />
      </div>
    </div>
  );
}
