import { api, apiUrl, getStoredToken, request } from '@/lib/api';

/**
 * Match's line to Deck: plain calls for what a person does, and one live
 * stream for everything Deck tells them — counts, their place in line, a
 * match, the other browser's call set-up, the clock, a reveal.
 *
 * The stream is read with `fetch` (it needs the token in a header) and
 * reconnects by itself, backing off a little each time; the server gives a
 * dropped line ten seconds to come back before taking someone out of their
 * line or call, and the first event on a new line is a full `hello`.
 */

export type Gender = 'male' | 'female';

/** Where two people carry on after a call: usernames without the @. */
export interface MatchHandles {
  x: string;
  instagram: string;
}

export interface MatchProfile extends MatchHandles {
  gender: Gender;
  bannedUntil: string | null;
  /** Asked staff to switch section; waiting on them. */
  sectionRequested: boolean;
  /** This account gets "someone's free" pings on some device. */
  pings: boolean;
  /** Prepaid Match credit, kobo. */
  creditMinor: number;
  /** Match+ runs until then; null when not a member. */
  plusUntil: string | null;
  verified: boolean;
}

/** One evening's sponsor and/or paid theme, set by Deck. */
export interface MatchNight {
  day: string;
  sponsor: { name: string; line: string; url: string } | null;
  theme: { title: string; blurb: string; entryMinor: number } | null;
}

export type MatchGift = 'rose' | 'drink';

export interface MatchWallet {
  creditMinor: number;
  currency: string;
  plusUntil: string | null;
  verified: boolean;
  verification: {
    status: 'draft' | 'pending' | 'approved' | 'declined';
    prompt: string;
    note: string;
  } | null;
  tonight: (MatchNight & { entered: boolean }) | null;
  prices: {
    minute: number;
    gift: Record<MatchGift, number>;
    badge: number;
    plus: number;
    plusDays: number;
  };
  packs: number[];
  /** False only where payments are switched off. */
  payments: boolean;
  ledger: { kind: string; amountMinor: number; note: string; at: string }[];
}

/** Someone you swapped usernames with. */
export interface MatchMatch {
  callId: string;
  handles: MatchHandles;
  verified: boolean;
  gifts: { gift: MatchGift; mine: boolean }[];
  at: string;
}

export interface MatchHours {
  open: boolean;
  /** While open, when tonight opened; while closed, when it next opens (epoch ms). */
  opensAt: number;
  closesAt: number;
}

/**
 * What Match tells everyone: the hours, whether anyone is on each side, and
 * the numbers only once there are enough of them (`live`, else null).
 */
export interface Online {
  hours: MatchHours;
  live: { total: number; male: number; female: number } | null;
  available: Record<Gender, boolean>;
  /** The Web Push key, when pings are switched on server-side. */
  pushKey: string | null;
  /** The Match+ hour after closing: members only. */
  late: { open: boolean; closesAt: number };
  /** Tonight's sponsor and theme, if Deck set any. */
  tonight: MatchNight | null;
}

export type MatchEvent =
  | 'hello'
  | 'online'
  | 'queue'
  | 'matched'
  | 'signal'
  | 'started'
  | 'extend'
  | 'extended'
  | 'ended'
  | 'revealed'
  | 'closed'
  | 'gift'
  | 'banned';

export const matchApi = {
  online: () => request<Online>('get', '/match/online'),
  me: () => request<MatchProfile | null>('get', '/match/me'),
  create: (input: MatchHandles & { gender: Gender; adult: true }) =>
    request<MatchProfile>('post', '/match/me', input),
  setHandles: (handles: MatchHandles) => request<MatchProfile>('patch', '/match/me', handles),
  matches: () => request<MatchMatch[]>('get', '/match/matches'),
  queue: () => request<{ position: number }>('post', '/match/queue'),
  unqueue: () => request<{ left: boolean }>('delete', '/match/queue'),
  signal: (callId: string, data: Record<string, unknown>) =>
    request('post', `/match/calls/${callId}/signal`, { data }),
  connected: (callId: string) => request('post', `/match/calls/${callId}/connected`),
  leave: (callId: string) => request('post', `/match/calls/${callId}/leave`),
  share: (callId: string) => request<{ revealed: boolean }>('post', `/match/calls/${callId}/share`),
  report: (callId: string, reason: string) =>
    request('post', `/match/calls/${callId}/report`, { reason }),
  extend: (callId: string) => request<{ agreed: boolean }>('post', `/match/calls/${callId}/extend`),
  gift: (callId: string, gift: MatchGift) =>
    request<{ gift: MatchGift; creditMinor: number }>('post', `/match/calls/${callId}/gift`, {
      gift,
    }),
  wallet: () => request<MatchWallet>('get', '/match/wallet'),
  topup: (amountMinor: number) =>
    request<{
      reference: string;
      status: string;
      checkoutUrl?: string;
      test?: boolean;
      creditMinor?: number;
    }>('post', '/match/wallet/topups', { amountMinor }),
  verifyTopup: (reference: string) =>
    request<{ status: 'pending' | 'paid' | 'failed'; amountMinor: number; creditMinor: number }>(
      'post',
      `/match/wallet/topups/${encodeURIComponent(reference)}/verify`,
    ),
  buyPlus: () => request<{ plusUntil: string; creditMinor: number }>('post', '/match/plus'),
  joinNight: () => request<{ entered: boolean; creditMinor: number }>('post', '/match/night/entry'),
  startVerification: () => request<{ prompt: string }>('post', '/match/verification/start'),
  submitVerification: (photo: string) =>
    request<{ status: string; creditMinor: number }>('post', '/match/verification', { photo }),
  requestSection: (note: string) =>
    request<MatchProfile>('post', '/match/me/section-request', { note }),
  subscribe: (subscription: PushSubscriptionJSON) =>
    request<{ pings: boolean }>('post', '/match/push', subscription),
  unsubscribe: (endpoint?: string) =>
    request<{ pings: boolean }>('delete', '/match/push', endpoint ? { endpoint } : {}),
};

/**
 * Where "Continue with Google" goes. The flow starts on Deck's main site,
 * because that is where Google returns and where the flow's cookie lives; it
 * comes back here with `return`.
 */
export function googleSignInUrl(): string {
  const main = window.location.origin.replace('//match.', '//');
  const base = (api.defaults.baseURL ?? '/api').replace(/^\//, `${main}/`);
  return `${base}/auth/oauth/google/start?return=${encodeURIComponent(window.location.origin)}`;
}

export class MatchLine {
  private controller: AbortController | null = null;
  private stopped = false;
  private attempt = 0;

  constructor(
    private readonly onEvent: (event: MatchEvent, data: unknown) => void,
    /** The stream was refused (signed out, not set up, paused): stop trying. */
    private readonly onRefused: (status: number) => void,
  ) {}

  start() {
    this.stopped = false;
    void this.run();
  }

  stop() {
    this.stopped = true;
    this.controller?.abort();
  }

  private async run(): Promise<void> {
    while (!this.stopped) {
      const controller = new AbortController();
      this.controller = controller;
      try {
        const token = getStoredToken();
        const response = await fetch(apiUrl('/match/stream'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        if (response.status >= 400 && response.status < 500) {
          this.stopped = true;
          this.onRefused(response.status);
          return;
        }
        if (!response.ok || !response.body) throw new Error(`Stream answered ${response.status}`);
        this.attempt = 0;
        await this.read(response.body);
      } catch {
        if (this.stopped) return;
      }
      if (this.stopped) return;
      /* 0.5s, 1s, 2s, then every 4s — inside the server's ten-second grace. */
      const wait = Math.min(4000, 500 * 2 ** this.attempt);
      this.attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }

  private async read(body: ReadableStream<Uint8Array>) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        const chunk = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf('\n\n');
        const event = /^event: (.*)$/m.exec(chunk)?.[1] as MatchEvent | undefined;
        const raw = /^data: (.*)$/m.exec(chunk)?.[1];
        if (!event || raw === undefined) continue;
        try {
          this.onEvent(event, JSON.parse(raw));
        } catch {
          /* A malformed event is skipped, not fatal. */
        }
      }
    }
  }
}
