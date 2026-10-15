import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InlineAlert } from '@/components/ui/States';

/**
 * The one line a person sees after coming back from hosted checkout.
 *
 * The return page has already asked the server, and says what it learned in
 * the query string: `payment=confirmed`, `payment=pending` (paid, but the
 * provider has not told us yet — the webhook or the sweep will settle it), or
 * `payment=cancelled`. Pages render this where the thing that was paid for
 * lives, and it scrolls itself into view because React Router does not scroll
 * to hashes.
 *
 * Dismissing strips the flag, so a refresh or a shared link does not thank
 * someone twice.
 */
export function PaymentOutcome({
  confirmed,
  pending,
  cancelled,
}: {
  confirmed: string;
  pending: string;
  cancelled: string;
}) {
  const [params, setParams] = useSearchParams();
  const outcome = params.get('payment');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outcome) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [outcome]);

  if (outcome !== 'confirmed' && outcome !== 'pending' && outcome !== 'cancelled') return null;

  const dismiss = () => {
    const next = new URLSearchParams(params);
    next.delete('payment');
    setParams(next, { replace: true });
  };

  const message = outcome === 'confirmed' ? confirmed : outcome === 'pending' ? pending : cancelled;

  return (
    <div ref={ref} className="mb-4 scroll-mt-24">
      <InlineAlert tone={outcome === 'cancelled' ? 'error' : 'success'}>
        <span className="flex items-start justify-between gap-3">
          <span>{message}</span>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 font-mono text-[11px] font-bold uppercase underline-offset-4 hover:underline"
          >
            Dismiss
          </button>
        </span>
      </InlineAlert>
    </div>
  );
}
