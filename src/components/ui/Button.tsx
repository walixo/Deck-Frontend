import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

// Grey is the primary action colour: graphite in light mode, inverted in dark.
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-zinc-900 text-white shadow-[var(--shadow-soft)] hover:bg-zinc-800 hover:shadow-[var(--shadow-lifted)] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white',
  secondary:
    'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white',
  ghost:
    'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-white',
  accent:
    'bg-brand-500 text-white shadow-[var(--shadow-soft)] hover:bg-brand-600 hover:shadow-[var(--shadow-glow)] dark:bg-brand-500 dark:hover:bg-brand-400',
  danger:
    'border border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/40',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

interface ButtonProps extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
        />
      )}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends CommonProps {
  to: string;
  state?: unknown;
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
  state,
}: ButtonLinkProps) {
  return (
    <Link to={to} state={state} className={cn(BASE, VARIANTS[variant], SIZES[size], className)}>
      {children}
    </Link>
  );
}

interface ExternalButtonLinkProps extends CommonProps {
  href: string;
}

export function ExternalButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: ExternalButtonLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
    >
      {children}
    </a>
  );
}
