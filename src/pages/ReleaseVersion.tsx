import { Link, Navigate, useParams } from 'react-router-dom';
import { LaunchForm } from '@/components/items/LaunchForm';
import { PageBanner } from '@/components/ui/Ambient';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useItem } from '@/hooks/useItems';
import { relativeTime } from '@/lib/utils';

/**
 * Shipping a new version of an existing launch.
 *
 * An outer loader around a keyed form: `LaunchForm` seeds its state from the
 * item during the initial render, so the item has to be in hand before it
 * mounts. Keying on the id means navigating from one product's release page to
 * another remounts the form rather than leaving the previous product's text in
 * the fields.
 */
export function ReleaseVersion() {
  const { slug = '' } = useParams();
  const { data: item, isLoading, isError, error, refetch } = useItem(slug);
  const { user, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
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

  /* The server is the authority here — it also checks ownership and the
     cooldown. This only avoids showing a form that could never be submitted. */
  const mayRelease = user?.id === item.submittedBy.id || user?.role === 'admin';
  if (!mayRelease) return <Navigate to={`/item/${item.slug}`} replace />;

  return (
    <div className="relative isolate mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8 max-w-2xl">
        <p className="mb-3 inline-block border border-edge bg-pop px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-pop">
          New version
        </p>
        <h1 className="display-tight text-3xl uppercase text-balance sm:text-4xl">
          Ship the next {item.name}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
          This goes up as its own launch on today&apos;s board, starting from zero votes.{' '}
          <Link to={`/item/${item.slug}`} className="font-bold underline underline-offset-2">
            {item.name}
            {item.version ? ` ${item.version}` : ''}
          </Link>{' '}
          keeps its {item.voteCount} {item.voteCount === 1 ? 'vote' : 'votes'} and stays where it is,
          launched {relativeTime(item.launchDate)}.
        </p>
      </header>

      {/* Fields start as a copy of the current version; change whatever shipped. */}
      <LaunchForm key={item.id} mode="release" from={item} />
    </div>
  );
}
