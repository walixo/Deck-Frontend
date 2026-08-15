import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
import type { AdCampaign, AdRateCard, ServedAd } from '@/types';

export const adKeys = {
  rates: () => ['ad-rates'] as const,
  slot: (placement: string) => ['ad-slot', placement] as const,
  mine: () => ['my-ads'] as const,
  pending: () => ['pending-ads'] as const,
};

/**
 * The ad for one slot, or null when nothing is sold.
 *
 * Held for five minutes: a slot that re-fetched on every navigation would
 * inflate the impression count into meaninglessness, since the server counts a
 * serve as an impression.
 */
export function useAdSlot(placement: string) {
  return useQuery({
    queryKey: adKeys.slot(placement),
    queryFn: () => request<ServedAd | null>('get', `/ads/slot/${placement}`),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function useAdRates() {
  return useQuery({
    queryKey: adKeys.rates(),
    queryFn: () => request<AdRateCard>('get', '/ads/rates'),
    staleTime: 60 * 60 * 1000,
  });
}

export function useMyAds(enabled = true) {
  return useQuery({
    queryKey: adKeys.mine(),
    queryFn: () => request<AdCampaign[]>('get', '/ads/mine'),
    enabled,
  });
}

export interface AdDraft {
  itemSlug: string;
  placement: string;
  days: number;
  headline: string;
  body: string;
  imageUrl?: string;
  ctaLabel: string;
  startAt?: string;
}

export function useCreateAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdDraft) => request<AdCampaign>('post', '/ads', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adKeys.mine() });
    },
  });
}

/** Opens Paystack for an approved campaign. Only reachable after review. */
export function usePayForAd() {
  return useMutation({
    mutationFn: (reference: string) =>
      request<AdCampaign & { authorizationUrl: string }>('post', `/ads/${reference}/pay`),
  });
}

/* ------------------------------------------------------------------ staff -- */

export function usePendingAds(enabled = true) {
  return useQuery({
    queryKey: adKeys.pending(),
    queryFn: () => request<AdCampaign[]>('get', '/ads/pending'),
    enabled,
  });
}

export function useReviewAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reference,
      approve,
      reason,
    }: {
      reference: string;
      approve: boolean;
      reason?: string;
    }) =>
      request<AdCampaign>(
        'post',
        `/ads/${reference}/${approve ? 'approve' : 'reject'}`,
        approve ? undefined : { reason },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adKeys.pending() });
      await queryClient.invalidateQueries({ queryKey: ['ad-slot'] });
    },
  });
}
