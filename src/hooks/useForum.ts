import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import type {
  Paginated,
  Reply,
  TopicDetail,
  TopicDraft,
  TopicSection,
  TopicSummary,
} from '@/types';

export const forumKeys = {
  topics: (section: string, search: string) => ['forum', 'topics', section, search] as const,
  topic: (slug: string) => ['forum', 'topic', slug] as const,
};

export function useTopics(section: string, search: string) {
  return useQuery({
    queryKey: forumKeys.topics(section, search),
    queryFn: () =>
      requestWithMeta<TopicSummary[], Paginated<TopicSummary>['meta']>('/forum', {
        section: section || undefined,
        search: search || undefined,
        limit: 50,
      }),
  });
}

export function useTopic(slug: string) {
  return useQuery({
    queryKey: forumKeys.topic(slug),
    queryFn: () => request<TopicDetail>('get', `/forum/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: TopicDraft) => request<TopicDetail>('post', '/forum', draft),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['forum', 'topics'] });
    },
  });
}

export function useUpdateTopic(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<TopicDraft>) =>
      request<TopicDetail>('patch', `/forum/${slug}`, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['forum'] });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => request<{ deleted: boolean }>('delete', `/forum/${slug}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['forum'] });
    },
  });
}

/**
 * Posting a reply.
 *
 * Invalidates the index as well as the thread: a reply moves the topic to the
 * top of the list and changes both its count and its "last reply by", so the
 * index behind this page is stale the moment this resolves.
 */
export function useCreateReply(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => request<Reply>('post', `/forum/${slug}/replies`, { body }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: forumKeys.topic(slug) }),
        queryClient.invalidateQueries({ queryKey: ['forum', 'topics'] }),
      ]);
    },
  });
}

export function useDeleteReply(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => request<{ deleted: boolean }>('delete', `/forum/replies/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: forumKeys.topic(slug) });
    },
  });
}

/** Pin and lock. Staff only — the server refuses everybody else. */
export function useModerateTopic(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { pinned?: boolean; locked?: boolean; note: string }) =>
      request<TopicDetail>('patch', `/forum/${slug}/moderate`, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['forum'] });
    },
  });
}

/** Re-exported so pages import their types from one place. */
export type { TopicSection };
