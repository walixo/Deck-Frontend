import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import type { FounderProfile, PricingModel, PublicUser } from '@/types';

/*
 * Imported listings: the founder pages and "this is mine / take it down"
 * requests anyone can reach, and the staff queue behind them.
 */

export const importKeys = {
  founder: (slug: string) => ['founder', slug] as const,
  queue: (status: string) => ['imports', status] as const,
  requests: (status: string) => ['listing-requests', status] as const,
  founderSearch: (q: string) => ['founder-search', q] as const,
};

/* -------------------------------------------------------------- public -- */

export function useFounder(slug: string) {
  return useQuery({
    queryKey: importKeys.founder(slug),
    queryFn: () => request<FounderProfile>('get', `/founders/${slug}`),
    enabled: Boolean(slug),
  });
}

export interface ListingRequestDraft {
  kind: 'claim' | 'removal';
  name: string;
  email: string;
  relationship?: string;
  message?: string;
}

export function useCreateListingRequest(slug: string) {
  return useMutation({
    mutationFn: (draft: ListingRequestDraft) =>
      request<{ id: string; alreadyOpen: boolean }>(
        'post',
        `/items/${slug}/listing-requests`,
        draft,
      ),
  });
}

/* --------------------------------------------------------------- staff -- */

export type ImportStatus = 'pending' | 'published' | 'rejected';

export interface CandidateFounder {
  name: string;
  headline?: string;
  founderId?: string;
  links: { label: string; url: string }[];
}

export interface CandidateDraft {
  name: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  category: string;
  country?: string;
  tags: string[];
  pricing: PricingModel;
  logoUrl?: string;
  launchedAt?: string;
  founders: CandidateFounder[];
  sourceUrls: string[];
  notes?: string;
}

export interface ImportCandidate extends CandidateDraft {
  _id: string;
  status: ImportStatus;
  domain: string;
  origin: string;
  rejectionReason?: string;
  addedBy?: Pick<PublicUser, 'name' | 'username'>;
  item?: { name: string; slug: string };
  createdAt: string;
  reviewedAt?: string;
}

export function useImportQueue(status: ImportStatus) {
  return useQuery({
    queryKey: importKeys.queue(status),
    queryFn: () =>
      requestWithMeta<ImportCandidate[], { counts: Partial<Record<ImportStatus, number>> }>(
        '/admin/imports',
        { status },
      ),
  });
}

/** Every mutation here moves rows between tabs, so all of them refresh the whole queue. */
function useQueueMutation<TInput, TOutput>(fn: (input: TInput) => Promise<TOutput>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['imports'] });
    },
  });
}

export function useCreateCandidate() {
  return useQueueMutation((draft: CandidateDraft) =>
    request<ImportCandidate>('post', '/admin/imports', draft),
  );
}

export function useUpdateCandidate() {
  return useQueueMutation(({ id, draft }: { id: string; draft: Partial<CandidateDraft> }) =>
    request<ImportCandidate>('patch', `/admin/imports/${id}`, draft),
  );
}

export function usePublishCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<{ item: { name: string; slug: string } }>('post', `/admin/imports/${id}/publish`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['imports'] });
      /* A new listing is browsable straight away. */
      await queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useRejectCandidate() {
  return useQueueMutation(({ id, reason }: { id: string; reason: string }) =>
    request<ImportCandidate>('post', `/admin/imports/${id}/reject`, { reason }),
  );
}

export interface FounderMatch {
  id: string;
  name: string;
  slug: string;
  headline?: string;
  country?: string;
}

export function useFounderSearch(q: string) {
  return useQuery({
    queryKey: importKeys.founderSearch(q),
    queryFn: () => request<FounderMatch[]>('get', '/admin/founders', undefined, { q }),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });
}

export interface ListingRequest {
  _id: string;
  kind: 'claim' | 'removal';
  name: string;
  email: string;
  relationship?: string;
  message?: string;
  status: 'open' | 'resolved' | 'dismissed';
  item: { name: string; slug: string } | null;
  account?: Pick<PublicUser, 'name' | 'username'>;
  resolutionNote?: string;
  createdAt: string;
}

export function useListingRequests(status: ListingRequest['status']) {
  return useQuery({
    queryKey: importKeys.requests(status),
    queryFn: () =>
      request<ListingRequest[]>('get', '/admin/listing-requests', undefined, { status }),
  });
}

export function useResolveListingRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      outcome,
      note,
    }: {
      id: string;
      outcome: 'resolved' | 'dismissed';
      note?: string;
    }) => request<ListingRequest>('patch', `/admin/listing-requests/${id}`, { outcome, note }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['listing-requests'] });
    },
  });
}
