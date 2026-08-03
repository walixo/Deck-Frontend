/**
 * Scene illustrations for empty states, errors and decorative panels.
 *
 * House style: thin geometric line art on a soft gradient plate, with one or two
 * filled brand-green accents to carry the eye. Everything is inline SVG using
 * currentColor plus explicit brand tokens, so the art themes with the page and
 * ships with the bundle — no image requests, no separate asset pipeline.
 */

interface IllustrationProps {
  className?: string;
}

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Shared soft plate behind each scene. */
function Plate({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-plate`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="var(--color-brand-400)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-brand-600)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-accent`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-400)" />
          <stop offset="100%" stopColor="var(--color-brand-600)" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="62" r="58" fill={`url(#${id}-plate)`} />
    </>
  );
}

/** Nothing launched yet — an empty deck of cards with one waiting to be placed. */
export function EmptyDeckIllustration({ className = 'size-40' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 130" aria-hidden="true" className={className}>
      <Plate id="deck" />
      <g className="text-zinc-400 dark:text-zinc-600" {...STROKE}>
        <rect x="30" y="52" width="62" height="46" rx="6" />
        <rect x="42" y="44" width="62" height="46" rx="6" />
        <path d="M56 74h30M56 82h18" strokeDasharray="3 5" />
      </g>
      <g {...STROKE} stroke="url(#deck-accent)" strokeWidth="1.8">
        <rect x="86" y="26" width="46" height="34" rx="5" transform="rotate(9 109 43)" />
      </g>
      <path
        d="M104 38v10M99 43h10"
        stroke="url(#deck-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        transform="rotate(9 104 43)"
      />
    </svg>
  );
}

/** No search results — a magnifier over a grid with one square missing. */
export function NoResultsIllustration({ className = 'size-40' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 130" aria-hidden="true" className={className}>
      <Plate id="results" />
      <g className="text-zinc-400 dark:text-zinc-600" {...STROKE}>
        <rect x="28" y="30" width="26" height="26" rx="4" />
        <rect x="62" y="30" width="26" height="26" rx="4" />
        <rect x="28" y="64" width="26" height="26" rx="4" />
        <rect x="62" y="64" width="26" height="26" rx="4" strokeDasharray="4 5" />
      </g>
      <g {...STROKE} stroke="url(#results-accent)" strokeWidth="2.2">
        <circle cx="104" cy="58" r="20" />
        <path d="M118 73 131 87" />
      </g>
    </svg>
  );
}

/** No comments yet — two speech bubbles, one still empty. */
export function EmptyCommentsIllustration({ className = 'size-40' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 130" aria-hidden="true" className={className}>
      <Plate id="comments" />
      <g className="text-zinc-400 dark:text-zinc-600" {...STROKE}>
        <path d="M30 40h58a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H52l-14 11V78h-8a6 6 0 0 1-6-6V46a6 6 0 0 1 6-6Z" />
        <path d="M42 54h34M42 63h20" strokeDasharray="3 5" />
      </g>
      <g {...STROKE} stroke="url(#comments-accent)" strokeWidth="1.8">
        <path d="M104 30h26a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6h-4v9l-11-9h-11a6 6 0 0 1-6-6V36a6 6 0 0 1 6-6Z" />
      </g>
      <circle cx="112" cy="45" r="2" fill="url(#comments-accent)" />
      <circle cx="120" cy="45" r="2" fill="url(#comments-accent)" />
      <circle cx="128" cy="45" r="2" fill="url(#comments-accent)" />
    </svg>
  );
}

/** Quiet day on the leaderboard — an empty podium. */
export function EmptyBoardIllustration({ className = 'size-40' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 130" aria-hidden="true" className={className}>
      <Plate id="board" />
      <g className="text-zinc-400 dark:text-zinc-600" {...STROKE}>
        <rect x="26" y="70" width="32" height="30" rx="3" />
        <rect x="100" y="78" width="32" height="22" rx="3" />
        <path d="M26 100h106" />
      </g>
      <g {...STROKE} stroke="url(#board-accent)" strokeWidth="2">
        <rect x="62" y="52" width="34" height="48" rx="3" />
        <path d="M79 34v10" />
        <circle cx="79" cy="26" r="8" />
      </g>
    </svg>
  );
}

/** 404 — a card that drifted off the deck. */
export function LostCardIllustration({ className = 'size-56' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 150" aria-hidden="true" className={className}>
      <defs>
        <radialGradient id="lost-plate" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="var(--color-brand-400)" stopOpacity="0.26" />
          <stop offset="100%" stopColor="var(--color-brand-600)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lost-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-400)" />
          <stop offset="100%" stopColor="var(--color-brand-600)" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="72" rx="78" ry="64" fill="url(#lost-plate)" />

      <g className="text-zinc-400 dark:text-zinc-600" {...STROKE}>
        <rect x="34" y="66" width="62" height="46" rx="6" />
        <rect x="46" y="58" width="62" height="46" rx="6" />
        <path d="M60 84h30M60 92h16" strokeDasharray="3 5" />
      </g>

      {/* The stray card, tumbling away with a motion arc. */}
      <g transform="rotate(-22 146 46)">
        <rect
          x="118"
          y="24"
          width="56"
          height="42"
          rx="6"
          {...STROKE}
          stroke="url(#lost-accent)"
          strokeWidth="1.8"
        />
        <path d="M130 40h22M130 50h14" stroke="url(#lost-accent)" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <path
        d="M108 62c10-14 22-24 34-28"
        {...STROKE}
        stroke="url(#lost-accent)"
        strokeDasharray="2 6"
        strokeWidth="1.6"
      />
    </svg>
  );
}

/**
 * Decorative panel for the auth pages: a stylised launch board with a rising
 * vote bar, echoing what the product actually does.
 */
export function LaunchBoardIllustration({ className = 'w-full' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="board-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--color-brand-600)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--color-brand-400)" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="board-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-brand-400)" />
          <stop offset="100%" stopColor="var(--color-brand-600)" />
        </linearGradient>
      </defs>

      {/* Rows, standing in for launches on a board. */}
      <g className="text-zinc-300 dark:text-zinc-700" {...STROKE}>
        {[0, 1, 2].map((row) => (
          <g key={row} transform={`translate(0 ${row * 44})`}>
            <rect x="18" y="34" width="200" height="34" rx="6" />
            <rect x="28" y="42" width="18" height="18" rx="4" />
            <path d="M56 48h84M56 57h52" strokeDasharray="3 5" />
            <rect x="188" y="41" width="20" height="20" rx="4" />
          </g>
        ))}
      </g>

      {/* Vote trend climbing out of the board. */}
      <g>
        {[
          { x: 238, h: 26 },
          { x: 258, h: 44 },
          { x: 278, h: 68 },
          { x: 298, h: 96 },
        ].map((bar) => (
          <rect
            key={bar.x}
            x={bar.x}
            y={168 - bar.h}
            width="12"
            height={bar.h}
            rx="3"
            fill="url(#board-bar)"
          />
        ))}
        <path
          d="M244 142 264 124 284 100 304 72"
          fill="none"
          stroke="url(#board-line)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M296 72h8v8" fill="none" stroke="url(#board-line)" strokeWidth="2" strokeLinecap="round" />
      </g>
      <path d="M18 172h294" {...STROKE} className="text-zinc-300 dark:text-zinc-700" />
    </svg>
  );
}

/** Small upward-trend mark used beside "how ranking works" copy. */
export function TrendMark({ className = 'size-10' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="trend-accent" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-brand-500)" />
          <stop offset="100%" stopColor="var(--color-brand-300)" />
        </linearGradient>
      </defs>
      <path
        d="M6 28 15 19l6 5 11-12"
        fill="none"
        stroke="url(#trend-accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M25 12h7v7" fill="none" stroke="url(#trend-accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
