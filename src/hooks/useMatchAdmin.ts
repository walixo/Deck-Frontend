import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';

/** Match, for staff: the numbers, reports and section requests. */

export interface MatchRates {
  calls: number;
  connected: number;
  connectRate: number | null;
  shareRate: number | null;
  reportRate: number | null;
  earlyLeaveRate: number | null;
  extendRate: number | null;
  avgWaitSeconds: { male: number | null; female: number | null };
  reports: number;
}

export interface MatchStats {
  now: {
    total: number;
    male: number;
    female: number;
    hours: { open: boolean; opensAt: number; closesAt: number };
  };
  totals: MatchRates;
  days: (MatchRates & { day: string; peakOnline: number })[];
}

export interface MatchPerson {
  userId: string;
  name: string;
  email: string;
  username: string;
  gender: 'male' | 'female' | null;
  lagosLife: string;
  pausedUntil: string | null;
  history: { calls: number; leftEarly: number; reports: number };
}

export interface MatchReportGroup extends MatchPerson {
  reporters: number;
  reports: { reason: string; note: string; at: string; callId: string }[];
}

export interface MatchSectionRequest {
  userId: string;
  name: string;
  email: string;
  gender: 'male' | 'female';
  note: string;
  at: string | null;
}

const keys = {
  stats: (days: number) => ['admin', 'match', 'stats', days] as const,
  reports: ['admin', 'match', 'reports'] as const,
  sections: ['admin', 'match', 'sections'] as const,
};

export function useMatchStats(days: number) {
  return useQuery({
    queryKey: keys.stats(days),
    queryFn: () => request<MatchStats>('get', `/admin/match/stats?days=${days}`),
    refetchInterval: 30_000,
  });
}

export function useMatchReports() {
  return useQuery({
    queryKey: keys.reports,
    queryFn: () =>
      request<{ groups: MatchReportGroup[]; paused: MatchPerson[] }>('get', '/admin/match/reports'),
  });
}

export function useMatchSectionRequests() {
  return useQuery({
    queryKey: keys.sections,
    queryFn: () => request<MatchSectionRequest[]>('get', '/admin/match/section-requests'),
  });
}

/** Every staff action: pause, unpause, dismiss, switch section, decline. */
export function useMatchAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (
      action:
        | { kind: 'pause'; userId: string; days: number }
        | { kind: 'unpause' | 'dismiss' | 'decline'; userId: string }
        | { kind: 'section'; userId: string; gender: 'male' | 'female' },
    ) => {
      const base = `/admin/match/people/${action.userId}`;
      if (action.kind === 'pause') return request('post', `${base}/pause`, { days: action.days });
      if (action.kind === 'unpause') return request('post', `${base}/unpause`);
      if (action.kind === 'dismiss') return request('post', `${base}/dismiss`);
      if (action.kind === 'section') {
        return request('patch', `${base}/section`, { gender: action.gender });
      }
      return request('delete', `${base}/section-request`);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.reports });
      void client.invalidateQueries({ queryKey: keys.sections });
    },
  });
}
