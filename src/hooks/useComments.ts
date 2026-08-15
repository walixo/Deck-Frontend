import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Comment } from '@/types';

export function useComments(slug: string) {
  return useQuery({
    queryKey: queryKeys.comments(slug),
    queryFn: () => request<Comment[]>('get', `/items/${slug}/comments`),
    enabled: Boolean(slug),
  });
}

interface CommentDraft {
  body: string;
  rating?: number;
  parent?: string;
}

export function useCreateComment(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: CommentDraft) => request<Comment>('post', `/items/${slug}/comments`, draft),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.comments(slug) }),
        // Rating and comment counters live on the item.
        queryClient.invalidateQueries({ queryKey: queryKeys.item(slug) }),
      ]);
    },
  });
}

export function useDeleteComment(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => request<{ id: string }>('delete', `/comments/${commentId}`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.comments(slug) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.item(slug) }),
      ]);
    },
  });
}
