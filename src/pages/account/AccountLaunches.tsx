import { ItemCard } from '@/components/items/ItemCard';
import { ButtonLink } from '@/components/ui/Button';
import { ItemCardSkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useMeta';

/** Everything you have launched, with the same card the rest of Deck uses. */
export function AccountLaunches() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.username ?? '');

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-tight text-3xl uppercase">Launches</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
            Everything you have posted to the board.
          </p>
        </div>
        <ButtonLink to="/submit">Launch something</ButtonLink>
      </header>

      {isLoading ? (
        <ItemCardSkeletonList count={3} />
      ) : profile?.items.length ? (
        <div className="space-y-3">
          {profile.items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
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
