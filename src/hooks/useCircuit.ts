import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api';
import type { CircuitBoardRow, CircuitChallenge } from '@/types';

/** Deck Circuit from the browser: the open challenges and the boards. */

const keys = {
  challenges: ['circuit', 'challenges'] as const,
  board: (slug: string) => ['circuit', 'board', slug] as const,
  season: ['circuit', 'season'] as const,
};

export function useChallenges() {
  return useQuery({
    queryKey: keys.challenges,
    queryFn: () => request<CircuitChallenge[]>('get', '/agents/challenges'),
    /* Challenges change with a deploy, not with traffic. */
    staleTime: 10 * 60 * 1000,
  });
}

export function useChallengeBoard(slug: string) {
  return useQuery({
    queryKey: keys.board(slug),
    queryFn: () =>
      request<{ challenge: CircuitChallenge; rows: CircuitBoardRow[] }>(
        'get',
        `/agents/challenges/${slug}/board`,
      ),
    staleTime: 30 * 1000,
  });
}

export function useSeasonBoard() {
  return useQuery({
    queryKey: keys.season,
    queryFn: () => request<{ rows: CircuitBoardRow[] }>('get', '/agents/board'),
    staleTime: 30 * 1000,
  });
}
