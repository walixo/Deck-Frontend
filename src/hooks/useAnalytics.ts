import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api';
import type { LaunchViews } from '@/types';

export const analyticsKeys = {
  launchViews: (days: number) => ['launch-views', days] as const,
};

/**
 * Daily view counts for every launch the signed-in maker has posted.
 *
 * One request for the whole page — the server returns a shared date axis and a
 * padded series per launch, so a card can draw its own line without knowing
 * anything about the others.
 *
 * Longer `staleTime` than the rest of the app. This is yesterday's traffic
 * plus however much of today has happened; refetching it every thirty seconds
 * would put load on an aggregate to redraw a line that moved by one pixel.
 */
export function useMyLaunchViews(days = 30, enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.launchViews(days),
    queryFn: () => request<LaunchViews>('get', `/users/me/launch-views?days=${days}`),
    staleTime: 5 * 60_000,
    enabled,
  });
}
