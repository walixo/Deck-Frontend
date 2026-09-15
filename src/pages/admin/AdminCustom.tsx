import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { VerifiedMark } from '@/components/ui/VerifiedMark';
import { useCustomQueue, useReviewDesign } from '@/hooks/useCustom';
import { cn, formatMoney, relativeTime } from '@/lib/utils';
import { PLACEMENT_LABELS, type CustomDesign } from '@/types';

/**
 * The print desk.
 *
 * Every design here ends as a physical object in the post with Deck's return
 * address on it, which makes this the review with the longest tail: a bad
 * approval is not a page somebody can unpublish. So the artwork is shown large
 * on a checkerboard — transparency is the single most common thing wrong with
 * an upload and it is invisible against any solid background.
 */
export function AdminCustom() {
  const { data, isLoading } = useCustomQueue();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="display-tight text-3xl uppercase">Custom prints</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
          Artwork people have sent in to be printed. Approving one clears it to be ordered — check
          it is theirs to print, and that it is not something Deck would rather not post.
        </p>
      </header>

      <section>
        <h2 className="mb-3 border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          {data ? `${data.submitted.length} waiting on a decision` : 'Waiting on a decision'}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((n) => (
              <Skeleton key={n} className="h-64 w-full" />
            ))}
          </div>
        ) : data?.submitted.length ? (
          <ul className="space-y-4">
            {data.submitted.map((design) => (
              <ReviewCard key={design.id} design={design} />
            ))}
          </ul>
        ) : (
          <EmptyState title="Nothing waiting" description="No new artwork has been sent in." />
        )}
      </section>

      {data && data.approved.length > 0 && (
        <Ledger title={`${data.approved.length} approved`} designs={data.approved} />
      )}
      {data && data.rejected.length > 0 && (
        <Ledger title={`${data.rejected.length} turned down`} designs={data.rejected} />
      )}
    </div>
  );
}

function Ledger({ title, designs }: { title: string; designs: CustomDesign[] }) {
  return (
    <section>
      <h2 className="mb-3 border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
        {title}
      </h2>
      <ul className="space-y-2">
        {designs.map((design) => (
          <li
            key={design.id}
            className="flex flex-wrap items-center gap-3 rounded-slab border border-edge bg-surface p-3 shadow-hard-sm"
          >
            <Artwork url={design.artworkUrl} className="size-10" />
            <span className="min-w-0 flex-1 truncate font-display text-[13px] uppercase">
              {design.name}
            </span>
            <span className="shrink-0 font-mono text-[10px] uppercase text-muted">
              {design.reference} · {design.product}
            </span>
            <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums">
              {formatMoney(design.priceMinor, design.currency)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The artwork on a checkerboard.
 *
 * Transparency is the thing most often wrong with an upload, and a PNG with a
 * white background looks identical to a transparent one on a white card. The
 * board makes the difference obvious at a glance, which is the whole reason
 * design tools use one.
 */
function Artwork({ url, className }: { url: string; className?: string }) {
  return (
    <span
      className={cn('shrink-0 border border-edge bg-white', className)}
      style={{
        backgroundImage:
          'linear-gradient(45deg,#d8d8d8 25%,transparent 25%),linear-gradient(-45deg,#d8d8d8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d8d8d8 75%),linear-gradient(-45deg,transparent 75%,#d8d8d8 75%)',
        backgroundSize: '12px 12px',
        backgroundPosition: '0 0,0 6px,6px -6px,-6px 0',
      }}
    >
      <img src={url} alt="" className="size-full object-contain" />
    </span>
  );
}

function ReviewCard({ design }: { design: CustomDesign }) {
  const review = useReviewDesign();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const decide = async (approve: boolean) => {
    setError(null);
    if (note.trim().length < 4) {
      setError('Say why — the person who uploaded it sees this.');
      return;
    }

    try {
      await review.mutateAsync({ reference: design.reference, approve, note: note.trim() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  return (
    <li>
      <Card className="p-5">
        <div className="flex flex-wrap gap-5">
          <Artwork url={design.artworkUrl} className="size-40" />

          <div className="min-w-0 flex-1">
            <p className="font-display text-lg uppercase">{design.name}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase text-muted">
              {design.owner && <Avatar user={design.owner} size="sm" />}
              <span>{design.owner?.name}</span>
              {design.owner?.verified && <VerifiedMark name={design.owner.name} />}
              <span aria-hidden="true">/</span>
              <span>
                {design.reference} · {relativeTime(design.createdAt)}
              </span>
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-[0.06em] sm:grid-cols-4">
              <Fact label="Product" value={design.product} />
              <Fact label="Colour" value={design.garment} />
              <Fact
                label="Placement"
                value={PLACEMENT_LABELS[design.placement] ?? design.placement}
              />
              <Fact label="Size" value={design.size ?? '—'} />
              <Fact
                label="Artwork"
                value={`${design.analysis.width}×${design.analysis.height}`}
              />
              <Fact label="Prints to" value={`${design.analysis.maxInchesAtGoodDpi}"`} />
              <Fact
                label="Background"
                value={design.analysis.transparent ? 'Transparent' : 'Solid'}
              />
              <Fact
                label="Coverage"
                value={`${Math.round(design.analysis.inkCoverage * 100)}%`}
              />
            </dl>

            {design.analysis.warnings.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {design.analysis.warnings.map((warning) => (
                  <li
                    key={warning}
                    className="border border-edge bg-warning px-2.5 py-1.5 text-xs leading-relaxed text-ink text-pretty"
                  >
                    {warning}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="shrink-0 self-start border border-edge bg-pop px-2.5 py-1 font-display text-sm text-on-pop">
            {formatMoney(design.priceMinor, design.currency)}
          </p>
        </div>

        <div className="mt-5 space-y-3 border-t border-edge pt-4">
          <label className="block">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
              Note to them
            </span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={300}
              placeholder="Clean file, good to print"
              className="mt-1 h-10 w-full border border-edge bg-surface px-3 text-sm placeholder:text-muted/70 focus:border-accent focus:outline-none"
            />
          </label>

          {error && (
            <p role="alert" className="font-mono text-[11px] font-bold uppercase text-red">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={review.isPending} onClick={() => void decide(true)}>
              Approve for print
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={review.isPending}
              onClick={() => void decide(false)}
            >
              Turn down
            </Button>
          </div>
        </div>
      </Card>
    </li>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-edge bg-surface-2 px-2.5 py-1.5">
      <dd className="truncate font-display text-xs">{value}</dd>
      <dt className="mt-0.5 text-[9px] font-bold text-muted">{label}</dt>
    </div>
  );
}
