import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Contribution, Fundraise } from '@/types';

export const fundraiseKeys = {
  contributions: (slug: string) => ['contributions', slug] as const,
};

/**
 * Supporters, newest first, with the raise's current state in the meta.
 *
 * Polls while the page is open. A raise is the one thing on a launch page that
 * changes because of other people while you are looking at it, and a total that
 * only moves on reload makes an active raise look dead. Twenty seconds is slow
 * enough to be free — this is a single indexed find — and fast enough that a
 * maker watching their own raise sees a contribution land.
 *
 * `refetchIntervalInBackground` is deliberately left off, so a tab left open
 * overnight stops asking. The window-focus refetch brings it straight back up
 * to date when somebody returns to it.
 */
const POLL_MS = 20_000;

export function useContributions(slug: string, enabled = true) {
  return useQuery({
    queryKey: fundraiseKeys.contributions(slug),
    queryFn: () => requestWithMeta<Contribution[], Fundraise>(`/items/${slug}/contributions`),
    enabled: enabled && Boolean(slug),
    /* Only a raise that can still take money is worth polling — a closed or
       fully-funded one has nothing left to report. */
    refetchInterval: (query) => (query.state.data?.meta.open ? POLL_MS : false),
  });
}

/**
 * Edits an approved raise. Owner only, enforced server-side.
 *
 * No `enabled`: whether a raise exists is decided by the application review,
 * not by the maker. What is left here is the target, the pitch, and pausing.
 */
export function useUpdateFundraise(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { target?: number; pitch?: string; closed?: boolean }) =>
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

export interface FundraiseApplication {
  purpose: string;
  useOfFunds: string;
  timeline: string;
  contact: string;
  target: number;
}

/** Applies to run a raise. The only way one starts; approval is Deck's call. */
export function useApplyForFundraise(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (application: FundraiseApplication) =>
      request<Fundraise>('post', `/items/${slug}/fundraise/apply`, application),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.item(slug) });
    },
  });
}
