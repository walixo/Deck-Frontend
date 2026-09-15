import {
  DocumentTextIcon,
  IdentificationIcon,
  LockClosedIcon,
  PaintBrushIcon,
  PuzzlePieceIcon,
  RocketLaunchIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { cn, profilePath } from '@/lib/utils';

/**
 * Your account, laid out like the staff area.
 *
 * Settings had grown into one long scroll — details, then photo, then password
 * — and every feature since has wanted somewhere to put a personal view: your
 * launches, your writing, your custom prints, your orders. A single page cannot
 * absorb that without becoming a form nobody finishes.
 *
 * So it borrows the admin shell's shape rather than inventing a second one.
 * Grouped sidebar, sticky, one gate at the top. The difference is who it is
 * for: every account gets this, and it is not gated on a role.
 */
interface NavItem {
  to: string;
  label: string;
  icon: typeof Squares2X2Icon;
  end?: boolean;
}

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'You',
    items: [
      { to: '/settings', label: 'Overview', icon: Squares2X2Icon, end: true },
      { to: '/settings/profile', label: 'Profile', icon: IdentificationIcon },
      { to: '/settings/password', label: 'Password', icon: LockClosedIcon },
    ],
  },
  {
    label: 'Your work',
    items: [
      { to: '/settings/launches', label: 'Launches', icon: RocketLaunchIcon },
      { to: '/settings/writing', label: 'Writing', icon: DocumentTextIcon },
      { to: '/settings/games', label: 'Games', icon: PuzzlePieceIcon },
      { to: '/settings/prints', label: 'Custom prints', icon: PaintBrushIcon },
      { to: '/settings/orders', label: 'Orders', icon: ShoppingBagIcon },
    ],
  },
];

export function AccountShell() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

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

  /* Waits for the session to resolve before deciding — redirecting on a merely
     unloaded session bounces somebody off their own account on refresh. */
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <aside className="sticky top-24 hidden w-60 shrink-0 self-start rounded-slab border border-edge bg-surface shadow-hard md:block">
        {/* Who you are, in the accent — the one filled area, so everything
            below it reads as a list rather than competing with it. */}
        <Link
          to={profilePath(user.username)}
          className="flex items-center gap-2.5 border-b border-edge bg-pop p-3 transition-opacity hover:opacity-90"
        >
          <Avatar user={user} size="sm" className="shrink-0" />
          <span className="min-w-0">
            <span className="block truncate font-display text-sm uppercase text-on-pop">
              {user.name}
            </span>
            <span className="block truncate font-mono text-[10px] text-on-pop/70">
              View public page →
            </span>
          </span>
        </Link>

        <nav aria-label="Account sections" className="p-2">
          {GROUPS.map((group) => (
            <div key={group.label} className="mb-2 last:mb-0">
              <p className="px-2 pb-1 pt-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                {group.label}
              </p>

              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 border px-2.5 py-2 font-display text-[13px] uppercase transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)]',
                          isActive
                            ? 'border-edge bg-deep text-on-deep shadow-hard-sm'
                            : 'border-transparent text-muted hover:border-edge hover:bg-surface-2 hover:text-body',
                        )
                      }
                    >
                      <item.icon aria-hidden="true" className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Below md the sidebar is gone and this strip replaces it. A 240px
            column on a phone is the whole screen. */}
        <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:hidden">
          {GROUPS.flatMap((group) => group.items).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'shrink-0 whitespace-nowrap border border-edge px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em]',
                  isActive ? 'bg-deep text-on-deep' : 'bg-surface text-muted',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <Outlet />
      </div>
    </div>
  );
}
