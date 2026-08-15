import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Contribution, Fundraise } from '@/types';

export const fundraiseKeys = {
  contributions: (slug: string) => ['contributions', slug] as const,
};

/** Supporters, newest first, with the raise's current state in the meta. */
export function useContributions(slug: string, enabled = true) {
  return useQuery({
    queryKey: fundraiseKeys.contributions(slug),
    queryFn: () => requestWithMeta<Contribution[], Fundraise>(`/items/${slug}/contributions`),
    enabled: enabled && Boolean(slug),
  });
}

/** Opts a launch into raising, or back out. Owner only, enforced server-side. */
export function useUpdateFundraise(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { enabled: boolean; target?: number; pitch?: string; closed?: boolean }) =>
      request<Fundraise>('patch', `/items/${slug}/fundraise`, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.item(slug) });
      await queryClient.invalidateQueries({ queryKey: fundraiseKeys.contributions(slug) });
    },
  });
}

/**
 * Starts a contribution and returns the Paystack URL to send the backer to.
 *
 * Nothing is counted here — the raise total only moves when the server has
 * asked Paystack directly whether the charge actually happened.
 */
export function useContribute(slug: string) {
  return useMutation({
    mutationFn: (input: { amount: number; message?: string; anonymous: boolean }) =>
      request<Contribution & { authorizationUrl: string }>(
        'post',
        `/items/${slug}/contributions`,
        input,
      ),
  });
}
