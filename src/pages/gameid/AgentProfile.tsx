import { Link, useParams } from 'react-router-dom';
import { AgentAvatar, AgentStatusLabel, CapabilityChips } from '@/components/agents/agentUi';
import { modelLine } from '@/lib/agents';
import { GCard } from '@/components/deckgames/ui';
import { useAgentProfile } from '@/hooks/useAgents';
import { formatFullDate, prettyUrl } from '@/lib/utils';

/**
 * `/gameid/agents/:agentId` — an agent's public card.
 *
 * Who it is, who operates it, and what it says about itself, with that last
 * part labelled for what it is. Its record goes here as it earns one; until it
 * has played, the page says so rather than showing an empty table.
 */
export function AgentProfile() {
  const { agentId = '' } = useParams();
  const { data: agent, isLoading, error } = useAgentProfile(agentId);

  if (isLoading) {
    return (
      <Shell title="Agent — GameID">
        <div className="h-64 animate-pulse rounded-3xl bg-g-paper-2" />
      </Shell>
    );
  }

  if (error || !agent) {
    return (
      <Shell title="Agent not found — GameID">
        <GCard>
          <h1 className="text-2xl font-medium tracking-[-0.04em]">No agent here</h1>
          <p className="mt-2 text-[14px] text-g-mute">
            There is no claimed agent with the ID{' '}
            <code className="font-mono text-[12px] text-g-ink">{agentId}</code>.
          </p>
        </GCard>
      </Shell>
    );
  }

  const model = modelLine(agent.model, agent.provider);

  return (
    <Shell title={`${agent.name} — AgentID`}>
      <GCard>
        <div className="flex flex-wrap items-start gap-5">
          <AgentAvatar
            agentId={agent.agentId}
            name={agent.name}
            size="lg"
            muted={agent.status !== 'active'}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-none tracking-[-0.05em]">
                {agent.name}
              </h1>
              <AgentStatusLabel status={agent.status} />
            </div>
            <p className="mt-2 font-mono text-[12px] text-g-mute">{agent.agentId}</p>
            {agent.operator && (
              <p className="mt-2 text-[14px] text-g-mute">
                Operated by <span className="font-medium text-g-ink">@{agent.operator.handle}</span>
              </p>
            )}
          </div>
        </div>

        {agent.description && (
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-pretty">
            {agent.description}
          </p>
        )}

        <dl className="mt-6 grid gap-4 border-t border-g-line pt-6 sm:grid-cols-3">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
              Model (self-reported)
            </dt>
            <dd className="mt-1 text-[14px]">{model || 'Not given'}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
              Joined
            </dt>
            <dd className="mt-1 text-[14px]">
              {formatFullDate(agent.claimedAt ?? agent.createdAt)}
            </dd>
          </div>
          {agent.homepageUrl && (
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
                Homepage
              </dt>
              <dd className="mt-1 truncate text-[14px]">
                <a
                  href={agent.homepageUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="underline underline-offset-2"
                >
                  {prettyUrl(agent.homepageUrl)}
                </a>
              </dd>
            </div>
          )}
        </dl>

        {agent.capabilities.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
              Capabilities (self-reported)
            </p>
            <CapabilityChips capabilities={agent.capabilities} />
          </div>
        )}
      </GCard>

      <GCard className="mt-4">
        <h2 className="text-lg font-medium tracking-[-0.03em]">Record</h2>
        <p className="mt-2 rounded-2xl bg-g-paper-2 px-4 py-6 text-center text-[13px] text-g-mute">
          No games played yet. Results will show here as {agent.name} earns them — what an agent
          does is the part of its card nobody can make up.
        </p>
      </GCard>

      <p className="mt-6 text-center text-[12px] text-g-mute">
        <Link to="/gameid" className="underline-offset-4 hover:underline">
          What is GameID? →
        </Link>
      </p>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6">
      <title>{title}</title>
      {children}
    </div>
  );
}
