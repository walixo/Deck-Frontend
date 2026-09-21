import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import type { AppNotification } from '@/types';

export const notificationKeys = {
  list: () => ['notifications'] as const,
};

interface NotificationMeta {
  unread: number;
  hasMore: boolean;
}

/**
 * The bell's contents, polled.
 *
 * Polling rather than a socket, deliberately. A WebSocket means a connection
 * per signed-in reader held open on a single Node process, a reconnect story,
 * and a second transport to reason about when something does not arrive —
 * against a feature whose entire job is to be up to date within a minute. One
 * indexed count query a minute is cheaper than all of that, and it fails in
 * ways that are already understood.
 *
 * `refetchIntervalInBackground` stays off, so a tab left open on a second
 * monitor for a weekend stops asking. The window-focus refetch covers coming
 * back to it, which is the moment the answer matters again.
 */
export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => requestWithMeta<AppNotification[], NotificationMeta>('/notifications'),
    enabled,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

/**
 * Marks everything read, optimistically.
 *
 * The badge has to clear the instant the panel opens — waiting a round trip to
 * drop a number the reader has already looked at makes the UI feel broken.
 * On failure the cache is rolled back and the badge returns, which is the
 * honest outcome: they are still unread on the server.
 */
export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => request<{ marked: number }>('post', '/notifications/read'),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list() });
      const previous = queryClient.getQueryData(notificationKeys.list());

      queryClient.setQueryData(
        notificationKeys.list(),
        (current: { data: AppNotification[]; meta: NotificationMeta } | undefined) =>
          current && {
            data: current.data.map((item) => ({ ...item, read: true })),
            meta: { ...current.meta, unread: 0 },
          },
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(notificationKeys.list(), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.list() }),
  });
}
