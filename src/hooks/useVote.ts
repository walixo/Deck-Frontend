import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
import type { Item } from '@/types';

interface VoteResult {
  itemId: string;
  voteCount: number;
  hasVoted: boolean;
}

type Patch = Pick<VoteResult, 'voteCount' | 'hasVoted'>;

function isItemLike(value: unknown): value is Item {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'voteCount' in value &&
    'slug' in value
  );
}

/**
 * The same item appears in many caches at once — lists, spotlight, leaderboard,
 * profile, related. Walk cached data and patch every copy so the whole UI agrees.
 */
function patchCached(value: unknown, itemId: string, patch: Patch, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((entry) => patchCached(entry, itemId, patch, depth + 1));
  }

  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    next[key] = patchCached(entry, itemId, patch, depth + 1);
  }

  if (isItemLike(next) && next.id === itemId) {
    return { ...next, ...patch };
  }

  return next;
}

function applyVotePatch(queryClient: QueryClient, itemId: string, patch: Patch): void {
  queryClient.setQueriesData({ type: 'active' }, (cached: unknown) =>
    patchCached(cached, itemId, patch),
  );
}

export function useToggleVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Pick<Item, 'id' | 'voteCount' | 'hasVoted'>) =>
      request<VoteResult>('post', `/items/${item.id}/vote`),

    // Optimistic: the count moves the instant you click.
    onMutate: async (item) => {
      await queryClient.cancelQueries();
      const previous = { voteCount: item.voteCount, hasVoted: item.hasVoted };
      applyVotePatch(queryClient, item.id, {
        hasVoted: !item.hasVoted,
        voteCount: Math.max(0, item.voteCount + (item.hasVoted ? -1 : 1)),
      });
      return previous;
    },

    onError: (_error, item, previous) => {
      if (previous) applyVotePatch(queryClient, item.id, previous);
    },

    // Reconcile with the server's authoritative count.
    onSuccess: (result) => {
      applyVotePatch(queryClient, result.itemId, {
        voteCount: result.voteCount,
        hasVoted: result.hasVoted,
      });
    },
  });
}
