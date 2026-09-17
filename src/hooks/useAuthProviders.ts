import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api';
import type { OAuthProvider } from '@/types';

/**
 * Which social sign-in methods this deployment actually has keys for.
 *
 * Asked rather than assumed, so a provider that is configured in production
 * and absent in development shows a button in one and nothing in the other —
 * instead of a button that leads to a 404 in the place it is least wanted.
 *
 * Cached for the session. It changes when the server is redeployed, which the
 * page load already accounts for.
 */
export function useAuthProviders() {
  return useQuery({
    queryKey: ['auth-providers'],
    queryFn: () => request<{ providers: OAuthProvider[] }>('get', '/auth/providers'),
    staleTime: Infinity,
    /* A missing or old API should leave the password form working, not blow up
       the sign-in page. */
    retry: false,
  });
}
