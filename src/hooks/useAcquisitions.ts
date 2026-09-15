import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import type {
  AcquisitionDetail,
  AcquisitionDraft,
  AcquisitionQueue,
  AcquisitionSummary,
  Bid,
  Paginated,
} from '@/types';

export const acquisitionKeys = {
  all: ['acquisitions'] as const,
  list: (sort: string, search: string) => ['acquisitions', 'list', sort, search] as const,
  one: (slug: string) => ['acquisitions', slug] as const,
  queue: () => ['acquisitions', 'queue'] as const,
};

/** The meta carries `feePercent`, so the board can state Deck's cut without a constant. */
type ListMeta = Paginated<AcquisitionSummary>['meta'] & { feePercent: number };

export function useAcquisitions(sort: string, search: string) {
  return useQuery({
    queryKey: acquisitionKeys.list(sort, search),
    queryFn: () =>
      requestWithMeta<AcquisitionSummary[], ListMeta>('/acquisitions', {
        sort: sort || undefined,
        search: search || undefined,
        limit: 48,
      }),
  });
}

export function useAcquisition(slug: string) {
  return useQuery({
    queryKey: acquisitionKeys.one(slug),
    queryFn: () => request<AcquisitionDetail>('get', `/acquisitions/${slug}`),
    enabled: Boolean(slug),
  });
}

/** Lists a launch for acquisition. Goes to the launch, not the board. */
export function useListForAcquisition(itemSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: AcquisitionDraft) =>
      request<AcquisitionDetail>('post', `/items/${itemSlug}/acquisition`, draft),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: acquisitionKeys.all });
    },
  });
}

export function useUpdateAcquisition(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<AcquisitionDraft>) =>
      request<AcquisitionDetail>('patch', `/acquisitions/${slug}`, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: acquisitionKeys.all });
    },
  });
}

export function useWithdrawAcquisition(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => request<{ withdrawn: boolean }>('post', `/acquisitions/${slug}/withdraw`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: acquisitionKeys.all });
    },
  });
}

/**
 * Makes or replaces an offer.
 *
 * One live offer per person, so submitting again raises or lowers the existing
 * one rather than stacking a second — the server upserts and this just reflects
 * it. Invalidates the whole listing because the bid count and the highest bid
 * on the public summary both move.
 */
export function useBid(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { amount: number; message: string }) =>
      request<Bid>('post', `/acquisitions/${slug}/bids`, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: acquisitionKeys.all });
    },
  });
}

export function useWithdrawBid(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      request<{ withdrawn: boolean }>('post', `/acquisitions/bids/${id}/withdraw`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: acquisitionKeys.one(slug) });
    },
  });
}

/** Accepts an offer. Seller only, and it closes the listing. */
export function useAcceptBid(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      request<AcquisitionDetail>('post', `/acquisitions/${slug}/bids/${id}/accept`),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
}

/* ---------------------------------------------------------------- staff --- */

export function useAcquisitionQueue() {
  return useQuery({
    queryKey: acquisitionKeys.queue(),
    queryFn: () => request<AcquisitionQueue>('get', '/admin/acquisitions'),
  });
}

export function useReviewAcquisition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, approve, note }: { slug: string; approve: boolean; note: string }) =>
      request<AcquisitionDetail>('patch', `/admin/acquisitions/${slug}`, { approve, note }),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
