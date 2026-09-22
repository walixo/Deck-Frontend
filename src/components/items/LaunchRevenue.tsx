import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/States';
import { request, RequestError } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { cn, formatMoney } from '@/lib/utils';
import type { Item, LaunchRevenue as Revenue } from '@/types';

/**
 * How long a figure stays current before the page says otherwise.
 *
 * Ninety days is a quarter, which is roughly how often a small maker looks at
 * their own numbers. Past that the figure is not wrong so much as unsupported,
 * and saying so is the difference between reporting and implying.
 */
const STALE_AFTER_DAYS = 90;

function ageInDays(reportedAt: string | null): number | null {
  if (!reportedAt) return null;
  return Math.floor((Date.now() - new Date(reportedAt).getTime()) / 86_400_000);
}

function asOf(reportedAt: string | null): string {
  if (!reportedAt) return 'date not given';
  return `as of ${new Date(reportedAt).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })}`;
}

/** Short month and year, for the one line the chip can spare. */
function shortAsOf(reportedAt: string | null): string {
  if (!reportedAt) return 'undated';
  return new Date(reportedAt)
    .toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    .toUpperCase();
}

/**
 * The maker's monthly revenue, in the launch's action row.
 *
 * It sits beside the vote button and the visit link because that row is what
 * the page is *about* — the three things a reader wants within a second of
 * arriving are what it is, whether anyone rates it, and whether it makes
 * money. Buried in the sidebar under the view counter, the third one was
 * answered last.
 *
 * It is not a button, and is built not to look like one: no shadow, no hover
 * lift, no pointer. It is the same height as the controls beside it so the row
 * stays level, and that is the only thing it borrows from them.
 *
 * Presented as a claim with a date attached, never as a Deck statistic. Deck
 * has no access to anybody's books, so the label says "self-reported" before
 * the reader gets to the number, and the month it was reported sits on the
 * same line — a revenue figure with no date reads as present tense however old
 * it is.
 *
 * Deliberately not converted to the reader's display currency. `Money` does
 * that for prices, where the base currency is Deck's own and the rate is a
 * genuine convenience. Converting a self-reported figure at today's rate would
 * add a decimal point of precision to a number that does not have one.
 */
export function LaunchRevenueChip({ revenue }: { revenue: Revenue }) {
  const age = ageInDays(revenue.reportedAt);
  const stale = age !== null && age > STALE_AFTER_DAYS;
  const preRevenue = revenue.monthlyMinor === 0;

  /*
   * A stale claim gets no green arrow.
   *
   * Profitability is a statement about now. Eight months after it was last
   * confirmed it is a statement about then, and marking it with a confident
   * green ▲ would be the page vouching for something nobody has checked. The
   * figure still shows, muted, with its date — that is the honest version.
   */
  const showProfit = revenue.profitable && !preRevenue && !stale;

  const description = [
    'Self-reported by the maker',
    revenue.reportedAt ? asOf(revenue.reportedAt) : null,
    showProfit ? 'and reported profitable' : null,
    stale ? `— not updated in over ${STALE_AFTER_DAYS} days` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      title={description}
      className={cn(
        'flex h-11 shrink-0 flex-col justify-center rounded-slab border px-3.5',
        stale ? 'border-edge/60 bg-surface-2/30' : 'border-edge bg-surface-2/60',
      )}
    >
      <span className="font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-muted">
        Self-reported · {shortAsOf(revenue.reportedAt)}
      </span>

      <span
        className={cn(
          'mt-1 flex items-center gap-1.5 font-display text-sm leading-none tabular-nums',
          stale && 'text-muted',
        )}
      >
        {showProfit && (
          /* One of the three status colours, which is the exemption this
             qualifies under — and it carries a word for anyone who cannot see
             the green, per the rule that nothing is colour alone. */
          <span className="text-success" aria-hidden="true">
            ▲
          </span>
        )}
        {preRevenue ? 'Pre-revenue' : formatMoney(revenue.monthlyMinor, revenue.currency)}
        {!preRevenue && <span className="text-muted">/mo</span>}
        <span className="sr-only">{description}</span>
      </span>
    </div>
  );
}

/**
 * The owner's control for publishing, updating or withdrawing the figure.
 *
 * Lives on the launch page rather than in the edit form, because it is not
 * governed by the edit window: the pitch sets after a few hours and stays set,
 * and a revenue figure that could never be corrected after that would be
 * guaranteed to go stale. Updating it is the maintenance this feature needs to
 * be worth having.
 */
export function ReportRevenue({ item }: { item: Item }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [monthly, setMonthly] = useState(
    item.revenue ? String(item.revenue.monthlyMinor / 100) : '',
  );
  const [currency, setCurrency] = useState(item.revenue?.currency ?? 'NGN');
  const [profitable, setProfitable] = useState(item.revenue?.profitable ?? false);
  const [error, setError] = useState<RequestError | null>(null);

  const save = useMutation({
    mutationFn: (payload: {
      disclosed: boolean;
      monthly?: number;
      currency?: string;
      profitable?: boolean;
    }) => request<Item>('patch', `/items/${item.slug}/revenue`, payload),
    onSuccess: async () => {
      setError(null);
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.item(item.slug) });
    },
    onError: (caught) => {
      setError(caught instanceof RequestError ? caught : new RequestError('Could not save', 0));
    },
  });

  if (!open) {
    return (
      <Button variant="secondary" size="sm" className="w-full" onClick={() => setOpen(true)}>
        {item.revenue ? 'Update revenue' : 'Report revenue'}
      </Button>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate({ disclosed: true, monthly: Number(monthly || 0), currency, profitable });
      }}
    >
      {error && <InlineAlert>{error.message}</InlineAlert>}

      <Input
        label="Monthly revenue"
        type="number"
        min="0"
        step="any"
        inputMode="decimal"
        value={monthly}
        onChange={(event) => setMonthly(event.target.value)}
        error={error?.fieldError('monthly')}
        placeholder="0"
        hint="Whole units, not cents. Zero is a real answer — it publishes as “Pre-revenue”."
      />

      <Input
        label="Currency"
        value={currency}
        onChange={(event) => setCurrency(event.target.value.toUpperCase().slice(0, 3))}
        error={error?.fieldError('currency')}
        placeholder="NGN"
        hint="Three-letter code. Shown as you report it — never converted."
      />

      {/* A plain checkbox rather than a Field control, because there is no
          checkbox in the design system yet and inventing one for a single use
          is how design systems end up with three of everything. */}
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={profitable}
          onChange={(event) => setProfitable(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--color-success)]"
        />
        <span className="text-sm leading-snug">
          It covers its costs
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
            Adds a green ▲ beside the figure. Only shown while the figure is under 90 days old —
            profitability is a claim about now.
          </span>
        </span>
      </label>

      <p className="text-xs leading-relaxed text-muted text-pretty">
        This appears publicly on your launch, labelled as self-reported and dated. Your terms of
        service require it to be accurate.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" loading={save.isPending}>
          Publish
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        {item.revenue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => save.mutate({ disclosed: false })}
            className="text-danger"
          >
            Take it down
          </Button>
        )}
      </div>
    </form>
  );
}
