import { Link } from 'react-router-dom';

/** Wordmark plus a stacked-cards mark that fans out on hover. */
export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className="group flex items-center gap-2.5" aria-label="Deck — home">
      <span className="relative flex size-9 items-center justify-center" aria-hidden="true">
        <span className="absolute size-8 -rotate-6 border-2 border-edge bg-coral transition-transform duration-[160ms] ease-[var(--ease-snap)] group-hover:-rotate-[18deg]" />
        <span className="absolute size-8 rotate-3 border-2 border-edge bg-acid transition-transform duration-[160ms] ease-[var(--ease-snap)] group-hover:rotate-[14deg]" />
        <span className="relative flex size-8 items-center justify-center border-2 border-edge bg-cobalt font-display text-sm text-white">
          D
        </span>
      </span>
      <span className="font-display text-xl uppercase tracking-tight">Deck</span>
    </Link>
  );
}
