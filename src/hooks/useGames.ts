import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
import type { GameDetail, GameDraft, GameGenre, GameSummary, Leaderboard } from '@/types';

const keys = {
  all: ['games'] as const,
  list: (genre?: GameGenre) => ['games', 'list', genre ?? 'all'] as const,
  mine: () => ['games', 'mine'] as const,
  one: (slug: string) => ['games', slug] as const,
  queue: () => ['games', 'queue'] as const,
  scores: (slug: string) => ['games', slug, 'scores'] as const,
};

export function useLeaderboard(slug: string) {
  return useQuery({
    queryKey: keys.scores(slug),
    queryFn: () => request<Leaderboard>('get', `/games/${slug}/scores`),
    enabled: Boolean(slug),
    staleTime: 30 * 1000,
  });
}

/**
 * Posts a run's score.
 *
 * Invalidates only that game's board. The score list is the one thing on the
 * page that has certainly changed, and refetching the whole arcade to move one
 * row would be a lot of traffic for a number.
 */
export function useSubmitScore(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (score: number) =>
      request<{ best: number; improved: boolean; rank: number }>(
        'post',
        `/games/${slug}/scores`,
        { score },
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.scores(slug) }),
  });
}

export function useGames(genre?: GameGenre) {
  return useQuery({
    queryKey: keys.list(genre),
    queryFn: () =>
      request<GameSummary[]>('get', `/games${genre ? `?genre=${genre}` : ''}`),
    staleTime: 60 * 1000,
  });
}

export function useGame(slug: string) {
  return useQuery({
    queryKey: keys.one(slug),
    queryFn: () => request<GameDetail>('get', `/games/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useMyGames() {
  return useQuery({
    queryKey: keys.mine(),
    queryFn: () => request<GameSummary[]>('get', '/games/mine'),
  });
}

export function useSubmitGame() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (draft: GameDraft) => request<GameDetail>('post', '/games', draft),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateGame(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (draft: Partial<GameDraft>) =>
      request<GameDetail>('patch', `/games/${slug}`, draft),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDeleteGame() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => request<{ removed: boolean }>('delete', `/games/${slug}`),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
  });
}

/**
 * Counts a play.
 *
 * Deliberately fire-and-forget: the counter is a nice-to-have and a failed
 * increment must never stop somebody playing, so nothing here is awaited and
 * nothing invalidates — refetching the list to move a number by one would be
 * more traffic than the number is worth.
 */
export function useRecordPlay() {
  return useMutation({
    mutationFn: (slug: string) => request<{ plays: number }>('post', `/games/${slug}/play`),
  });
}

/* -------------------------------------------------------------- staff */

export function useGameQueue() {
  return useQuery({
    queryKey: keys.queue(),
    queryFn: () => request<GameSummary[]>('get', '/admin/games'),
  });
}

export function useReviewGame() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      status: 'approved' | 'rejected';
      reviewNote?: string;
      embeddable?: boolean;
      featured?: boolean;
    }) => request<GameDetail>('patch', `/admin/games/${id}/review`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
  });
}
