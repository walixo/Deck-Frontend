import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { CategoryCount, PlatformStats, TagCount, TopMaker, UserProfile } from '@/types';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => request<CategoryCount[]>('get', '/categories'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags(),
    queryFn: () => request<TagCount[]>('get', '/tags'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: () => request<PlatformStats>('get', '/stats'),
  });
}

export function useTopMakers() {
  return useQuery({
    queryKey: queryKeys.topMakers(),
    queryFn: () => request<TopMaker[]>('get', '/users/top'),
  });
}

export function useProfile(username: string) {
  return useQuery({
    queryKey: queryKeys.profile(username),
    queryFn: () => request<UserProfile>('get', `/users/${username}`),
    enabled: Boolean(username),
  });
}
