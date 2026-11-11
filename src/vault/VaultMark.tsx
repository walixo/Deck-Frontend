/**
 * Vault's mark: a card with a keyhole bitten out of it.
 *
 * Drawn with `currentColor` and an even-odd fill, so the keyhole is genuinely
 * transparent rather than a canvas-coloured shape punched over the top — the
 * same discipline as Deck's wordmark, and for the same reason: the mark sits on
 * `pop`, on `surface` and on a dark header, and a hole filled with one page's
 * background is a hole that stops being a hole on the next one.
 */
export function VaultMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      aria-hidden="true"
      className={className}
    >
      {/* The card, with the keyhole as a second subpath. */}
      <path d="M4 7a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Zm12 5.5a3.2 3.2 0 0 0-1.4 6.08L13.6 23h4.8l-1-4.42A3.2 3.2 0 0 0 16 12.5Z" />
      {/* The magnetic stripe, so it reads as a card rather than a box. */}
      <rect x="4" y="8.5" width="24" height="1.6" opacity="0.45" />
    </svg>
  );
}
