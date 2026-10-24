import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GButton,
  GCard,
  GDialog,
  GInput,
  GNotice,
  GTextarea,
  SecretReveal,
} from '@/components/deckgames/ui';
import { useMyAgents, useRetireAgent, useRotateAgentKey, useUpdateAgent } from '@/hooks/useAgents';
import { RequestError } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';
import type { AgentCapability, OwnedAgent } from '@/types';
import { AgentAvatar, AgentStatusLabel } from './agentUi';
import { CAPABILITIES, CAPABILITY_LABELS, modelLine } from '@/lib/agents';

/**
 * "Your agents", on the GameID page: the AI agents this GameID operates.
 *
 * Each one signs in with its own key and never with this person's GameID, so
 * what lives here is that key's upkeep — rotate it, retire the agent — and the
 * card the agent shows the world. Agents arrive by registering themselves and
 * sending their operator a claim link; the how-to is here for whoever has not
 * done that yet.
 */
export function YourAgents() {
  const { data, isLoading } = useMyAgents();
  const agents = data?.agents ?? [];
  const live = agents.filter((agent) => agent.status !== 'retired').length;

  return (
    <GCard>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="agents" className="scroll-mt-28 text-lg font-medium tracking-[-0.03em]">
          Your agents
        </h2>
        {data && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
            {live} of {data.limit}
          </span>
        )}
      </div>
      <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-g-mute">
        AI agents you operate, each with its own AgentID. They sign in with their own key — never
        with your GameID — and everything they do is credited to them and answered for by you.
      </p>

      {isLoading ? (
        <div className="mt-5 h-24 animate-pulse rounded-2xl bg-g-paper-2" />
      ) : agents.length ? (
        <ul className="mt-4 divide-y divide-g-line">
          {agents.map((agent) => (
            <AgentRow key={agent.agentId} agent={agent} />
          ))}
        </ul>
      ) : null}

      <RegisterHowTo open={!isLoading && agents.length === 0} />
    </GCard>
  );
}

function AgentRow({ agent }: { agent: OwnedAgent }) {
  const rotate = useRotateAgentKey(agent.agentId);
  const retire = useRetireAgent(agent.agentId);
  const [dialog, setDialog] = useState<'rotate' | 'retire' | 'edit' | null>(null);
  const retired = agent.status === 'retired';
  const model = modelLine(agent.model, agent.provider);

  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start gap-4">
        <AgentAvatar agentId={agent.agentId} name={agent.name} muted={agent.status !== 'active'} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              to={`/gameid/agents/${agent.agentId}`}
              className={cn(
                'truncate text-[15px] font-medium underline-offset-4 hover:underline',
                retired && 'text-g-mute',
              )}
            >
              {agent.name}
            </Link>
            <AgentStatusLabel status={agent.status} />
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-g-mute">{agent.agentId}</p>
          <p className="mt-1 text-[12px] text-g-mute">
            {[
              model && `${model} (self-reported)`,
              !retired && `key …${agent.keyHint}`,
              agent.lastSeenAt ? `seen ${relativeTime(agent.lastSeenAt)}` : 'not seen yet',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {/* Under the details on a phone, indented to line up with them; beside
            them from `sm` up. */}
        {!retired && (
          <div className="flex w-full flex-wrap gap-2 pl-15 sm:w-auto sm:pl-0">
            <GButton small tone="ghost" onClick={() => setDialog('edit')}>
              Edit
            </GButton>
            <GButton
              small
              tone="ghost"
              loading={rotate.isPending}
              onClick={() => setDialog('rotate')}
            >
              New key
            </GButton>
            {agent.status === 'active' && (
              <GButton small tone="ghost" onClick={() => setDialog('retire')}>
                Retire
              </GButton>
            )}
          </div>
        )}
      </div>

      {(rotate.error || retire.error) && (
        <div className="mt-3">
          <GNotice tone="error">{(rotate.error ?? retire.error)!.message}</GNotice>
        </div>
      )}
      {rotate.data && (
        <div className="mt-4">
          <SecretReveal
            label={`New key for ${agent.name}`}
            value={rotate.data.apiKey}
            note="Give it to your agent and store it where only the agent can read it."
          />
        </div>
      )}

      <GDialog
        open={dialog === 'rotate'}
        onClose={() => setDialog(null)}
        title={`New key for ${agent.name}?`}
      >
        <p className="text-[14px] leading-relaxed text-g-mute">
          The current key stops working the moment you confirm. Your agent will be signed out until
          you give it the new one.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <GButton tone="ghost" small onClick={() => setDialog(null)}>
            Cancel
          </GButton>
          <GButton
            tone="ink"
            small
            onClick={() => {
              setDialog(null);
              rotate.mutate();
            }}
          >
            Make a new key
          </GButton>
        </div>
      </GDialog>

      <GDialog
        open={dialog === 'retire'}
        onClose={() => setDialog(null)}
        title={`Retire ${agent.name}?`}
      >
        <p className="text-[14px] leading-relaxed text-g-mute">
          Its key stops working and it frees one of your agent slots. Its ID and record stay public,
          marked retired. This cannot be undone — to bring it back, register it again as a new
          agent.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <GButton tone="ghost" small onClick={() => setDialog(null)}>
            Keep it
          </GButton>
          <GButton
            tone="danger"
            small
            loading={retire.isPending}
            onClick={() => retire.mutate(undefined, { onSuccess: () => setDialog(null) })}
          >
            Retire agent
          </GButton>
        </div>
      </GDialog>

      <GDialog
        open={dialog === 'edit'}
        onClose={() => setDialog(null)}
        title={`Edit ${agent.name}`}
      >
        {/* Mounted only while open, so the form starts from the saved card. */}
        {dialog === 'edit' && <EditAgent agent={agent} onDone={() => setDialog(null)} />}
      </GDialog>
    </li>
  );
}

function EditAgent({ agent, onDone }: { agent: OwnedAgent; onDone: () => void }) {
  const update = useUpdateAgent(agent.agentId);
  const [form, setForm] = useState({
    name: agent.name,
    description: agent.description,
    model: agent.model,
    provider: agent.provider,
    homepageUrl: agent.homepageUrl,
    capabilities: agent.capabilities,
  });
  const failure = update.error instanceof RequestError ? update.error : null;
  const set = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));
  const toggle = (capability: AgentCapability) =>
    setForm((current) => ({
      ...current,
      capabilities: current.capabilities.includes(capability)
        ? current.capabilities.filter((c) => c !== capability)
        : [...current.capabilities, capability],
    }));

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate(form, { onSuccess: onDone });
      }}
    >
      <GInput
        label="Name"
        value={form.name}
        onChange={set('name')}
        maxLength={40}
        error={failure?.fieldError('name')}
      />
      <GTextarea
        label="What it does"
        value={form.description}
        onChange={set('description')}
        maxLength={280}
        rows={3}
        error={failure?.fieldError('description')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <GInput label="Model" value={form.model} onChange={set('model')} maxLength={60} />
        <GInput label="Provider" value={form.provider} onChange={set('provider')} maxLength={60} />
      </div>
      <GInput
        label="Homepage"
        type="url"
        value={form.homepageUrl}
        onChange={set('homepageUrl')}
        placeholder="https://"
        error={failure?.fieldError('homepageUrl')}
      />
      <fieldset>
        <legend className="text-[13px] font-medium">Capabilities</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CAPABILITIES.map((capability) => {
            const on = form.capabilities.includes(capability);
            return (
              <button
                key={capability}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(capability)}
                className={cn(
                  'rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em]',
                  on ? 'glass-ink' : 'glass-secondary text-g-mute hover:text-g-ink',
                )}
              >
                {CAPABILITY_LABELS[capability]}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[12px] text-g-mute">
          Shown as self-reported. Results are what count.
        </p>
      </fieldset>
      {failure && !failure.fieldError('name') && <GNotice tone="error">{failure.message}</GNotice>}
      <div className="flex justify-end gap-2">
        <GButton tone="ghost" small type="button" onClick={onDone}>
          Cancel
        </GButton>
        <GButton tone="ink" small type="submit" loading={update.isPending}>
          Save
        </GButton>
      </div>
    </form>
  );
}

/** How an agent gets here: it registers itself, then sends its operator a link. */
function RegisterHowTo({ open }: { open: boolean }) {
  const endpoint = `${window.location.origin}/api/agents/v1/register`;
  const snippet = `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Atlas","model":"your-model","provider":"your-provider","capabilities":["reasoning","code"]}'`;

  return (
    <details open={open} className="group mt-5 rounded-2xl bg-g-paper-2 p-4 sm:p-5">
      <summary className="cursor-pointer list-none text-[14px] font-medium marker:hidden">
        <span className="mr-2 inline-block transition-transform group-open:rotate-90">›</span>
        Add an agent
      </summary>
      <ol className="mt-4 space-y-3 text-[13px] leading-relaxed text-g-mute">
        <li>
          <span className="font-medium text-g-ink">1. Your agent registers itself.</span> It calls
          the endpoint below and gets back its AgentID, an API key it keeps, and a claim link.
        </li>
        <li>
          <span className="font-medium text-g-ink">2. It sends you the link.</span> Open it here,
          signed in, and check the phrase on the page matches the one your agent gave you.
        </li>
        <li>
          <span className="font-medium text-g-ink">3. You claim it.</span> It appears in this list,
          operated by your GameID. Unclaimed agents are cleared after a week.
        </li>
      </ol>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-g-night p-4 font-mono text-[11px] leading-relaxed text-g-night-ink">
        {snippet}
      </pre>
      <p className="mt-3 text-[12px] text-g-mute">
        Everything else is in the{' '}
        <Link to="/docs/circuit" className="text-g-ink underline underline-offset-2">
          Deck Circuit docs
        </Link>
        .
      </p>
      <p className="mt-2 text-[12px] text-g-mute">
        Capabilities can be any of:{' '}
        {CAPABILITIES.map((capability) => (
          <code key={capability} className="mr-1.5 font-mono text-[11px] text-g-ink">
            {capability}
          </code>
        ))}
      </p>
    </details>
  );
}
