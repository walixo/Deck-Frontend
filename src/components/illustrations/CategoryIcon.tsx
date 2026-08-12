import type { Category } from '@/types';

/**
 * Line-art icon per category. These replaced Unicode glyphs, which rendered at
 * wildly different weights and sizes across platforms. Every path uses
 * currentColor, so an icon inherits whatever text colour it sits in.
 */
const PATHS: Record<Category, React.ReactNode> = {
  // Neural graph — three nodes feeding one.
  'ai-model': (
    <>
      <circle cx="5" cy="6" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="19" cy="12" r="2" />
      <path d="M6.7 7.2 10.2 10.6M6.7 16.8 10.2 13.4M14.2 12H17" />
    </>
  ),
  // Sparkles.
  'ai-tool': (
    <>
      <path d="M11 3.5 12.6 8 17 9.6 12.6 11.2 11 15.7 9.4 11.2 5 9.6 9.4 8Z" />
      <path d="M17.5 15.5 18.3 17.7 20.5 18.5 18.3 19.3 17.5 21.5 16.7 19.3 14.5 18.5 16.7 17.7Z" />
    </>
  ),
  // A capability card with a spark — a skill you drop in.
  'claude-skill': (
    <>
      <rect x="3.5" y="4.5" width="13" height="15" rx="2.5" />
      <path d="M7 9h6M7 12.5h4" />
      <path d="M18 6.5 18.8 8.7 21 9.5 18.8 10.3 18 12.5 17.2 10.3 15 9.5 17.2 8.7Z" />
    </>
  ),
  // Terminal with a prompt.
  'developer-tool': (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M3 9h18" />
      <path d="M7 12.5 9.5 15 7 17.5M12 17.5h5" />
    </>
  ),
  // Phone.
  'mobile-app': (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M10.5 5.5h3" />
      <circle cx="12" cy="18" r="1" />
    </>
  ),
  // Browser window.
  website: (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
      <path d="M2.5 8.5h19" />
      <circle cx="6" cy="6.2" r="0.7" />
      <circle cx="8.5" cy="6.2" r="0.7" />
      <path d="M7 12.5h10M7 16h6" />
    </>
  ),
  // Chip with pins.
  hardware: (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
      <rect x="10" y="10" width="4" height="4" rx="0.75" />
      <path d="M10 6.5V3.5M14 6.5V3.5M10 17.5v3M14 17.5v3M6.5 10h-3M6.5 14h-3M17.5 10h3M17.5 14h3" />
    </>
  ),
};

interface CategoryIconProps {
  category: Category;
  className?: string;
}

export function CategoryIcon({ category, className = 'size-4' }: CategoryIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[category]}
    </svg>
  );
}

/**
 * Boxed variant: the icon inside a hard-edged block, for the category strip and
 * anywhere an icon needs to hold its own next to heavy display type.
 */
export function CategoryIconBlock({
  category,
  className = '',
}: {
  category: Category;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-10 items-center justify-center border-2 border-edge bg-surface-2 text-body ${className}`}
    >
      <CategoryIcon category={category} className="size-5" />
    </span>
  );
}
