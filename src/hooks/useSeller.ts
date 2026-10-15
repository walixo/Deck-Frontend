import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import type {
  MerchProduct,
  OwedMeta,
  OwedRow,
  Payout,
  PayoutAccount,
  SellerBalance,
  SellerEarnings,
  TransferRunResult,
} from '@/types';

export const sellerKeys = {
  earnings: () => ['seller-earnings'] as const,
  payouts: () => ['seller-payouts'] as const,
  myListings: () => ['my-listings'] as const,
  pendingListings: () => ['pending-listings'] as const,
  owed: () => ['payouts-owed'] as const,
  payoutAccount: () => ['payout-account'] as const,
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

/** Whether this seller has a sub-account Deck can transfer to. */
export function usePayoutAccount(enabled = true) {
  return useQuery({
    queryKey: sellerKeys.payoutAccount(),
    queryFn: () => request<PayoutAccount>('get', '/sellers/payout-account'),
    enabled,
  });
}

/**
 * Mints a hosted onboarding link. Bachs collects identity and bank details on
 * its own page — the caller just sends the browser there.
 */
export function useStartPayoutOnboarding(from: 'sell' | 'games' = 'sell') {
  return useMutation({
    mutationFn: () =>
      request<{ url: string }>('post', '/sellers/payout-account/onboarding', { from }),
  });
}

/**
 * Asks the server to re-read the account from Bachs. Used on the way back from
 * onboarding: arriving at the return URL proves nothing on its own.
 */
export function useRefreshPayoutAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => request<PayoutAccount>('post', '/sellers/payout-account/refresh'),
    onSuccess: (account) => queryClient.setQueryData(sellerKeys.payoutAccount(), account),
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
    queryFn: () => requestWithMeta<OwedRow[], OwedMeta>('/payouts/owed'),
    enabled,
  });
}

/**
 * Runs the transfer job now rather than waiting for the hourly tick. The same
 * code path as the scheduler, so it carries the same safeguards.
 */
export function useRunTransfers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => request<TransferRunResult>('post', '/payouts/run'),
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
