import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRevisions } from '@/hooks/useItems';
import { cn, relativeTime } from '@/lib/utils';
import type { Revision, RevisionField, RevisionSnapshot } from '@/types';

/** Reader-facing names. The wire uses field keys; nobody wants to read `coverUrl`. */
const FIELD_LABELS: Record<RevisionField, string> = {
  name: 'Name',
  tagline: 'Tagline',
  description: 'Description',
  category: 'Category',
  pricing: 'Pricing',
  websiteUrl: 'Website',
  repoUrl: 'Repository',
  logoUrl: 'Logo',
  coverUrl: 'Cover image',
  wallColour: 'Wall colour',
  videoUrl: 'Video',
  gallery: 'Gallery',
  tags: 'Tags',
  makers: 'Makers',
};

/**
 * Fields worth showing the old and new text for.
 *
 * The rest — images, arrays, URLs — are announced but not quoted. A diff of two
 * upload paths tells a reader nothing they can act on, and a gallery reordering
 * rendered as two lists of URLs is noise dressed as detail.
 */
const QUOTED: RevisionField[] = ['name', 'tagline', 'description', 'category', 'pricing'];

function textOf(snapshot: RevisionSnapshot, field: RevisionField): string {
  const value = snapshot[field];
  if (Array.isArray(value)) return value.join(', ');
  return value ?? '';
}

/**
 * The edit history of a launch.
 *
 * Shut by default and fetched only once opened: most readers do not care, and
 * the ones who do are asking a specific question — has this pitch changed since
 * the votes came in? Rendering it closed keeps that question one click away
 * without spending a request on everyone who never asks it.
 *
 * Renders nothing at all when a launch has never been edited. A history of one
 * entry is not a history, and an empty disclosure invites a click that leads
 * nowhere.
 */
export function RevisionHistory({ slug, editCount }: { slug: string; editCount: number }) {
  const [open, setOpen] = useState(false);
  const { data: revisions, isLoading } = useRevisions(slug, open);

  /* A launch nobody has edited has no history to offer, and the count comes
     from the item payload — so this decision costs no request. Deciding it from
     the fetched list instead would mean the disclosure vanished on click. */
  if (editCount < 1) return null;

  return (
    <details
      className="group rounded-slab border-2 border-edge bg-surface shadow-hard"
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-3 p-4',
          '[&::-webkit-details-marker]:hidden',
          'focus-visible:outline-3 focus-visible:outline-offset-2',
        )}
      >
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          Edit history
        </span>
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
          <span className="tabular-nums text-body">{editCount}</span>{' '}
          {editCount === 1 ? 'edit' : 'edits'}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="ml-auto size-4 shrink-0 transition-transform duration-[160ms] ease-[var(--ease-snap)] group-open:rotate-180"
        />
      </summary>

      <div className="border-t-2 border-edge p-4">
        {isLoading && <Skeleton className="h-24 w-full" />}

        {revisions && (
          <ol className="space-y-3">
            {revisions.map((revision, index) => (
              <RevisionRow
                key={revision.id}
                revision={revision}
                /* The array is newest-first, so the entry that came before this
                   one is the next index along. Undefined for the original. */
                previous={revisions[index + 1]}
              />
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}

function RevisionRow({ revision, previous }: { revision: Revision; previous?: Revision }) {
  const original = !previous;

  return (
    <li className="border-2 border-edge bg-canvas p-3.5">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="border-2 border-edge bg-pop px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-on-pop">
          v{revision.version}
        </span>
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
          {original ? 'As posted' : 'Edited'}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
          by {revision.editedByName}
          {/* Worth flagging: an edit by someone other than the maker is a
              different kind of event, even when it was a legitimate one. */}
          {revision.role === 'admin' && ' · staff'}
          {' · '}
          {relativeTime(revision.createdAt)}
        </span>
      </div>

      {revision.note && (
        <p className="mt-2 text-xs leading-relaxed text-muted text-pretty">“{revision.note}”</p>
      )}

      {!original && revision.changed.length > 0 && (
        <ul className="mt-2.5 space-y-2">
          {revision.changed.map((field) => (
            <li key={field}>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                {FIELD_LABELS[field] ?? field}
              </p>
              {QUOTED.includes(field) ? (
                <div className="mt-1 space-y-1 text-xs leading-relaxed">
                  {/* Removed and added are marked by a leading glyph and a
                      border, never by colour alone — the palette expresses
                      "wrong" by inversion and has no red or green to spend. */}
                  <p className="border-l-2 border-grey pl-2 text-muted line-through">
                    {textOf(previous.snapshot, field) || '—'}
                  </p>
                  <p className="border-l-2 border-accent pl-2 text-body">
                    {textOf(revision.snapshot, field) || '—'}
                  </p>
                </div>
              ) : (
                <p className="mt-0.5 text-xs text-muted">Changed</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
