import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

/**
 * Where a game purchase's checkout window lands.
 *
 * The player opened checkout in a second window so the game never unloads.
 * When Bachs sends that window back to Deck, the return page confirms the
 * payment and forwards here; this tells the game's tab — same origin, so the
 * message cannot be read or forged by anyone else — and closes itself. If it
 * was opened as a plain tab (some phones do that with popups) and cannot
 * close, it says so and links back to the game.
 */
export function PurchaseComplete() {
  const [params] = useSearchParams();
  const reference = params.get('reference') ?? '';
  const outcome = params.get('payment') ?? 'pending';
  const game = params.get('game');
  /* Whether the game's tab is there to hear back — known on arrival. */
  const [told] = useState(() => {
    const opener = window.opener as Window | null;
    return Boolean(opener && !opener.closed);
  });

  useEffect(() => {
    const opener = window.opener as Window | null;
    if (!told || !opener) return;
    opener.postMessage(
      { type: 'deck:purchase-return', reference, outcome },
      window.location.origin,
    );
    const timer = window.setTimeout(() => window.close(), 900);
    return () => window.clearTimeout(timer);
  }, [outcome, reference, told]);

  const headline =
    outcome === 'cancelled'
      ? 'No charge was made'
      : outcome === 'confirmed'
        ? 'Purchase complete'
        : 'Payment received';

  return (
    <div className="grid min-h-[80svh] place-items-center px-6 pt-14 text-center">
      <div className="max-w-sm">
        <span
          aria-hidden="true"
          className="mx-auto block size-3 rounded-full bg-g-glow shadow-[0_0_30px_8px] shadow-g-glow/60"
        />
        <h1 className="mt-8 text-4xl font-medium tracking-[-0.05em]">{headline}</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-g-mute">
          {told
            ? 'Taking you back to your game…'
            : outcome === 'cancelled'
              ? 'You left checkout before paying.'
              : outcome === 'confirmed'
                ? 'It’s yours. Head back to the game to use it.'
                : 'It will reach your game as soon as the payment provider confirms it, usually within a minute.'}
        </p>
        {!told && game && (
          <Link
            to={`/games/${game}`}
            className="glass-primary mt-8 inline-block rounded-xl px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
          >
            Back to the game
          </Link>
        )}
        {reference && (
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-g-mute">
            {reference}
          </p>
        )}
      </div>
    </div>
  );
}
