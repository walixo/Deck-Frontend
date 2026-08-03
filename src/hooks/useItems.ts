import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Item, ItemDetail, ItemDraft, ItemFilters, Paginated } from '@/types';

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

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => request<{ id: string }>('delete', `/items/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
