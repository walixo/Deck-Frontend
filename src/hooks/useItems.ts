import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Item, ItemDetail, ItemDraft, ItemFilters, Paginated, Revision } from '@/types';

export function useItems(filters: ItemFilters = {}) {
  return useQuery({
    queryKey: queryKeys.items(filters),
    queryFn: () =>
      requestWithMeta<Item[], Paginated<Item>['meta']>('/items', {
        ...filters,
        // Drop empty values so the cache key and the request stay tidy.
        search: filters.search || undefined,
      }),
  });
}

export function useSpotlight() {
  return useQuery({
    queryKey: queryKeys.spotlight(),
    queryFn: () => request<Item[]>('get', '/items/spotlight'),
  });
}

export function useItem(slug: string) {
  return useQuery({
    queryKey: queryKeys.item(slug),
    queryFn: () => request<ItemDetail>('get', `/items/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: ItemDraft) => request<Item>('post', '/items', draft),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
}

/**
 * Partial update for a launch the viewer owns. Takes the slug so the detail
 * query can be refreshed by key; the request itself goes by id.
 */
export function useUpdateItem(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<ItemDraft> & { id: string; note?: string }) =>
      request<Item>('patch', `/items/${id}`, patch),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.item(slug) }),
        /* An edit is what creates a revision, so the history is stale the
           moment this resolves. */
        queryClient.invalidateQueries({ queryKey: queryKeys.revisions(slug) }),
      ]);
    },
  });
}

/**
 * Ships a new version of an existing launch.
 *
 * Invalidates everything rather than a targeted key: a release adds a launch to
 * today's board, changes the version strip on every sibling, and shifts the
 * trending list — narrowing this would just be a list of everything anyway.
 */
export function useReleaseItem(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: ItemDraft & { version: string; changelog?: string }) =>
      request<Item>('post', `/items/${slug}/release`, draft),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
}

/**
 * A launch's edit history, newest first.
 *
 * `enabled` is left to the caller: the item page only asks for this once the
 * reader opens the history, so the common visit costs nothing.
 */
export function useRevisions(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.revisions(slug),
    queryFn: () => request<Revision[]>('get', `/items/${slug}/revisions`),
    enabled: Boolean(slug) && enabled,
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => request<{ id: string }>('delete', `/items/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
