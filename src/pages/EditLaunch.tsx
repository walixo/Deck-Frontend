import { Link, Navigate, useParams } from 'react-router-dom';
import { LaunchForm } from '@/components/items/LaunchForm';
import { PageBanner } from '@/components/ui/Ambient';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useItem } from '@/hooks/useItems';
import { editWindow } from '@/lib/utils';

/**
 * Fixing a launch in the hours after posting it.
 *
 * There was no edit surface at all before this — only image management — so the
 * only way to correct a typo was to delete the launch and post it again, losing
 * whatever votes and comments had already arrived.
 *
 * The window is the whole design. Inside it a maker can change anything, because
 * the first thing anybody does after publishing is find the mistake. Outside it
 * they can change nothing, because the text people voted on should be the text
 * that stays — and every edit made inside the window still lands in the public
 * revision history.
 */
export function EditLaunch() {
  const { slug = '' } = useParams();
  const { data: item, isLoading, isError, error, refetch } = useItem(slug);
  const { user, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-6 h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (!item) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isOwner = user?.id === item.submittedBy.id;
  const isStaff = user?.role === 'admin';
  if (!isOwner && !isStaff) return <Navigate to={`/item/${item.slug}`} replace />;

  const window = editWindow(item.editableUntil);

  /* Staff edit outside the window; the server allows it and audits it. An owner
     arriving late gets sent back rather than shown a form that cannot save. */
  if (!window.open && !isStaff) return <Navigate to={`/item/${item.slug}`} replace />;

  return (
    <div className="relative isolate mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8 max-w-2xl">
        <p
          className={`mb-3 inline-block border-2 border-edge px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] ${
            window.open ? 'bg-warning text-ink' : 'bg-edge text-canvas'
          }`}
        >
          {window.open ? `${window.label} left to edit` : 'Editing as staff'}
        </p>

        <h1 className="display-tight text-4xl uppercase text-balance sm:text-5xl">
          Edit {item.name}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
          {window.open ? (
            <>
              A launch stays editable for a few hours after it goes up. After that it sets — to
              change the product itself,{' '}
              <Link
                to={`/item/${item.slug}/release`}
                className="font-bold underline underline-offset-2"
              >
                ship a new version
              </Link>
              . Every change is recorded in the launch&apos;s public history.
            </>
          ) : (
            <>
              This launch&apos;s edit window has closed. You can still change it because you are
              staff — the edit will be attributed to you in the public history and written to the
              audit trail.
            </>
          )}
        </p>
      </header>

      <LaunchForm key={item.id} mode="edit" from={item} />
    </div>
  );
}
