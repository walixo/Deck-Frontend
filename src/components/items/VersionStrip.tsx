import { Link } from 'react-router-dom';
import { cn, formatFullDate } from '@/lib/utils';
import type { ItemVersion } from '@/types';

/**
 * Every version of a product, newest first.
 *
 * Renders nothing when a product has launched once, which is most of them — the
 * server sends an empty list in that case rather than a list of one, so there
 * is no "is this really a chain" question to answer here.
 *
 * Each entry keeps its own vote count because each was its own launch day. That
 * is the honest reading: a version that landed 400 votes in March did so on
 * March's board, and rolling the numbers together would flatter a new release
 * with an old one's reception. The combined figure is shown once, separately.
 */
interface VersionStripProps {
  versions: ItemVersion[];
  totals: { voteCount: number; reviewCount: number; ratingAvg: number };
}

export function VersionStrip({ versions, totals }: VersionStripProps) {
  if (versions.length < 2) return null;

  return (
    <section
      aria-labelledby="versions-heading"
      className="rounded-slab border-2 border-edge bg-surface p-5 shadow-hard"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="versions-heading"
          className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
        >
          Versions
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
          <span className="tabular-nums text-body">{totals.voteCount}</span> votes across all
          {totals.reviewCount > 0 && (
            <>
              {' · '}
              <span className="tabular-nums text-body">{totals.ratingAvg.toFixed(1)}</span> from{' '}
              {totals.reviewCount} {totals.reviewCount === 1 ? 'review' : 'reviews'}
            </>
          )}
        </p>
      </div>

      <ol className="mt-3.5 space-y-2">
        {versions.map((version) => {
          const label = version.version ?? 'First launch';

          return (
            <li key={version.slug}>
              {/* The current version is not a link to itself: a row that looks
                  clickable and goes nowhere is worse than a row that does not. */}
              {version.current ? (
                <div className="flex items-center gap-3 border-2 border-accent bg-surface-2 px-3 py-2">
                  <VersionChip label={label} current />
                  <VersionMeta version={version} />
                </div>
              ) : (
                <Link
                  to={`/item/${version.slug}`}
                  className="flex items-center gap-3 border-2 border-edge bg-canvas px-3 py-2 transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm"
                >
                  <VersionChip label={label} />
                  <VersionMeta version={version} />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function VersionChip({ label, current = false }: { label: string; current?: boolean }) {
  return (
    <span
      className={cn(
        'shrink-0 border-2 border-edge px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.04em]',
        current ? 'bg-pop text-on-pop' : 'bg-surface-2 text-body',
      )}
    >
      {label}
    </span>
  );
}

function VersionMeta({ version }: { version: ItemVersion }) {
  return (
    <>
      <span className="min-w-0 flex-1 truncate font-mono text-[11px] uppercase tracking-[0.04em] text-muted">
        {formatFullDate(version.launchDate)}
        {version.current && ' · you are here'}
      </span>
      <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-muted">
        ▲ {version.voteCount}
      </span>
    </>
  );
}
