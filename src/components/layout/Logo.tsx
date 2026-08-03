import { Link } from 'react-router-dom';

/** Wordmark plus a small stacked-cards mark that nods to the name. */
export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-lg"
      aria-label="Deck — home"
    >
      <span className="relative flex size-8 items-center justify-center" aria-hidden="true">
        <span className="absolute size-7 rotate-[-8deg] rounded-lg border border-zinc-300 bg-white transition-transform duration-300 group-hover:rotate-[-14deg] dark:border-zinc-700 dark:bg-zinc-900" />
        <span className="absolute size-7 rotate-[6deg] rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 transition-transform duration-300 group-hover:rotate-[12deg]" />
        <span className="relative flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-[11px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
          D
        </span>
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">Deck</span>
    </Link>
  );
}
