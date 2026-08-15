import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageBanner } from '@/components/ui/Ambient';
import { useAdminOverview } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/listings', label: 'Review', badge: 'pendingListings' as const },
  { to: '/admin/orders', label: 'Orders', badge: 'awaitingFulfilment' as const },
  { to: '/admin/disbursements', label: 'Payouts', badge: 'sellersOwed' as const },
  { to: '/admin/ads', label: 'Ads', badge: 'pendingAds' as const },
  { to: '/admin/users', label: 'People' },
  { to: '/admin/audit', label: 'Trail' },
];

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

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <span
          role="status"
          aria-label="Checking your session"
          className="size-6 animate-spin border-2 border-edge border-t-transparent"
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
    <div className="relative isolate mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-6">
        <p className="mb-3 inline-block border-2 border-edge bg-edge px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-canvas">
          Staff
        </p>
        <h1 className="display-tight text-4xl uppercase text-balance">Deck admin</h1>
      </header>

      <nav
        aria-label="Admin sections"
        className="mb-8 flex flex-wrap gap-2 border-b-2 border-edge pb-4"
      >
        {TABS.map((tab) => {
          const count = tab.badge ? (overview?.queues[tab.badge] ?? 0) : 0;

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] transition-colors duration-[120ms]',
                  isActive
                    ? 'border-edge bg-acid text-ink'
                    : 'border-transparent text-muted hover:border-edge hover:bg-surface-2 hover:text-body',
                )
              }
            >
              {tab.label}
              {/* Only shown when there is something waiting — a permanent "0"
                  badge trains people to stop looking at the number. */}
              {count > 0 && (
                <span className="min-w-5 border-2 border-edge bg-red px-1 text-center text-[10px] tabular-nums text-white">
                  {count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
