import type {
  DeckErrorCode,
  DeckEventName,
  DeckEvents,
  DeckGamesOptions,
  InitResult,
  Leaderboard,
  MessageTarget,
  Product,
  Purchase,
  PurchaseResult,
  Room,
  ScoreResult,
  Session,
} from './types.js';

/**
 * The Deck Games SDK: talks to the Deck player your game runs inside, by
 * postMessage. It never holds a Deck password or cookie — the player does the
 * signed-in work and hands your game only what it asked for.
 *
 * Outside Deck (opening your game's URL directly) `init()` resolves with
 * `standalone: true` after a short wait, so the same build runs anywhere.
 *
 * This file is the one source for both builds: the npm package, and the
 * script Deck serves at /sdk/deck-games-v1.js.
 */

export const VERSION = '1.1.0';
const DEFAULT_ORIGINS = ['https://onedeck.africa', 'https://www.onedeck.africa'];
const HANDSHAKE_MS = 1500;
const REQUEST_MS = 15 * 60 * 1000; /* a checkout can take a while */

/** Every rejection carries a `code` — `standalone`, `signed_out`, `busy`, … */
export class DeckGamesError extends Error {
  code: DeckErrorCode;
  constructor(code: DeckErrorCode, message: string) {
    super(message);
    this.name = 'DeckGamesError';
    this.code = code;
  }
}

interface Pending {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

const cleanOrigin = (value: string) => value.trim().replace(/\/+$/, '');

export function createDeckGames(options: DeckGamesOptions = {}) {
  const win: Window | undefined = typeof window === 'undefined' ? undefined : window;
  const allowed = [...DEFAULT_ORIGINS];
  let parentOrigin: string | null = null; /* learnt from the first verified message */
  const pending = new Map<string, Pending>();
  const listeners: Partial<Record<DeckEventName, ((data: unknown) => void)[]>> = {};
  let nextId = 1;
  let initPromise: Promise<InitResult> | null = null;
  let lastScoreAt = 0;

  const trust = (origins: string[] = []) => {
    for (const origin of origins.map(cleanOrigin).filter(Boolean)) {
      if (!allowed.includes(origin)) allowed.push(origin);
    }
  };
  trust(options.origins);

  const framed = () => {
    if (!win) return false;
    try {
      return Boolean(win.parent) && win.parent !== win;
    } catch {
      return true;
    }
  };

  function send(type: string, payload: object, id?: string) {
    if (!win) return;
    const message = { __deck: 1, v: 1, id, type, payload };
    if (parentOrigin) {
      win.parent.postMessage(message, parentOrigin);
      return;
    }
    /* Not yet known: address every allowed origin. postMessage drops a message
       whose target origin does not match, so only the real parent receives it. */
    for (const origin of allowed) {
      try {
        win.parent.postMessage(message, origin);
      } catch {
        /* An origin string the browser refuses — skip it. */
      }
    }
  }

  function request<T>(type: string, payload: object = {}, timeout = REQUEST_MS): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!framed()) {
        reject(new DeckGamesError('standalone', 'Not running inside Deck'));
        return;
      }
      const id = `d${nextId++}`;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new DeckGamesError('timeout', 'Deck did not answer'));
      }, timeout);
      pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value as T);
        },
        reject: (reason) => {
          clearTimeout(timer);
          reject(reason);
        },
      });
      send(type, payload, id);
    });
  }

  function emit<K extends DeckEventName>(name: K, data: DeckEvents[K]) {
    for (const fn of (listeners[name] ?? []).slice()) {
      try {
        fn(data);
      } catch (error) {
        setTimeout(() => {
          throw error;
        });
      }
    }
  }

  win?.addEventListener('message', (event: MessageEvent) => {
    /* Only the window we are framed by, and only from an origin we trust. */
    if (event.source !== win.parent) return;
    if (!allowed.includes(event.origin)) return;
    const data = event.data;
    if (!data || data.__deck !== 1) return;

    parentOrigin = event.origin;

    if (data.type === 'response' && data.id && pending.has(data.id)) {
      const entry = pending.get(data.id)!;
      pending.delete(data.id);
      if (data.ok) entry.resolve(data.data);
      else
        entry.reject(
          new DeckGamesError(data.error?.code || 'error', data.error?.message || 'Something went wrong'),
        );
      return;
    }

    if (data.type === 'event' && data.event) emit(data.event, data.data);
  });

  return {
    version: VERSION,

    /** Trust more Deck origins, e.g. a local copy of Deck. Call before `init()`. */
    configure(next: DeckGamesOptions) {
      trust(next.origins);
    },

    /**
     * Connects to the Deck player. `player` is set when someone is signed in;
     * `invite` is a room code if the player arrived through an invite link.
     */
    init(next?: DeckGamesOptions): Promise<InitResult> {
      if (next) trust(next.origins);
      if (initPromise) return initPromise;
      initPromise = request<InitResult>('init', { sdk: VERSION }, HANDSHAKE_MS).catch((reason) => {
        if (reason instanceof DeckGamesError && (reason.code === 'timeout' || reason.code === 'standalone')) {
          return { standalone: true, mode: null, orientation: null, viewport: null, player: null };
        }
        throw reason;
      });
      return initPromise;
    },

    /** Tell Deck your game has loaded, so the player drops its loading screen. */
    ready() {
      if (framed()) send('ready', {});
    },

    /**
     * A fresh session token for your server to verify. Asks the player to sign
     * in first if they have not (rejects with `signed_out` if they decline).
     */
    session: () => request<Session>('session'),

    /** What your game sells, as configured in the developer dashboard. */
    products: () => request<Product[]>('products'),

    /**
     * Buys a product by its id. Grant the item from your server on the
     * `purchase.paid` webhook, not on this promise.
     */
    purchase(productId: string) {
      if (typeof productId !== 'string' || !productId) {
        return Promise.reject(new DeckGamesError('bad_request', 'purchase() needs a product id'));
      }
      return request<PurchaseResult>('purchase', { productId });
    },

    /** Everything this player has bought in your game. */
    getPurchases: () => request<Purchase[]>('getPurchases'),

    /** Posts a score to your game's Deck leaderboard. At most once every 10s, live mode only. */
    submitScore(score: number) {
      const value = Math.floor(Number(score));
      if (!Number.isFinite(value) || value < 0) {
        return Promise.reject(new DeckGamesError('bad_request', 'Scores are whole numbers from 0'));
      }
      const now = Date.now();
      if (now - lastScoreAt < 10000) {
        return Promise.reject(new DeckGamesError('rate_limited', 'One score every 10 seconds'));
      }
      lastScoreAt = now;
      return request<ScoreResult>('submitScore', { score: value });
    },

    /** The top ten, and this player's own place. */
    leaderboard: () => request<Leaderboard>('leaderboard'),

    /**
     * Asks the player to go full screen — `fullscreen(false)` to come back, no
     * argument to toggle. Call it from a tap or a click.
     */
    fullscreen: (on?: boolean) =>
      request<{ active: boolean }>('fullscreen', typeof on === 'boolean' ? { on } : {}),

    /**
     * Multiplayer through Deck: rooms, matchmaking and live messages. Switch it
     * on in your game's developer settings first.
     */
    multiplayer: {
      /** A new room with you as host. `{ visibility: 'public' }` lets quick match fill it. */
      create: <TState = unknown>(opts?: { visibility?: 'private' | 'public' }) =>
        request<Room<TState>>('mp.create', { visibility: opts?.visibility }),
      /** Joins a room by its six-character code. */
      join: <TState = unknown>(code: string) => request<Room<TState>>('mp.join', { code }),
      /** The oldest open public room with a free seat — or a new one. */
      quickMatch: <TState = unknown>() => request<Room<TState>>('mp.quickMatch'),
      /** The room you are in, as last heard, or null. */
      room: <TState = unknown>() => request<Room<TState> | null>('mp.room'),
      setReady: (ready = true) => request<Room>('mp.ready', { ready: ready !== false }),
      /** Host only, once the room has its minimum players. */
      start: () => request<Room>('mp.start'),
      /** Any JSON up to 4 KB. `to`: `'others'` (default), `'all'`, `'host'`, or a player id. */
      send: (data: unknown, opts?: { to?: MessageTarget }) =>
        request<{ delivered: number }>('mp.send', { data, to: opts?.to || 'others' }),
      /** Host only: shared state (up to 16 KB) everyone receives as a `state` event. */
      setState: <TState = unknown>(state: TState) => request<Room<TState>>('mp.setState', { state }),
      leave: () => request<{ left: boolean }>('mp.leave'),
      /** Host only. Ends the room without results — those come from your server. */
      end: () => request<Room>('mp.end'),
    },

    /** Listens for an event from the player. Returns a function that stops listening. */
    on<K extends DeckEventName>(name: K, fn: (data: DeckEvents[K]) => void): () => void {
      const key: DeckEventName = name;
      const handler = fn as (data: unknown) => void;
      listeners[key] = [...(listeners[key] ?? []), handler];
      return () => {
        listeners[key] = (listeners[key] ?? []).filter((f) => f !== handler);
      };
    },
  };
}

export type DeckGamesClient = ReturnType<typeof createDeckGames>;
