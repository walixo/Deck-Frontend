import { useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { useAuditTrail } from '@/hooks/useAdmin';
import { AUDIT_ACTIONS, type AuditAction, type AuditEvent } from '@/types';

/**
 * How each action reads, and how loudly.
 *
 * Anything that moves money or hands over access is inverted — the same
 * treatment the rest of Deck gives destructive states. Routine approvals stay
 * quiet so the serious entries are the ones your eye lands on when scanning
 * a page of them.
 */
const ACTION_STYLE: Record<AuditAction, { label: string; tone: string }> = {
  'role.granted': { label: 'Staff granted', tone: 'bg-edge text-canvas' },
  'role.revoked': { label: 'Staff revoked', tone: 'bg-edge text-canvas' },
  'payout.recorded': { label: 'Payout', tone: 'bg-edge text-canvas' },
  'merch.approved': { label: 'Approved', tone: 'bg-acid text-ink' },
  'merch.rejected': { label: 'Rejected', tone: 'bg-grey text-ink' },
  'merch.edited': { label: 'Listing edited', tone: 'bg-grey text-ink' },
  'merch.retired': { label: 'Listing retired', tone: 'bg-grey text-ink' },
  'order.shipped': { label: 'Shipped', tone: 'bg-lavender text-ink' },
  'order.delivered': { label: 'Delivered', tone: 'bg-lavender text-ink' },
  'item.edited': { label: 'Launch edited', tone: 'bg-grey text-ink' },
  'item.deleted': { label: 'Launch deleted', tone: 'bg-edge text-canvas' },
  'fundraise.changed': { label: 'Fundraise changed', tone: 'bg-grey text-ink' },
  'comment.deleted': { label: 'Comment removed', tone: 'bg-grey text-ink' },
};

const stamp = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Who did what, and when.
 *
 * Read-only, because the trail is append-only — there is nothing to edit here
 * and no endpoint that would accept it. Names are shown as they were recorded
 * at the time rather than looked up now, so an entry still reads correctly
 * after someone changes their handle or leaves.
 */
export function AdminAudit() {
  const [action, setAction] = useState('');
  const { data: events, isLoading } = useAuditTrail(action, '');

  return (
    <div>
      <p className="mb-5 max-w-xl text-sm leading-relaxed text-muted text-pretty">
        Every privileged action on Deck, newest first. Entries cannot be edited or removed — not
        from here, and not by any other part of the app.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip label="Everything" value="" current={action} onPick={setAction} />
        {AUDIT_ACTIONS.map((value) => (
          <FilterChip
            key={value}
            label={ACTION_STYLE[value].label}
            value={value}
            current={action}
            onPick={setAction}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-16 w-full" />
          ))}
        </div>
      ) : !events?.data.length ? (
        <EmptyState
          title="Nothing recorded yet"
          description={
            action
              ? 'No entries of that kind. Try another filter.'
              : 'Privileged actions will appear here as they happen.'
          }
        />
      ) : (
        <>
          <ul className="space-y-2">
            {events.data.map((event) => (
              <li key={event.id}>
                <Entry event={event} />
              </li>
            ))}
          </ul>
          <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
            Showing {events.data.length} of {events.meta.total}
          </p>
        </>
      )}
    </div>
  );
}

function FilterChip({
  label,
  value,
  current,
  onPick,
}: {
  label: string;
  value: string;
  current: string;
  onPick: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      aria-pressed={current === value}
      className={`border-2 border-edge px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-colors duration-[120ms] ${
        current === value
          ? 'bg-lavender text-ink'
          : 'bg-surface text-muted hover:bg-surface-2 hover:text-body'
      }`}
    >
      {label}
    </button>
  );
}

function Entry({ event }: { event: AuditEvent }) {
  const [open, setOpen] = useState(false);
  const style = ACTION_STYLE[event.action];
  const hasDetail = event.before !== undefined || event.after !== undefined;

  return (
    <article className="rounded-slab border-2 border-edge bg-surface">
      <div className="flex flex-wrap items-start gap-3 p-3">
        <span
          className={`shrink-0 border-2 border-edge px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] ${style.tone}`}
        >
          {style.label}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-pretty">{event.summary}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
            {event.actorName}
            {event.actorEmail ? ` · ${event.actorEmail}` : ''} · {stamp(event.createdAt)}
            {event.ip ? ` · ${event.ip}` : ''}
          </p>
        </div>

        {hasDetail && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="shrink-0 border-2 border-edge px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-muted transition-colors duration-[120ms] hover:bg-surface-2 hover:text-body"
          >
            {open ? 'Hide' : 'Detail'}
          </button>
        )}
      </div>

      {/* The raw snapshot. Ugly on purpose — this is evidence, not a summary,
          and it should be obvious that nothing has been prettied up. */}
      {open && hasDetail && (
        <div className="space-y-2 border-t-2 border-edge px-3 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
            {event.targetType}: {event.targetLabel}
          </p>
          {event.before !== undefined && <Snapshot label="Before" value={event.before} />}
          {event.after !== undefined && <Snapshot label="After" value={event.after} />}
        </div>
      )}
    </article>
  );
}

function Snapshot({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <pre className="mt-1 overflow-x-auto border-2 border-edge bg-surface-2 p-2 font-mono text-[11px]">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
