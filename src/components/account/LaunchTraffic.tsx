import { Sparkline } from '@/components/ui/Sparkline';
import { formatDay, formatNumber } from '@/lib/utils';
import type { LaunchViewSeries } from '@/types';

interface LaunchTrafficProps {
  views: LaunchViewSeries;
  /** The shared date axis, so the label can name the window it is describing. */
  days: string[];
}

/**
 * A launch's traffic, attached under its card on the maker's own page.
 *
 * Under the card rather than inside it: `ItemCard` is the same component the
 * whole site uses, and traffic is private to whoever posted the launch. Making
 * the card aware of that would put an owner-only branch into the one component
 * that renders on every public page.
 *
 * Two numbers and a line. The window figure is the one that answers "how is it
 * doing"; the lifetime figure is there so the window cannot be mistaken for
 * the whole story.
 */
export function LaunchTraffic({ views, days }: LaunchTrafficProps) {
  const quiet = views.windowViews === 0;
  const window = `${days.length} days`;

  return (
    <div className="mt-1 flex items-center gap-4 rounded-slab border border-edge bg-surface-2/40 px-3.5 py-2">
      {/* The colour the line inherits. Muted when there is nothing to show, so
          a flat baseline does not read as a real reading at zero. */}
      <div className={quiet ? 'min-w-0 flex-1 text-muted/40' : 'min-w-0 flex-1 text-accent'}>
        <Sparkline
          values={views.series}
          label={
            quiet
              ? `No views of ${views.name} since ${formatDay(days[0])}`
              : `${views.windowViews} views of ${views.name} since ${formatDay(days[0])}`
          }
        />
      </div>

      <dl className="flex shrink-0 items-baseline gap-4 font-sans text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
        <div className="text-right">
          <dt>{window}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-body">
            {formatNumber(views.windowViews)}
          </dd>
        </div>
        <div className="text-right">
          <dt>All time</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-body">
            {formatNumber(views.total)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
