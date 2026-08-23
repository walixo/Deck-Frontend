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
  /* Approving a raise is the one approval that lets somebody collect money
     from strangers, so it is weighted with the access changes, not with the
     routine yes/no of a listing. */
  'fundraise.approved': { label: 'Fundraise approved', tone: 'bg-edge text-canvas' },
  'fundraise.rejected': { label: 'Fundraise rejected', tone: 'bg-grey text-ink' },
  'fundraise.changed': { label: 'Fundraise changed', tone: 'bg-grey text-ink' },
  'futuregen.added': { label: 'Future Gen added', tone: 'bg-deep text-on-deep' },
  'futuregen.removed': { label: 'Future Gen removed', tone: 'bg-grey text-ink' },
  'user.verified': { label: 'Verified', tone: 'bg-deep text-on-deep' },
  'user.unverified': { label: 'Verification removed', tone: 'bg-grey text-ink' },
  'merch.approved': { label: 'Approved', tone: 'bg-deep text-on-deep' },
  'merch.rejected': { label: 'Rejected', tone: 'bg-grey text-ink' },
  'merch.edited': { label: 'Listing edited', tone: 'bg-grey text-ink' },
  'merch.retired': { label: 'Listing retired', tone: 'bg-grey text-ink' },
  'ad.approved': { label: 'Ad approved', tone: 'bg-deep text-on-deep' },
  'ad.rejected': { label: 'Ad rejected', tone: 'bg-grey text-ink' },
  'order.shipped': { label: 'Shipped', tone: 'bg-pop text-on-pop' },
  'order.delivered': { label: 'Delivered', tone: 'bg-pop text-on-pop' },
  'item.edited': { label: 'Launch edited', tone: 'bg-grey text-ink' },
  'item.deleted': { label: 'Launch deleted', tone: 'bg-edge text-canvas' },
  /* Moving a launch to another board day changes who it competes with, which
     is why it is staff-only and why it is here at all. */
  'item.rescheduled': { label: 'Launch rescheduled', tone: 'bg-grey text-ink' },
  'category.created': { label: 'Category added', tone: 'bg-grey text-ink' },
  'category.updated': { label: 'Category edited', tone: 'bg-grey text-ink' },
  'category.removed': { label: 'Category removed', tone: 'bg-edge text-canvas' },
  'post.created': { label: 'Post written', tone: 'bg-grey text-ink' },
  'post.published': { label: 'Post published', tone: 'bg-deep text-on-deep' },
  'post.unpublished': { label: 'Post pulled', tone: 'bg-grey text-ink' },
  'post.deleted': { label: 'Post deleted', tone: 'bg-edge text-canvas' },
  'comment.deleted': { label: 'Comment removed', tone: 'bg-grey text-ink' },
  'topic.edited': { label: 'Topic edited', tone: 'bg-grey text-ink' },
  'topic.deleted': { label: 'Topic deleted', tone: 'bg-edge text-canvas' },
  'topic.moderated': { label: 'Topic pinned/locked', tone: 'bg-grey text-ink' },
  'reply.deleted': { label: 'Reply removed', tone: 'bg-grey text-ink' },
};

/*
 * The lookup, made total.
 *
 * Reading the trail must never be able to fail. An audit log's whole job is to
 * still be readable on the day something has gone wrong, and an older build of
 * this page reaching a newer server is exactly that day — the previous version
 * indexed this table directly and blanked the entire admin route the first time
 * the server recorded an action it had not been taught. An entry Deck cannot
 * name is still evidence, so it renders with its raw action string rather than
 * taking the page down.
 */
function describe(action: string): { label: string; tone: string } {
  return (
    ACTION_STYLE[action as AuditAction] ?? {
      label: action.replace(/[._]/g, ' '),
      tone: 'bg-surface-2 text-body',
    }
  );
}

/*
 * Filter chips, banded by the noun in front of the dot.
 *
 * Derived from AUDIT_ACTIONS rather than listed again, so adding an action on
 * both sides is enough to make it filterable — there is no third place to
 * forget. An action whose prefix is not named below falls into "Other", which
 * means a new prefix shows up rather than silently having no chip.
 */
const GROUP_NAMES: Record<string, string> = {
  role: 'Access',
  user: 'Access',
  item: 'Launches',
  category: 'Launches',
  comment: 'Launches',
  fundraise: 'Money',
  payout: 'Money',
  futuregen: 'Launches',
  order: 'Shop',
  merch: 'Shop',
  post: 'Content',
  ad: 'Content',
  topic: 'Forum',
  reply: 'Forum',
};

const FILTER_GROUPS = (() => {
  const groups = new Map<string, AuditAction[]>();
  for (const value of AUDIT_ACTIONS) {
    const name = GROUP_NAMES[value.split('.')[0]] ?? 'Other';
    groups.set(name, [...(groups.get(name) ?? []), value]);
  }
  return [...groups].map(([label, actions]) => ({ label, actions }));
})();

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

      {/* Grouped by what was acted on rather than run as one row. Twenty-seven
          chips in a single wrap is a wall you read left to right hunting for a
          word; in banded rows you pick the noun first and the verb second. */}
      <div className="mb-6 space-y-2">
        <FilterChip label="Everything" value="" current={action} onPick={setAction} />

        {FILTER_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-wrap items-center gap-2">
            <span className="w-16 shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
              {group.label}
            </span>
            {group.actions.map((value) => (
              <FilterChip
                key={value}
                label={describe(value).label}
                value={value}
                current={action}
                onPick={setAction}
              />
            ))}
          </div>
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
          ? 'bg-pop text-on-pop'
          : 'bg-surface text-muted hover:bg-surface-2 hover:text-body'
      }`}
    >
      {label}
    </button>
  );
}

function Entry({ event }: { event: AuditEvent }) {
  const [open, setOpen] = useState(false);
  const style = describe(event.action);
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
