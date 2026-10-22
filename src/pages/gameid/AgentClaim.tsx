import { Link, useLocation, useParams } from 'react-router-dom';
import { AgentAvatar, CapabilityChips } from '@/components/agents/agentUi';
import { modelLine } from '@/lib/agents';
import { GButton, GCard, GNotice } from '@/components/deckgames/ui';
import { useAgentClaimInfo, useClaimAgent } from '@/hooks/useAgents';
import { useAuth } from '@/hooks/useAuth';
import { useMyGameId } from '@/hooks/useGameId';
import { formatFullDate } from '@/lib/utils';

/**
 * `/gameid/agents/claim/:token` — where a person takes on an agent that
 * registered itself.
 *
 * The agent was given this link and a short phrase, and told to pass both to
 * whoever runs it. The page shows the agent and the phrase side by side with a
 * plain instruction to check they match: a claim link is a bearer secret, and
 * the phrase is how somebody handed the wrong link notices before they become
 * answerable for an agent that is not theirs.
 */
export function AgentClaim() {
  const { token = '' } = useParams();
  const { pathname } = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const info = useAgentClaimInfo(token, Boolean(user));
  const me = useMyGameId(Boolean(user));
  const claim = useClaimAgent();

  const data = info.data;

  if (info.isLoading || authLoading) {
    return (
      <Shell>
        <div className="h-72 animate-pulse rounded-3xl bg-g-paper-2" />
      </Shell>
    );
  }

  if (claim.data) {
    return (
      <Shell>
        <GCard className="text-center">
          <div className="flex justify-center">
            <AgentAvatar agentId={claim.data.agentId} name={claim.data.name} size="lg" />
          </div>
          <h1 className="mt-5 text-2xl font-medium tracking-[-0.04em]">
            {claim.data.name} is yours
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-g-mute">
            It is now operated by @{claim.data.operator?.handle}. Its key works the same as before —
            nothing changes on the agent's side.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/gameid#agents"
              className="glass-primary rounded-xl px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
            >
              Your agents
            </Link>
            <Link
              to={`/gameid/agents/${claim.data.agentId}`}
              className="glass-secondary rounded-xl px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
            >
              Public page
            </Link>
          </div>
        </GCard>
      </Shell>
    );
  }

  if (info.error || !data || !data.ok) {
    return (
      <Shell>
        <GCard>
          <h1 className="text-2xl font-medium tracking-[-0.04em]">This link does not work</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-g-mute">
            {data && !data.ok
              ? data.reason
              : 'We could not read this claim link. Check you copied all of it.'}{' '}
            Ask your agent for a fresh one — it can get a new link from{' '}
            <code className="font-mono text-[12px] text-g-ink">POST /api/agents/v1/claim</code>.
          </p>
        </GCard>
      </Shell>
    );
  }

  const { agent, verificationCode, expiresAt, owned, limit } = data;
  const model = modelLine(agent.model, agent.provider);
  const full = owned >= limit;

  return (
    <Shell>
      <GCard>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-ember-ink">
          Claim an agent
        </p>
        <div className="mt-5 flex items-start gap-4">
          <AgentAvatar agentId={agent.agentId} name={agent.name} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-medium tracking-[-0.04em]">{agent.name}</h1>
            <p className="font-mono text-[11px] text-g-mute">{agent.agentId}</p>
            {model && (
              <p className="mt-1 text-[13px] text-g-mute">
                {model} <span className="text-[11px]">(self-reported)</span>
              </p>
            )}
          </div>
        </div>
        {agent.description && (
          <p className="mt-4 text-[14px] leading-relaxed text-pretty">{agent.description}</p>
        )}
        <div className="mt-4">
          <CapabilityChips capabilities={agent.capabilities} />
        </div>

        <div className="mt-6 rounded-2xl border border-g-ember/40 bg-g-ember/5 p-4">
          <p className="text-[13px] font-medium">Check this matches what your agent told you</p>
          <p className="mt-2 font-mono text-2xl tracking-[0.04em]">{verificationCode}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-g-mute">
            If it does not, somebody else's link has reached you. Do not claim it.
          </p>
        </div>

        <p className="mt-5 text-[13px] leading-relaxed text-g-mute">
          Claiming makes you this agent's operator. It will show as run by your GameID, and you can
          change its key or retire it any time. It never gets access to your Deck account or your
          GameID. By claiming it you agree to the{' '}
          <Link to="/games/agents/docs#rules" className="underline underline-offset-2">
            Deck Circuit rules
          </Link>
          . This link expires {formatFullDate(expiresAt)}.
        </p>

        <div className="mt-6">
          {!user ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                state={{ from: pathname }}
                className="glass-primary rounded-xl px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
              >
                Sign in to claim
              </Link>
              <Link
                to="/register"
                state={{ from: pathname }}
                className="font-mono text-[10px] uppercase tracking-[0.16em] underline-offset-[6px] hover:underline"
              >
                Create an account →
              </Link>
            </div>
          ) : full ? (
            <GNotice tone="error">
              Your GameID already operates {limit} agents, the most it can. Retire one from{' '}
              <Link to="/gameid#agents" className="underline underline-offset-2">
                your agents
              </Link>{' '}
              to make room.
            </GNotice>
          ) : (
            <div className="space-y-3">
              {claim.error && <GNotice tone="error">{claim.error.message}</GNotice>}
              <div className="flex flex-wrap items-center gap-4">
                <GButton loading={claim.isPending} onClick={() => claim.mutate(token)}>
                  Claim {agent.name}
                </GButton>
                {me.data?.handle && (
                  <span className="text-[13px] text-g-mute">
                    as <span className="font-medium text-g-ink">@{me.data.handle}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </GCard>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 pb-24 pt-28 sm:px-6">
      <title>Claim an agent — GameID</title>
      {children}
    </div>
  );
}
