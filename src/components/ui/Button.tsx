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
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-mono font-medium uppercase ' +
  'transition-[background-color,color,border-color,box-shadow,transform,filter] duration-300 ease-[var(--ease-snap)] ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40';

/*
 * Glass buttons: panes with a lit top edge and a soft glow, defined once as
 * utilities in index.css (`glass-primary`, `glass-secondary`, `glass-ink`) so
 * every button on the site — this component or hand-written — is the same
 * glass. Ember for the one action on a screen that should be pressed, clear
 * frosted glass for the rest, smoked glass for the strong neutral.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'glass-primary',
  secondary: 'glass-secondary',
  accent: 'glass-ink',
  /* Red glass, and it still carries its word. See CONTRACT rule 6. */
  danger:
    'border border-white/25 bg-[linear-gradient(180deg,rgb(255_255_255/0.2),transparent_55%),linear-gradient(180deg,var(--color-danger),var(--color-danger))] text-bone shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_10px_24px_-12px_rgb(201_42_42/0.6)] backdrop-blur-md hover:brightness-110',
  // No pane at rest — for tertiary actions inside dense UI. Frosts on hover.
  ghost: 'border border-transparent text-muted hover:glass-secondary hover:text-body',
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
