/**
 * Scene illustrations for empty states, errors and decorative panels.
 *
 * House style: chunky flat vector — thick ink outlines, two or three solid
 * fills from the brand palette, zero gradients and zero shading. Each carries
 * one small looping animation so the page has a pulse without being busy;
 * all of it stops under `prefers-reduced-motion` via the global rule.
 *
 * `--edge` is the themed ink colour, so outlines invert with the theme exactly
 * like every border in the app.
 */

interface IllustrationProps {
  className?: string;
}

const EDGE = 'var(--edge)';
const SURFACE = 'var(--surface)';
const GREY = 'var(--color-grey)';
const OUTLINE = { stroke: EDGE, strokeWidth: 2.5, strokeLinejoin: 'round' as const };

/** Nothing launched yet — an empty deck with one card stamping into place. */
export function EmptyDeckIllustration({ className = 'size-36' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 150 116" aria-hidden="true" className={className}>
      <rect x="14" y="46" width="76" height="54" fill={SURFACE} {...OUTLINE} />
      <rect x="26" y="34" width="76" height="54" fill={SURFACE} {...OUTLINE} />

      <g className="animate-[var(--animate-kick)]">
        <rect x="40" y="18" width="76" height="54" fill="var(--color-acid)" {...OUTLINE} />
        <rect x="52" y="34" width="38" height="6" fill={EDGE} />
        <rect x="52" y="48" width="22" height="6" fill={EDGE} />
      </g>

      <g className="animate-[var(--animate-jitter)]">
        <rect x="118" y="60" width="26" height="34" fill="var(--color-lavender)" {...OUTLINE} />
        <path d="M131 68l8 11h-16z" fill="#fff" />
      </g>
    </svg>
  );
}

/** No search results — a grid with one square missing, magnifier hunting. */
export function NoResultsIllustration({ className = 'size-36' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 150 116" aria-hidden="true" className={className}>
      <rect x="12" y="20" width="30" height="30" fill={SURFACE} {...OUTLINE} />
      <rect x="50" y="20" width="30" height="30" fill="var(--color-acid)" {...OUTLINE} />
      <rect x="12" y="58" width="30" height="30" fill={GREY} {...OUTLINE} />
      <rect
        x="50"
        y="58"
        width="30"
        height="30"
        fill="none"
        stroke={EDGE}
        strokeWidth="2.5"
        strokeDasharray="7 6"
      />

      <g className="animate-[var(--animate-jitter)]">
        <circle cx="106" cy="50" r="24" fill={SURFACE} {...OUTLINE} />
        <circle cx="106" cy="50" r="12" fill="var(--color-lavender)" />
        <path d="M124 68l16 18" stroke={EDGE} strokeWidth="7" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** No comments yet — two speech blocks, the live one blinking a cursor. */
export function EmptyCommentsIllustration({ className = 'size-32' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 150 116" aria-hidden="true" className={className}>
      <path d="M12 26h74v46H46L30 88V72H12V26z" fill={SURFACE} {...OUTLINE} />
      <rect x="26" y="40" width="44" height="6" fill={EDGE} />
      <rect x="26" y="53" width="26" height="6" fill={EDGE} />

      <g className="animate-[var(--animate-kick)]">
        <path d="M92 14h46v40h-8v14l-14-14H92V14z" fill="var(--color-acid)" {...OUTLINE} />
        <rect x="102" y="28" width="6" height="6" fill={EDGE} />
        <rect x="112" y="28" width="6" height="6" fill={EDGE} />
        <rect
          className="animate-[var(--animate-blink)]"
          x="122"
          y="28"
          width="6"
          height="6"
          fill={EDGE}
        />
      </g>
    </svg>
  );
}

/** Quiet day on the board — an empty podium waiting for a winner. */
export function EmptyBoardIllustration({ className = 'size-36' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 150 116" aria-hidden="true" className={className}>
      <rect x="14" y="62" width="36" height="34" fill="var(--color-lavender)" {...OUTLINE} />
      <rect x="100" y="72" width="36" height="24" fill={GREY} {...OUTLINE} />
      <rect x="56" y="46" width="38" height="50" fill="var(--color-acid)" {...OUTLINE} />

      <g className="animate-[var(--animate-kick)]">
        <rect x="62" y="10" width="26" height="26" fill={SURFACE} {...OUTLINE} />
        <path d="M75 16l7 10H68z" fill={EDGE} />
      </g>
      <path d="M8 96h134" stroke={EDGE} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** 404 — a card that tumbled clean off the deck. */
export function LostCardIllustration({ className = 'w-64' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 220 150" aria-hidden="true" className={className}>
      <rect x="18" y="72" width="86" height="58" fill={SURFACE} {...OUTLINE} />
      <rect x="32" y="60" width="86" height="58" fill={SURFACE} {...OUTLINE} />
      <rect x="46" y="78" width="44" height="7" fill={EDGE} />
      <rect x="46" y="94" width="26" height="7" fill={EDGE} />

      {/* The stray card, tipped off-axis and drifting. */}
      <g transform="rotate(-18 168 52)" className="animate-[var(--animate-kick)]">
        <rect x="132" y="22" width="76" height="54" fill="var(--color-lavender)" {...OUTLINE} />
        <rect x="146" y="40" width="36" height="7" fill={EDGE} />
        <rect x="146" y="54" width="20" height="7" fill={EDGE} />
      </g>

      <path
        d="M122 66c14-16 28-26 40-30"
        fill="none"
        stroke={EDGE}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="3 9"
      />
    </svg>
  );
}

/**
 * Decorative panel for the auth pages: a launch board with a vote bar climbing
 * out of it, echoing what the product actually does.
 */
export function LaunchBoardIllustration({ className = 'w-full' }: IllustrationProps) {
  const rows = [
    { y: 18, fill: SURFACE },
    { y: 64, fill: 'var(--color-acid)' },
    { y: 110, fill: SURFACE },
  ];
  const bars = [
    { x: 246, h: 30, fill: 'var(--color-lavender)' },
    { x: 268, h: 52, fill: GREY },
    { x: 290, h: 78, fill: 'var(--color-acid)' },
  ];

  return (
    <svg viewBox="0 0 330 190" aria-hidden="true" className={className}>
      {rows.map((row) => (
        <g key={row.y}>
          <rect x="14" y={row.y} width="206" height="38" fill={row.fill} {...OUTLINE} />
          <rect x="26" y={row.y + 9} width="20" height="20" fill={EDGE} />
          <rect x="56" y={row.y + 12} width="86" height="5" fill={EDGE} />
          <rect x="56" y={row.y + 23} width="52" height="5" fill={EDGE} opacity="0.5" />
          <rect x="188" y={row.y + 9} width="20" height="20" fill={SURFACE} {...OUTLINE} />
        </g>
      ))}

      {bars.map((bar, index) => (
        <rect
          key={bar.x}
          className="animate-[var(--animate-kick)]"
          style={{ animationDelay: `${index * -0.5}s` }}
          x={bar.x}
          y={162 - bar.h}
          width="16"
          height={bar.h}
          fill={bar.fill}
          {...OUTLINE}
        />
      ))}

      <path d="M14 168h300" stroke={EDGE} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Small upward-trend mark used beside "how ranking works" copy. */
export function TrendMark({ className = 'size-10' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true" className={className}>
      <path
        d="M6 32l10-10 6 5 12-15"
        fill="none"
        stroke="var(--color-lavender)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="animate-[var(--animate-kick)]"
        d="M26 12h12v12"
        fill="none"
        stroke={EDGE}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
