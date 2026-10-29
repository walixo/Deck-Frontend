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
  x: string;
  instagram: string;
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

export interface MatchRevenue {
  days: number;
  /** Credit spent, net of refunds: what Match earned. Kobo. */
  spentMinor: number;
  byKind: Partial<
    Record<'minute' | 'gift' | 'entry' | 'badge' | 'plus', { minor: number; count: number }>
  >;
  topupsMinor: number;
  topups: number;
  giftCardsMinor: number;
  giftCards: number;
  outstandingMinor: number;
  plusMembers: number;
  verifiedPeople: number;
}

export interface MatchGiftCardAdmin {
  soldMinor: number;
  sold: number;
  redeemed: number;
  unclaimedCreditMinor: number;
  unclaimedCredit: number;
  unclaimedPlus: number;
  batches: { batch: string; label: string; count: number; redeemed: number; createdAt: string }[];
  cards: {
    reference: string;
    label: string;
    status: 'active' | 'redeemed' | 'void';
    mode: 'live' | 'test' | 'issued';
    priceMinor: number;
    buyer: string;
    redeemedBy: string | null;
    redeemedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
  }[];
}

export type MatchGiftCardCodes = {
  batch: string;
  codes: { code: string; link: string; status?: string }[];
};

export interface MatchNightRow {
  day: string;
  sponsor: { name: string; line: string; url: string } | null;
  theme: { title: string; blurb: string; entryMinor: number } | null;
  entries: number;
  entriesMinor: number;
}

export interface MatchVerificationRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  prompt: string;
  photo: string | null;
  submittedAt: string | null;
}

const keys = {
  stats: (days: number) => ['admin', 'match', 'stats', days] as const,
  reports: ['admin', 'match', 'reports'] as const,
  sections: ['admin', 'match', 'sections'] as const,
  revenue: (days: number) => ['admin', 'match', 'revenue', days] as const,
  nights: ['admin', 'match', 'nights'] as const,
  verifications: ['admin', 'match', 'verifications'] as const,
  giftCards: ['admin', 'match', 'giftcards'] as const,
};

export function useMatchGiftCards() {
  return useQuery({
    queryKey: keys.giftCards,
    queryFn: () => request<MatchGiftCardAdmin>('get', '/admin/match/giftcards'),
  });
}

/** Staff: issue a free batch (returns its codes), fetch a batch's codes, or cancel a card. */
export function useMatchGiftCardAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (
      action:
        | { kind: 'issue'; product: string; count: number; batch: string }
        | { kind: 'batch'; batch: string }
        | { kind: 'void'; reference: string },
    ): Promise<MatchGiftCardCodes | unknown> => {
      if (action.kind === 'issue') {
        return request<MatchGiftCardCodes>('post', '/admin/match/giftcards/issue', {
          product: action.product,
          count: action.count,
          batch: action.batch,
        });
      }
      if (action.kind === 'batch') {
        return request<MatchGiftCardCodes>(
          'get',
          `/admin/match/giftcards/batch?batch=${encodeURIComponent(action.batch)}`,
        );
      }
      return request('post', `/admin/match/giftcards/${encodeURIComponent(action.reference)}/void`);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.giftCards });
      void client.invalidateQueries({ queryKey: ['admin', 'match', 'revenue'] });
    },
  });
}

export function useMatchRevenue(days: number) {
  return useQuery({
    queryKey: keys.revenue(days),
    queryFn: () => request<MatchRevenue>('get', `/admin/match/revenue?days=${days}`),
    refetchInterval: 60_000,
  });
}

export function useMatchNights() {
  return useQuery({
    queryKey: keys.nights,
    queryFn: () => request<MatchNightRow[]>('get', '/admin/match/nights'),
  });
}

export function useMatchVerifications() {
  return useQuery({
    queryKey: keys.verifications,
    queryFn: () => request<MatchVerificationRow[]>('get', '/admin/match/verifications'),
  });
}

/** Staff: save or remove a night; approve or decline a selfie. */
export function useMatchMoneyAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (
      action:
        | { kind: 'saveNight'; night: Omit<MatchNightRow, 'entries' | 'entriesMinor'> }
        | { kind: 'removeNight'; day: string }
        | { kind: 'approve'; id: string }
        | { kind: 'decline'; id: string; note?: string; underage?: boolean },
    ) => {
      if (action.kind === 'saveNight') return request('put', '/admin/match/nights', action.night);
      if (action.kind === 'removeNight')
        return request('delete', `/admin/match/nights/${action.day}`);
      if (action.kind === 'approve') {
        return request('post', `/admin/match/verifications/${action.id}/approve`);
      }
      return request('post', `/admin/match/verifications/${action.id}/decline`, {
        note: action.note,
        underage: action.underage,
      });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.nights });
      void client.invalidateQueries({ queryKey: keys.verifications });
      void client.invalidateQueries({ queryKey: ['admin', 'match', 'revenue'] });
    },
  });
}

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
