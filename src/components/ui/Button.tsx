import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

/*
 * Every button is a full-round pill that floats: it rises a couple of pixels
 * under the pointer and its glow spreads, then settles and shrinks slightly on
 * the press. Match's motion, now everywhere.
 *
 * The duration is shorter than the 300ms the slabs used. A lift wants to feel
 * responsive rather than considered, and at 300ms the rise reads as lag.
 */
const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-mono font-medium uppercase ' +
  'transition-[background-color,color,border-color,box-shadow,transform,filter] duration-200 ease-[var(--ease-snap)] ' +
  'disabled:pointer-events-none disabled:opacity-40';

/*
 * The pills are defined once as utilities in index.css (`glass-primary`,
 * `glass-secondary`, `glass-ink`) so every button on the site — this component
 * or hand-written — moves and catches light the same way. The accent for the
 * one action on a screen to press, glass for the rest, ink for the strong
 * neutral.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'glass-primary',
  secondary: 'glass-secondary',
  accent: 'glass-ink',
  /* Red carries its own glow rather than the accent's, and still carries its
     word — see CONTRACT rule 6. */
  danger:
    'border border-transparent bg-danger text-bone shadow-[0_14px_40px_-12px_color-mix(in_srgb,var(--color-danger)_55%,transparent)] ' +
    'hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_18px_50px_-12px_color-mix(in_srgb,var(--color-danger)_72%,transparent)] ' +
    'active:translate-y-0 active:scale-[0.96]',
  ghost:
    'border border-transparent text-muted hover:bg-[var(--glass-fill)] hover:text-body active:scale-[0.96]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[10px] tracking-[0.14em]',
  md: 'h-11 px-5 text-[11px] tracking-[0.16em]',
  lg: 'h-12 px-7 text-[12px] tracking-[0.16em]',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

interface ButtonProps
  extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
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
          className="size-3.5 shrink-0 animate-spin rounded-full border border-current border-t-transparent"
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
