import { Link, useParams } from 'react-router-dom';
import { ItemCard } from '@/components/items/ItemCard';
import { Ambient } from '@/components/ui/Ambient';
import { Avatar } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ItemCardSkeletonList, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useMeta';
import { formatFullDate, formatNumber, gradientFor, prettyUrl } from '@/lib/utils';

export function Profile() {
  const { username = '' } = useParams();
  const { data, isLoading, isError, error, refetch } = useProfile(username);
  const { user: viewer } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex gap-5">
          <Skeleton className="size-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="mt-10">
          <ItemCardSkeletonList count={3} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState message={error.message} onRetry={() => void refetch()} />
        <div className="mt-6 text-center">
          <Link
            to="/discover"
            className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            ← Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, items, stats } = data;
  const isSelf = viewer?.id === user.id;

  return (
    <div>
      <header className="relative isolate overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800">
        <Ambient variant="halo" />
        {/* Personal tint on top of the shared wash, keyed to the username. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -left-10 -top-24 size-64 rounded-full bg-gradient-to-br opacity-20 blur-3xl dark:opacity-25 ${gradientFor(user.username)}`}
        />

        <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar user={user} size="xl" className="animate-[var(--animate-fade-in)]" />

            <div className="min-w-0 flex-1 animate-[var(--animate-fade-up)]">
              <h1 className="text-3xl font-semibold tracking-tight">{user.name}</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">@{user.username}</p>

              {user.headline && (
                <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {user.headline}
                </p>
              )}
              {user.bio && (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 text-pretty dark:text-zinc-400">
                  {user.bio}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-500">
                {user.websiteUrl && (
                  <a
                    href={user.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-zinc-700 underline-offset-4 hover:text-brand-600 hover:underline dark:text-zinc-300 dark:hover:text-brand-400"
                  >
                    {prettyUrl(user.websiteUrl)} ↗
                  </a>
                )}
                {user.createdAt && <span>Joined {formatFullDate(user.createdAt)}</span>}
              </div>

              {isSelf && (
                <div className="mt-5">
                  <ButtonLink to="/submit" size="sm">
                    Launch something new
                  </ButtonLink>
                </div>
              )}
            </div>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Launches" value={formatNumber(stats.launches)} />
            <StatTile label="Votes received" value={formatNumber(stats.votesReceived)} />
            <StatTile label="Votes given" value={formatNumber(stats.votesGiven)} />
            <StatTile label="Comments" value={formatNumber(stats.commentsWritten)} />
          </dl>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-5 text-xl font-semibold">
          {isSelf ? 'Your launches' : `Launches by ${user.name}`}
          {items.length > 0 && (
            <span className="ml-2 text-sm font-normal tabular-nums text-zinc-500 dark:text-zinc-500">
              {items.length}
            </span>
          )}
        </h2>

        {items.length === 0 ? (
          <EmptyState
            title={isSelf ? 'You have not launched anything yet' : 'No launches yet'}
            description={
              isSelf
                ? 'Your first launch takes about two minutes to write up.'
                : `${user.name} has not posted a launch on Deck yet.`
            }
            action={isSelf ? <ButtonLink to="/submit">Launch your first product</ButtonLink> : undefined}
          />
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                className="animate-[var(--animate-fade-up)]"
                style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-4 py-3">
      <dd className="font-display text-xl font-semibold tabular-nums">{value}</dd>
      <dt className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">{label}</dt>
    </Card>
  );
}
