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
  'inline-flex items-center justify-center gap-2 border-2 border-edge font-bold whitespace-nowrap ' +
  'transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)] ' +
  'hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] ' +
  'active:shadow-none disabled:pointer-events-none disabled:opacity-40 rounded-slab';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-cobalt text-white shadow-hard-sm hover:bg-cobalt-deep hover:shadow-hard',
  secondary: 'bg-surface text-body shadow-hard-sm hover:bg-surface-2 hover:shadow-hard',
  accent: 'bg-acid text-ink shadow-hard-sm hover:bg-acid-deep hover:shadow-hard',
  // Inverted rather than a third colour: black-on-white in light, the reverse in dark.
  danger: 'bg-edge text-canvas shadow-hard-sm hover:shadow-hard',
  // The one exception: no block, no shadow — for tertiary actions inside dense UI.
  ghost:
    'border-transparent text-muted shadow-none hover:translate-x-0 hover:translate-y-0 ' +
    'active:translate-x-0 active:translate-y-0 hover:bg-surface-2 hover:text-body',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

interface ButtonProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
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
          className="size-3.5 shrink-0 animate-spin border-2 border-current border-t-transparent"
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
