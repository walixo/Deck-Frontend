import { useCurrency } from '@/hooks/useCurrency';
import { cn, formatMoney } from '@/lib/utils';

interface MoneyProps {
  /** Minor units in Deck's settlement currency. Never a converted figure. */
  minor: number;
  className?: string;
  /** Class for the approximate second figure, when there is one. */
  approxClassName?: string;
  /**
   * Set on any surface where the reader is about to be charged.
   *
   * Checkout, the payment summary, an order receipt: these show naira and
   * nothing else. A buyer who reads "$12" and is billed ₦18,500 at their own
   * bank's rate will call it a bait and switch, and they will be right — the
   * conversion is a browsing aid and has no business on the last screen.
   */
  exact?: boolean;
}

/**
 * A price: the real figure, and optionally what it is worth where you are.
 *
 * The naira never disappears. It is first, it is the one set in the heavier
 * weight, and the converted figure is marked with a `~` and set quieter — so
 * there is never a moment where the number a reader remembers is not the number
 * Deck will charge.
 *
 * Renders naira alone when the reader's display currency *is* naira, when the
 * rate table has not loaded, or when there is no usable rate. All three degrade
 * to "correct but less helpful", which is the right direction for money.
 */
export function Money({ minor, className, approxClassName, exact = false }: MoneyProps) {
  const { base, display, convert } = useCurrency();

  const converted = exact ? null : convert(minor);

  return (
    <span className={className}>
      <span className="tabular-nums">{formatMoney(minor, base)}</span>
      {converted !== null && (
        <>
          {' '}
          <span
            className={cn('whitespace-nowrap tabular-nums text-muted', approxClassName)}
            /* The tilde is inside the title too: a screen reader announcing
               "18,500 naira 12 dollars" without it would read as two prices. */
            title={`Approximately ${formatMoney(converted, display)} at today's rate`}
          >
            ≈ {formatMoney(converted, display)}
          </span>
        </>
      )}
    </span>
  );
}

/**
 * The display-currency picker.
 *
 * A native `<select>`, and in the footer rather than the header. It changes how
 * numbers read, not what anything costs — putting it beside the cart would
 * imply a choice about the transaction, which it is not.
 */
export function CurrencyPicker({ className }: { className?: string }) {
  const { display, base, setDisplay, table } = useCurrency();

  /* Nothing to choose from until the table arrives, and no point offering a
     picker with one entry if the server could not produce rates at all. */
  const options = table?.currencies ?? [];
  if (options.length < 2) return null;

  return (
    <label className={cn('flex items-center gap-2', className)}>
      <span className="font-mono text-[11px] uppercase text-muted">Show prices in</span>
      <select
        value={display}
        onChange={(event) => setDisplay(event.target.value)}
        className="select-chevron border border-edge bg-surface py-1 pl-2 pr-7 font-mono text-[11px] font-bold uppercase tracking-[0.06em] focus:border-accent focus:outline-none"
      >
        {options.map((code) => (
          <option key={code} value={code}>
            {code}
            {code === base ? ' (charged)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
