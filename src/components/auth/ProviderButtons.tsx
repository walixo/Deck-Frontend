import { api } from '@/lib/api';
import { useAuthProviders } from '@/hooks/useAuthProviders';
import { cn } from '@/lib/utils';
import type { OAuthProvider } from '@/types';

/*
 * The marks in their own colours.
 *
 * A deliberate exception to the palette rule, and the one place it is right to
 * make one: these are other companies' trademarks, and the whole job of the
 * icon is to be recognised in the half-second before anybody reads the label.
 * Recolouring them to fit Deck makes them worse at the only thing they are for.
 *
 * Google's G is four paths because it is four colours — there is no one-colour
 * version of it in their guidelines, and the shape alone is a grey blob. Their
 * button specs keep it full-colour on light *and* dark surfaces, so it does not
 * change with the theme.
 *
 * GitHub's Invertocat does change: black on light, white on dark, which is
 * exactly what GitHub's own guidelines ask for. `#181717` rather than pure
 * black because that is the brand value, and it is what sits beside a real
 * GitHub button anywhere else on the web.
 */
interface Mark {
  label: string;
  /** Each path with the class that colours it. One entry means one colour. */
  paths: { d: string; className: string }[];
}

const MARKS: Record<OAuthProvider, Mark> = {
  github: {
    label: 'GitHub',
    paths: [
      {
        className: 'fill-[#181717] dark:fill-white',
        d: 'M12 .5a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2.2c-3.34.72-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.3-.54-1.53.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.23 0 4.63-2.8 5.65-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .5Z',
      },
    ],
  },
  google: {
    label: 'Google',
    paths: [
      {
        className: 'fill-[#4285F4]',
        d: 'M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.44a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.09 3.58-5.17 3.58-8.86Z',
      },
      {
        className: 'fill-[#34A853]',
        d: 'M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3.01c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z',
      },
      {
        className: 'fill-[#FBBC05]',
        d: 'M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12 12 0 0 0 0 10.75l3.98-3.09Z',
      },
      {
        className: 'fill-[#EA4335]',
        d: 'M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.1C6.22 6.86 8.87 4.75 12 4.75Z',
      },
    ],
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
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0">
              {MARKS[provider].paths.map((mark) => (
                <path key={mark.className} d={mark.d} className={mark.className} />
              ))}
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
