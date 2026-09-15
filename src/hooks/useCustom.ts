import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
import type {
  ArtworkInspection,
  CustomDesign,
  CustomDesignDraft,
  CustomQueue,
} from '@/types';

export const customKeys = {
  mine: ['custom', 'mine'] as const,
  queue: ['custom', 'queue'] as const,
};

/**
 * Measures an uploaded PNG.
 *
 * A mutation rather than a query even though it only reads: it is triggered by
 * an upload finishing, not by a component rendering, and caching it by URL
 * would keep every file somebody tried in memory for the session.
 */
export function useInspectArtwork() {
  return useMutation({
    mutationFn: (artworkUrl: string) =>
      request<ArtworkInspection>('post', '/custom/inspect', { artworkUrl }),
  });
}

export function useMyDesigns() {
  return useQuery({
    queryKey: customKeys.mine,
    queryFn: () => request<CustomDesign[]>('get', '/custom'),
  });
}

export function useCreateDesign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: CustomDesignDraft) => request<CustomDesign>('post', '/custom', draft),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['custom'] });
    },
  });
}

/**
 * Generates the lifestyle scene. The only generative call Deck makes.
 *
 * No retry: each attempt costs money at the provider, and a failed render is
 * something a person should choose to repeat rather than something the client
 * repeats on their behalf.
 */
export function useLifestyleRender() {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: (reference: string) =>
      request<CustomDesign>('post', `/custom/${reference}/lifestyle`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['custom'] });
    },
  });
}

export function useDeleteDesign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reference: string) =>
      request<{ deleted: boolean }>('delete', `/custom/${reference}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['custom'] });
    },
  });
}

/* ---------------------------------------------------------------- staff --- */

export function useCustomQueue() {
  return useQuery({
    queryKey: customKeys.queue,
    queryFn: () => request<CustomQueue>('get', '/admin/custom'),
  });
}

export function useReviewDesign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reference,
      approve,
      note,
    }: {
      reference: string;
      approve: boolean;
      note: string;
    }) => request<CustomDesign>('patch', `/admin/custom/${reference}`, { approve, note }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['custom'] });
    },
  });
}
