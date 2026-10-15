import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

/*
 * Every button is a solid block with a 2px edge and a hard offset shadow. Hover
 * nudges the block toward its shadow's origin and lengthens the shadow; the
 * active state slams it all the way down, so a press feels physical.
 */
const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] font-mono font-medium uppercase ' +
  'transition-[background-color,color,border-color,box-shadow,transform,filter] duration-300 ease-[var(--ease-snap)] ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40';

/*
 * The arcade's buttons, everywhere: small square-cornered blocks with mono
 * capitals, in the one accent colour for the primary action and ink or a
 * hairline for everything else. No hard shadows and no press-down offset —
 * a press is a slight scale, a hover is a change of fill.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-pop text-on-pop hover:bg-pop-hover',
  secondary: 'border border-line bg-surface text-body hover:border-edge',
  accent:
    'bg-deep text-on-deep hover:bg-deep-hover dark:bg-body dark:text-canvas dark:hover:opacity-90',
  /* Red, and it still carries its word. See CONTRACT rule 6. */
  danger: 'bg-danger text-bone hover:brightness-110',
  // No block — for tertiary actions inside dense UI.
  ghost: 'text-muted hover:bg-surface-2 hover:text-body',
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
