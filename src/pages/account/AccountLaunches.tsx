import { ItemCard } from '@/components/items/ItemCard';
import { LaunchTraffic } from '@/components/account/LaunchTraffic';
import { ButtonLink } from '@/components/ui/Button';
import { ItemCardSkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useMyLaunchViews } from '@/hooks/useAnalytics';
import { useProfile } from '@/hooks/useMeta';
import { formatNumber } from '@/lib/utils';

/** Everything you have launched, with the same card the rest of Deck uses. */
export function AccountLaunches() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.username ?? '');

  /*
   * Traffic comes separately from the launches themselves.
   *
   * The profile endpoint is public and serves the same payload to everybody,
   * so view history cannot ride along on it — this is the only page where the
   * reader is definitely the owner. Fetched in parallel rather than after, and
   * the page renders without waiting: the cards are the content, the lines
   * under them are commentary.
   */
  const { data: views } = useMyLaunchViews(30, Boolean(user));
  const byLaunch = new Map((views?.launches ?? []).map((entry) => [entry.id, entry]));

  const windowTotal = (views?.launches ?? []).reduce((sum, entry) => sum + entry.windowViews, 0);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-tight text-3xl uppercase">Launches</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
            Everything you have posted to the board.
            {/* Only once there is something to report. "0 views across 0
                launches" is a worse greeting than no sentence at all. */}
            {views && views.launches.length > 0 && windowTotal > 0 && (
              <>
                {' '}
                <span className="text-body">
                  {formatNumber(windowTotal)} views across{' '}
                  {views.launches.length === 1
                    ? 'your launch'
                    : `${views.launches.length} launches`}{' '}
                  in the last {views.days.length} days.
                </span>
              </>
            )}
          </p>
        </div>
        <ButtonLink to="/submit">Launch something</ButtonLink>
      </header>

      {isLoading ? (
        <ItemCardSkeletonList count={3} />
      ) : profile?.items.length ? (
        <div className="space-y-5">
          {profile.items.map((item) => {
            const traffic = byLaunch.get(item.id);

            return (
              <div key={item.id}>
                <ItemCard item={item} />
                {traffic && views && <LaunchTraffic views={traffic} days={views.days} />}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nothing launched yet"
          description="Post a product and it goes on today's board."
          action={<ButtonLink to="/submit">Launch something</ButtonLink>}
        />
      )}
    </div>
  );
}
