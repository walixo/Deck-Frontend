import { apiUrl, getStoredToken, request } from '@/lib/api';
import type { GameMode, GameRoom } from '@/types';

/**
 * One player's line to one multiplayer room.
 *
 * Commands are ordinary API calls. Events — the room changing, shared state,
 * messages from the other players — arrive down a single long-lived response
 * the server keeps open (server-sent events). It is read with `fetch` rather
 * than `EventSource` because the stream needs the player's token in a header,
 * which `EventSource` cannot send.
 *
 * If the line drops — a phone switching networks, a proxy timing out — it
 * reconnects by itself, backing off a little each time, and the first event
 * on the new line is the whole room again, so nothing is left stale. It stops
 * for good when the room ends or the player leaves.
 */

export type RoomEvent = 'room' | 'message' | 'state' | 'started' | 'ended';

export class RoomConnection {
  private roomId: string | null = null;
  private controller: AbortController | null = null;
  private stopped = false;
  private attempt = 0;
  /** The most recent snapshot, for `room()` without a round trip. */
  room: GameRoom | null = null;

  constructor(
    private readonly slug: string,
    private readonly mode: GameMode,
    private readonly seat: number,
    private readonly onEvent: (event: RoomEvent, data: unknown) => void,
  ) {}

  private body(extra: Record<string, unknown> = {}) {
    return { ...extra, ...(this.seat ? { seat: this.seat } : {}) };
  }

  private path(suffix = '') {
    return `/games/${this.slug}/rooms${suffix}`;
  }

  private adopt(room: GameRoom): GameRoom {
    this.room = room;
    if (room.status !== 'ended' && room.roomId !== this.roomId) this.connect(room.roomId);
    return room;
  }

  /* ---------------------------------------------------------- commands --- */

  async create(visibility: 'private' | 'public' = 'private') {
    return this.adopt(
      await request<GameRoom>('post', this.path(), this.body({ mode: this.mode, visibility })),
    );
  }

  async join(code: string) {
    return this.adopt(
      await request<GameRoom>('post', this.path('/join'), this.body({ mode: this.mode, code })),
    );
  }

  async quickMatch() {
    return this.adopt(
      await request<GameRoom>('post', this.path('/quickmatch'), this.body({ mode: this.mode })),
    );
  }

  private requireRoom(): string {
    if (!this.roomId) throw Object.assign(new Error('Not in a room'), { code: 'no_room' });
    return this.roomId;
  }

  setReady(ready: boolean) {
    return request<GameRoom>(
      'post',
      this.path(`/${this.requireRoom()}/ready`),
      this.body({ ready }),
    );
  }

  start() {
    return request<GameRoom>('post', this.path(`/${this.requireRoom()}/start`), this.body());
  }

  send(data: unknown, to: string = 'others') {
    return request<{ delivered: number }>(
      'post',
      this.path(`/${this.requireRoom()}/messages`),
      this.body({ data, to }),
    );
  }

  setState(state: unknown) {
    return request<GameRoom>(
      'post',
      this.path(`/${this.requireRoom()}/state`),
      this.body({ state }),
    );
  }

  async leave() {
    const roomId = this.requireRoom();
    this.disconnect();
    this.room = null;
    return request<{ left: boolean }>('post', this.path(`/${roomId}/leave`), this.body());
  }

  end() {
    return request<GameRoom>('post', this.path(`/${this.requireRoom()}/end`), this.body());
  }

  /* ------------------------------------------------------------ stream --- */

  private connect(roomId: string) {
    this.disconnect();
    this.roomId = roomId;
    this.stopped = false;
    this.attempt = 0;
    void this.run();
  }

  /** Stops listening without leaving the room — the page is going away. */
  disconnect() {
    this.stopped = true;
    this.controller?.abort();
    this.controller = null;
  }

  private async run(): Promise<void> {
    while (!this.stopped && this.roomId) {
      const controller = new AbortController();
      this.controller = controller;
      try {
        const token = getStoredToken();
        const query = this.seat ? `?seat=${this.seat}` : '';
        const response = await fetch(apiUrl(`${this.path(`/${this.roomId}/stream`)}${query}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        /* The room is gone or we are not in it: nothing to reconnect to. */
        if (response.status === 403 || response.status === 404 || response.status === 409) {
          this.stopped = true;
          return;
        }
        if (!response.ok || !response.body) throw new Error(`Stream answered ${response.status}`);
        this.attempt = 0;
        await this.read(response.body);
      } catch {
        if (this.stopped) return;
      }
      if (this.stopped) return;
      /* 1s, 2s, 4s, then every 8s. */
      const wait = Math.min(8000, 1000 * 2 ** this.attempt);
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
        const event = /^event: (.*)$/m.exec(chunk)?.[1] as RoomEvent | undefined;
        const raw = /^data: (.*)$/m.exec(chunk)?.[1];
        if (!event || raw === undefined) continue;
        let data: unknown;
        try {
          data = JSON.parse(raw);
        } catch {
          continue;
        }
        if (event === 'room' || event === 'started' || event === 'ended')
          this.room = data as GameRoom;
        this.onEvent(event, data);
        if (event === 'ended') {
          this.stopped = true;
          return;
        }
      }
    }
  }
}
