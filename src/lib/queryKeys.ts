import type { ItemFilters } from '@/types';

export const queryKeys = {
  items: (filters: ItemFilters) => ['items', filters] as const,
  spotlight: () => ['spotlight'] as const,
  item: (slug: string) => ['item', slug] as const,
  comments: (slug: string) => ['comments', slug] as const,
  leaderboard: (date?: string) => ['leaderboard', date ?? 'today'] as const,
  leaderboardPeriod: (period: string) => ['leaderboard-period', period] as const,
  leaderboardDates: () => ['leaderboard-dates'] as const,
  categories: () => ['categories'] as const,
  tags: () => ['tags'] as const,
  stats: () => ['stats'] as const,
  topMakers: () => ['top-makers'] as const,
  profile: (username: string) => ['profile', username] as const,
};
