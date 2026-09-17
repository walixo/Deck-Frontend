import { api } from '@/lib/api';
import { useAuthProviders } from '@/hooks/useAuthProviders';
import { cn } from '@/lib/utils';
import type { OAuthProvider } from '@/types';

/*
 * Monochrome marks, drawn in `currentColor`.
 *
 * Both companies publish full-colour buttons with their own type and spacing
 * rules, and dropping either one into this page would put a shape in it that
 * belongs to somebody else's design system — in Google's case a palette that
 * exists nowhere else on Deck. A single-colour glyph is recognisable, it
 * inherits the theme in both light and dark without a second asset, and it
 * leaves the button looking like every other button here.
 */
const MARKS: Record<OAuthProvider, { label: string; path: string }> = {
  github: {
    label: 'GitHub',
    path: 'M12 .5a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2.2c-3.34.72-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.3-.54-1.53.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.23 0 4.63-2.8 5.65-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .5Z',
  },
  google: {
    label: 'Google',
    path: 'M12 10.2v3.9h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5 0-.7-.07-1.4-.2-2.1H12Zm-6.6 4.3-.74.57-2.63 2.05A10 10 0 0 0 12 22c2.7 0 4.96-.9 6.6-2.4l-3.13-2.4c-.86.58-1.97.93-3.47.93a6 6 0 0 1-5.66-4.1l-.94.07ZM2.03 6.88A10 10 0 0 0 2 17.12l3.4-2.63a6 6 0 0 1 0-3.83l-3.37-2.6v-.18Zm10-4.88a10 10 0 0 0-9.97 6.88l3.4 2.62A6 6 0 0 1 12 6.1c1.47 0 2.78.5 3.82 1.5l2.85-2.85C16.94 3.05 14.7 2 12 2h.03Z',
  },
};

interface ProviderButtonsProps {
  /** Reads on the button: "Continue with GitHub" either way, but the heading
      above the divider says what the page is for. */
  action: 'Sign in' | 'Sign up';
  className?: string;
}

/**
 * The social buttons, plus the rule that separates them from the form.
 *
 * Renders nothing at all when the API reports no configured providers — which
 * is the state of a fresh checkout — so the sign-in page does not grow a
 * dangling "or" above an empty space.
 *
 * These are plain links, not buttons calling fetch. The whole flow is a
 * sequence of full-page redirects and it has to start as one: an XHR to the
 * provider would be blocked by CORS, and the consent screen has to be rendered
 * by the browser at the provider's own origin so a person can see whose it is.
 */
export function ProviderButtons({ action, className }: ProviderButtonsProps) {
  const { data } = useAuthProviders();
  const providers = data?.providers ?? [];

  if (providers.length === 0) return null;

  return (
    <div className={className}>
      <div className="grid gap-2.5">
        {providers.map((provider) => (
          <a
            key={provider}
            /* Built off the axios base URL so it follows VITE_API_BASE_URL —
               when that is unset it stays relative and the dev proxy carries
               it, and when it is set the redirect starts at the real API. */
            href={`${api.defaults.baseURL ?? '/api'}/auth/oauth/${provider}/start`}
            className={cn(
              'flex h-11 items-center justify-center gap-2.5 rounded-slab border border-edge',
              'bg-surface text-sm font-bold text-body shadow-hard-sm',
              'transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)]',
              'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-surface-2 hover:shadow-hard',
              'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
            )}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
              <path d={MARKS[provider].path} />
            </svg>
            Continue with {MARKS[provider].label}
          </a>
        ))}
      </div>

      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-edge" />
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          or {action.toLowerCase()} with email
        </span>
        <span className="h-px flex-1 bg-edge" />
      </div>
    </div>
  );
}
