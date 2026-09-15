import { ButtonLink } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { useMyDesigns } from '@/hooks/useCustom';
import { cn, formatMoney, relativeTime } from '@/lib/utils';
import type { CustomDesign } from '@/types';

/** Artwork you have sent to be printed, and where each one stands. */
export function AccountPrints() {
  const { data: designs, isLoading } = useMyDesigns();

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-tight text-3xl uppercase">Custom prints</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
            Deck checks every design before it goes to print. Nothing is charged until it is
            approved.
          </p>
        </div>
        <ButtonLink to="/customise">New design</ButtonLink>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((n) => (
            <Skeleton key={n} className="h-16 w-full" />
          ))}
        </div>
      ) : designs?.length ? (
        <ul className="space-y-2">
          {designs.map((design) => (
            <Row key={design.id} design={design} />
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No designs yet"
          description="Send us a PNG and we will put it on a sticker, a tee or a hoodie."
          action={<ButtonLink to="/customise">Print your own</ButtonLink>}
        />
      )}
    </div>
  );
}

function Row({ design }: { design: CustomDesign }) {
  const tone =
    design.status === 'approved'
      ? 'bg-success text-ink'
      : design.status === 'rejected'
        ? 'bg-edge text-canvas'
        : 'bg-surface-2 text-muted';

  return (
    <li className="rounded-slab border border-edge bg-surface p-3 shadow-hard-sm">
      <div className="flex flex-wrap items-center gap-3">
        <img
          src={design.artworkUrl}
          alt=""
          className="size-10 shrink-0 border border-edge bg-bone object-contain p-0.5"
        />
        <span className="min-w-0 flex-1 truncate font-display text-[13px] uppercase">
          {design.name}
        </span>
        <span className="shrink-0 font-mono text-[10px] uppercase text-muted">
          {design.reference} · {design.product} · {relativeTime(design.createdAt)}
        </span>
        <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums">
          {formatMoney(design.priceMinor, design.currency)}
        </span>
        <span
          className={cn(
            'shrink-0 border border-edge px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.06em]',
            tone,
          )}
        >
          {design.status === 'submitted' ? 'In review' : design.status}
        </span>
      </div>

      {/* Deck's note on a rejection is the only thing that tells somebody what
          to change, so it is shown rather than left in the API. */}
      {design.status === 'rejected' && design.reviewNote && (
        <p className="mt-2 border-l border-edge pl-2 text-xs leading-relaxed text-muted text-pretty">
          {design.reviewNote}
        </p>
      )}
    </li>
  );
}
