import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import type { MerchProduct, OwedRow, Payout, SellerBalance, SellerEarnings } from '@/types';

export const sellerKeys = {
  earnings: () => ['seller-earnings'] as const,
  payouts: () => ['seller-payouts'] as const,
  myListings: () => ['my-listings'] as const,
  pendingListings: () => ['pending-listings'] as const,
  owed: () => ['payouts-owed'] as const,
};

/**
 * What this seller has earned, been paid, and is still owed.
 *
 * Deck collects every payment, so `owedMinor` is a debt Deck has not settled
 * yet — not money sitting in the seller's bank. The dashboard has to say which
 * is which, so the two arrive as separate figures.
 */
export function useSellerEarnings(enabled = true) {
  return useQuery({
    queryKey: sellerKeys.earnings(),
    queryFn: () => request<SellerEarnings>('get', '/sellers/earnings'),
    enabled,
  });
}

/** Disbursements Deck has already sent, newest first. */
export function useMyPayouts(enabled = true) {
  return useQuery({
    queryKey: sellerKeys.payouts(),
    queryFn: () => requestWithMeta<Payout[], SellerBalance>('/sellers/payouts'),
    enabled,
  });
}

/** The seller's own shelf, including drafts and anything rejected. */
export function useMyListings(enabled = true) {
  return useQuery({
    queryKey: sellerKeys.myListings(),
    queryFn: () => request<MerchProduct[]>('get', '/merch/mine'),
    enabled,
  });
}

export interface ListingInput {
  name: string;
  tagline: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  variants: { sku: string; size?: string; colour?: string; stock: number }[];
  active?: boolean;
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ListingInput) => request<MerchProduct>('post', '/merch', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellerKeys.myListings() });
      await queryClient.invalidateQueries({ queryKey: sellerKeys.earnings() });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: Partial<ListingInput> & { id: string }) =>
      request<MerchProduct>('patch', `/merch/${id}`, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellerKeys.myListings() });
      await queryClient.invalidateQueries({ queryKey: ['merch'] });
    },
  });
}

export function useRetireListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => request<{ id: string }>('delete', `/merch/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellerKeys.myListings() });
      await queryClient.invalidateQueries({ queryKey: ['merch'] });
    },
  });
}

/* ------------------------------------------------------------------ staff -- */

export function usePendingListings(enabled = true) {
  return useQuery({
    queryKey: sellerKeys.pendingListings(),
    queryFn: () => request<MerchProduct[]>('get', '/merch/pending'),
    enabled,
  });
}

/** Everyone Deck owes, largest first. Staff only. */
export function useOwed(enabled = true) {
  return useQuery({
    queryKey: sellerKeys.owed(),
    queryFn: () =>
      requestWithMeta<OwedRow[], { currency: string; totalOwedMinor: number; sellers: number }>(
        '/payouts/owed',
      ),
    enabled,
  });
}

/** Records a disbursement that has already left Deck's bank. */
export function useRecordPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      sellerId: string;
      amount: number;
      destination?: string;
      note?: string;
    }) => request<Payout & { remainingOwedMinor: number }>('post', '/payouts', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellerKeys.owed() });
      await queryClient.invalidateQueries({ queryKey: sellerKeys.earnings() });
    },
  });
}

export function useReviewListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approve, reason }: { id: string; approve: boolean; reason?: string }) =>
      request<MerchProduct>(
        'post',
        `/merch/${id}/${approve ? 'approve' : 'reject'}`,
        approve ? undefined : { reason },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellerKeys.pendingListings() });
      await queryClient.invalidateQueries({ queryKey: ['merch'] });
    },
  });
}
