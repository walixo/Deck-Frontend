import { useQuery } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { LeaderboardDay, LeaderboardMeta, RankedItem } from '@/types';

export function useDailyLeaderboard(date?: string) {
  return useQuery({
    queryKey: queryKeys.leaderboard(date),
    queryFn: () =>
      requestWithMeta<RankedItem[], LeaderboardMeta>('/leaderboard', { date, limit: 20 }),
  });
}

export function usePeriodLeaderboard(period: 'week' | 'month' | 'year' | 'all') {
  return useQuery({
    queryKey: queryKeys.leaderboardPeriod(period),
    queryFn: () => request<RankedItem[]>('get', '/leaderboard/period', undefined, { period, limit: 10 }),
  });
}

export function useLeaderboardDates() {
  return useQuery({
    queryKey: queryKeys.leaderboardDates(),
    queryFn: () => request<LeaderboardDay[]>('get', '/leaderboard/dates'),
  });
}
