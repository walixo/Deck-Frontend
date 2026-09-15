import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Paginated, Post, PostDraft, PostSummary } from '@/types';

export function usePosts(tag?: string) {
  return useQuery({
    queryKey: queryKeys.posts(tag),
    queryFn: () =>
      requestWithMeta<PostSummary[], Paginated<PostSummary>['meta']>('/posts', { tag, limit: 12 }),
  });
}

export function usePost(slug: string) {
  return useQuery({
    queryKey: queryKeys.post(slug),
    queryFn: () => request<Post>('get', `/posts/${slug}`),
    enabled: Boolean(slug),
  });
}

/* ------------------------------------------------------------------ staff --- */

/** Every post including drafts. Staff only; the server enforces it. */
export function useAllPosts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminPosts(),
    queryFn: () => request<PostSummary[]>('get', '/admin/posts'),
    enabled,
  });
}

function useInvalidatePosts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes('post') });
}

/** Everything you have written, drafts included. */
export function useMyPosts() {
  return useQuery({
    queryKey: ['posts', 'mine'],
    queryFn: () => request<PostSummary[]>('get', '/posts/mine'),
  });
}

/*
 * Writing now goes through `/posts`, not `/admin/posts`.
 *
 * The admin routes still exist and still work — staff use them to moderate
 * anybody's post. These are the ones every account uses on its own writing, and
 * the server checks authorship rather than trusting the path.
 */
export function useCreatePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: (draft: PostDraft) => request<Post>('post', '/posts', draft),
    onSuccess: invalidate,
  });
}

export function useUpdatePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<PostDraft> & { id: string }) =>
      request<Post>('patch', `/posts/${id}`, patch),
    onSuccess: invalidate,
  });
}

export function useDeletePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: (id: string) => request<{ id: string }>('delete', `/posts/${id}`),
    onSuccess: invalidate,
  });
}
