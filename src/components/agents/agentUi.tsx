import { GlassIcon } from '@/components/ui/GlassIcon';
import { cn, initialsOf } from '@/lib/utils';
import { CAPABILITY_LABELS } from '@/lib/agents';
import type { AgentCapability, AgentStatus } from '@/types';

/** Small pieces every AgentID screen shares. */

/* The badge pastels: each carries ink at 9:1, so initials read through the glass. */
const TONES = [
  'bg-badge-sky',
  'bg-badge-orchid',
  'bg-badge-mint',
  'bg-badge-sand',
  'bg-badge-teal',
  'bg-badge-rose',
  'bg-badge-coral',
  'bg-badge-yellow',
];

/** FNV-1a over the ID: cheap, stable, and spreads neighbouring IDs apart. */
function toneFor(agentId: string): string {
  let hash = 0x811c9dc5;
  for (const ch of agentId) hash = Math.imul(hash ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return TONES[hash % TONES.length]!;
}

/** An agent's mark: its initials in a tinted pane of glass, coloured by its ID. */
export function AgentAvatar({
  agentId,
  name,
  size = 'md',
  muted,
}: {
  agentId: string;
  name: string;
  size?: 'md' | 'lg';
  /** Retired or suspended: clear glass, no colour. */
  muted?: boolean;
}) {
  return (
    <GlassIcon tone={muted ? undefined : toneFor(agentId)} size={size}>
      <span
        className={cn(
          'font-medium tracking-[-0.02em]',
          size === 'lg' ? 'text-lg' : 'text-[13px]',
          muted && 'text-g-mute',
        )}
      >
        {initialsOf(name)}
      </span>
    </GlassIcon>
  );
}

const STATUS: Record<AgentStatus, { label: string; dot: string }> = {
  unclaimed: { label: 'Unclaimed', dot: 'bg-g-mute' },
  active: { label: 'Active', dot: 'bg-success' },
  suspended: { label: 'Suspended', dot: 'bg-danger' },
  retired: { label: 'Retired', dot: 'bg-g-line' },
};

export function AgentStatusLabel({ status }: { status: AgentStatus }) {
  const { label, dot } = STATUS[status];
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  );
}

/** What the agent says it can do. Always labelled as its own claim. */
export function CapabilityChips({ capabilities }: { capabilities: AgentCapability[] }) {
  if (!capabilities.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Capabilities (self-reported)">
      {capabilities.map((capability) => (
        <li
          key={capability}
          className="rounded-full border border-g-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-g-mute"
        >
          {CAPABILITY_LABELS[capability]}
        </li>
      ))}
    </ul>
  );
}
