import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLaunches } from '@/hooks/useSite';
import { NotFound } from '@/pages/NotFound';

/**
 * The launch product's pages, behind the Launches switch (Admin → Site).
 *
 * Off, visitors get the ordinary 404 — the pages simply aren't there. Staff
 * still get through, with a note saying nobody else can see it, so the board
 * can be worked on while it is hidden. Wraps either its children or, as a
 * layout route, the routes nested inside it.
 */
export function LaunchesOnly({ children }: { children?: ReactNode }) {
  const launches = useLaunches();
  const { user, isLoading } = useAuth();
  const page = children ?? <Outlet />;
  if (launches) return page;
  if (isLoading) return null;
  if (user?.role !== 'admin') return <NotFound />;
  return (
    <>
      <p className="border-b border-line bg-surface-2 px-4 py-2 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
        Launches are switched off — only staff can see this page
      </p>
      {page}
    </>
  );
}
