import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Wordmark } from './Wordmark';

interface LogoProps {
  onClick?: () => void;
  /** Height of the wordmark. Defaults to the navbar size. */
  className?: string;
}

/**
 * The brand link. The wordmark carries the identity on its own now — no
 * accompanying icon — so it is set at a generous size and left to breathe.
 * It shifts a hair on hover, matching how every other block in the UI responds.
 */
export function Logo({ onClick, className }: LogoProps) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="Deck — home"
      className="group inline-flex items-center transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-y-0.5"
    >
      <Wordmark className={cn('h-6 w-auto', className)} />
    </Link>
  );
}
