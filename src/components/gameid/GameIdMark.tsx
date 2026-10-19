import { cn } from '@/lib/utils';

/**
 * The GameID mark: a controller's face — a d-pad and two buttons — inside a
 * rounded badge. Drawn in `currentColor`, so it takes whatever ink it sits
 * in: white on the sign-in button, ink on paper, ember as an accent.
 */
export function GameIdMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn('block', className)}
    >
      {title && <title>{title}</title>}
      <rect x="2" y="4.5" width="20" height="15" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 9.2v5.6M5.2 12h5.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="15.6" cy="10.6" r="1.25" fill="currentColor" />
      <circle cx="18" cy="13.4" r="1.25" fill="currentColor" />
    </svg>
  );
}
