/**
 * The shapes the Deck player hands your game. Each matches what the player
 * sends today (see the developer docs); fields are only ever added.
 */

export type GameMode = 'test' | 'live';
export type Orientation = 'portrait' | 'landscape' | 'both';

export interface Viewport {
  width: number;
  height: number;
}

/** A player as your game sees them: a per-game id, never a Deck account. */
export interface Player {
  /** Random, stable for this player in your game, different in every other. `t_` in test mode. */
  playerId: string;
  displayName: string;
}

export interface InitResult {
  /** True when the game was opened outside Deck. Everything else is then null. */
  standalone: boolean;
  mode: GameMode | null;
  orientation: Orientation | null;
  viewport: Viewport | null;
  /** The signed-in player, or null when nobody is signed in. */
  player: Player | null;
  /** Set when multiplayer is switched on for your game. */
  multiplayer?: { minPlayers: number; maxPlayers: number } | null;
  /** A room code, when the player arrived through an invite link. Pass it to `multiplayer.join()`. */
  invite?: string | null;
}

/** A 15-minute token for your server to verify with `POST /api/games/v1/session/verify`. */
export interface Session {
  token: string;
  playerId: string;
  displayName: string;
  mode: GameMode;
  expiresAt: string;
}

export interface Product {
  productId: string;
  name: string;
  description: string;
  /** In the currency's minor unit: kobo for NGN. */
  priceMinor: number;
  currency: string;
  type: 'one_off' | 'consumable';
}

export interface PurchaseResult {
  reference: string;
  /** A hint for your UI. Grant the item when your server receives `purchase.paid`. */
  status: 'paid' | 'cancelled' | 'pending';
  productId: string;
}

export interface Purchase {
  reference: string;
  status: 'pending' | 'paid' | 'failed';
  mode: GameMode;
  productId: string;
  productName: string;
  productType: 'one_off' | 'consumable';
  playerId: string;
  priceMinor: number;
  currency: string;
  paidAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface ScoreResult {
  best: number;
  improved: boolean;
  rank: number;
}

export interface Leaderboard {
  scores: {
    id: string;
    rank: number;
    score: number;
    achievedAt: string;
    player: { name: string; username: string; avatarUrl?: string } | null;
  }[];
  /** Everyone who has ever posted a score. */
  players: number;
  /** This player's own standing, if they have one. */
  you: { rank: number; score: number } | null;
}

export type RoomStatus = 'open' | 'playing' | 'ended';

export interface RoomPlayer {
  playerId: string;
  displayName: string;
  ready: boolean;
  /** Has the game open right now. */
  online: boolean;
  host: boolean;
}

/** A multiplayer room. `TState` is whatever your game keeps in `setState()`. */
export interface Room<TState = unknown> {
  roomId: string;
  /** Six characters to share. */
  code: string;
  mode: GameMode;
  visibility: 'private' | 'public';
  status: RoomStatus;
  hostPlayerId: string;
  minPlayers: number;
  maxPlayers: number;
  players: RoomPlayer[];
  state: TState | null;
  /** Ranked results, only ever sent by your server. */
  results: { playerId: string; rank: number; score: number | null }[];
  startedAt: string | null;
  endedAt: string | null;
}

export type MessageTarget = 'others' | 'all' | 'host' | (string & {});

/** Everything `DeckGames.on()` can listen for, and what each one carries. */
export interface DeckEvents {
  /** The tab or the player was hidden: stop the clock. */
  pause: undefined;
  resume: undefined;
  /** The device turned or the frame resized. */
  orientation: { orientation: Orientation; viewport: Viewport };
  fullscreen: { active: boolean };
  /** Someone joined, left or readied, or the host changed. */
  room: Room;
  started: Room;
  state: { state: unknown; from: string };
  /** `from` is a player id, or `server` when your server sent it. */
  message: { from: string; data: unknown; at: number };
  ended: Room;
}

export type DeckEventName = keyof DeckEvents;

export type DeckErrorCode =
  | 'standalone'
  | 'timeout'
  | 'signed_out'
  | 'busy'
  | 'conflict'
  | 'bad_request'
  | 'rate_limited'
  | 'test_mode'
  | 'unknown'
  | 'error'
  | (string & {});

export interface DeckGamesOptions {
  /**
   * Extra Deck origins to trust, on top of onedeck.africa — for testing
   * against a local copy of Deck, e.g. `['http://localhost:3000']`.
   */
  origins?: string[];
}
