import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { VerifiedMark } from '@/components/ui/VerifiedMark';
import { useAuth } from '@/hooks/useAuth';
import { useMyDesigns } from '@/hooks/useCustom';
import { useMyPosts } from '@/hooks/usePosts';
import { useProfile } from '@/hooks/useMeta';
import { formatNumber, profilePath } from '@/lib/utils';

/**
 * The landing panel of somebody's own account.
 *
 * Counts first, then the things they can do. It answers "what have I got here"
 * before "what can I change", which is the order somebody arrives in — the old
 * single-page Settings opened on a name field, which is the least interesting
 * thing about an account that has ten launches and three drafts.
 */
export function AccountOverview() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.username ?? '');
  const { data: posts } = useMyPosts();
  const { data: designs } = useMyDesigns();

  if (!user) return null;

  const drafts = posts?.filter((post) => post.status === 'draft').length ?? 0;
  const published = posts?.filter((post) => post.status === 'published').length ?? 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar user={user} size="lg" />
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 display-tight text-3xl uppercase">
              {user.name}
              {user.verified && <VerifiedMark name={user.name} />}
            </h1>
            <p className="mt-1 font-mono text-[12px] text-muted">@{user.username}</p>
          </div>
        </div>

        <ButtonLink to={profilePath(user.username)} variant="secondary" size="sm">
          View public page
        </ButtonLink>
      </header>

      <section>
        <h2 className="mb-3 border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          Your numbers
        </h2>
        <dl className="grid gap-3 sm:grid-cols-4">
          <Stat label="Launches" value={formatNumber(profile?.stats.launches ?? 0)} />
          <Stat label="Votes received" value={formatNumber(profile?.stats.votesReceived ?? 0)} />
          <Stat label="Votes given" value={formatNumber(profile?.stats.votesGiven ?? 0)} />
          <Stat label="Comments" value={formatNumber(profile?.stats.commentsWritten ?? 0)} />
        </dl>
      </section>

      <section>
        <h2 className="mb-3 border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          Pick up where you left off
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Shortcut
            to="/settings/writing"
            title="Writing"
            detail={
              drafts > 0
                ? `${drafts} draft${drafts === 1 ? '' : 's'} · ${published} published`
                : published > 0
                  ? `${published} published`
                  : 'Publish your first article'
            }
          />
          <Shortcut
            to="/settings/launches"
            title="Launches"
            detail={`${formatNumber(profile?.stats.launches ?? 0)} posted`}
          />
          <Shortcut
            to="/settings/prints"
            title="Custom prints"
            detail={
              designs && designs.length > 0
                ? `${designs.length} design${designs.length === 1 ? '' : 's'}`
                : 'Put your artwork on a shirt'
            }
          />
          <Shortcut to="/settings/orders" title="Orders" detail="What you have bought" />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-edge bg-surface px-4 py-3 shadow-hard-sm">
      <dd className="font-display text-xl tabular-nums">{value}</dd>
      <dt className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
        {label}
      </dt>
    </div>
  );
}

function Shortcut({ to, title, detail }: { to: string; title: string; detail: string }) {
  return (
    <Link to={to} className="block">
      <Card className="p-4 transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg">
        <p className="font-display text-base uppercase">{title}</p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
          {detail}
        </p>
      </Card>
    </Link>
  );
}
