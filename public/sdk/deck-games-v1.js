/*!
 * Deck Games SDK v1 — https://onedeck.africa/docs/developers
 *
 *   <script src="https://onedeck.africa/sdk/deck-games-v1.js"></script>
 *   const deck = await DeckGames.init();
 *
 * Outside Deck, init() resolves with `standalone: true`, so the same build
 * runs anywhere. Testing against a local copy of Deck? Allow its origin:
 *   <script src="…/deck-games-v1.js" data-deck-origins="http://localhost:3000"></script>
 *
 * Also on npm as @onedeck/games-sdk, with TypeScript types. Built from
 * packages/games-sdk in the Deck frontend; edit the source there, not here.
 */
"use strict";
(() => {
  // src/client.ts
  var VERSION = "1.1.0";
  var DEFAULT_ORIGINS = ["https://onedeck.africa", "https://www.onedeck.africa"];
  var HANDSHAKE_MS = 1500;
  var REQUEST_MS = 15 * 60 * 1e3;
  var DeckGamesError = class extends Error {
    constructor(code, message) {
      super(message);
      this.name = "DeckGamesError";
      this.code = code;
    }
  };
  var cleanOrigin = (value) => value.trim().replace(/\/+$/, "");
  function createDeckGames(options = {}) {
    const win = typeof window === "undefined" ? void 0 : window;
    const allowed = [...DEFAULT_ORIGINS];
    let parentOrigin = null;
    const pending = /* @__PURE__ */ new Map();
    const listeners = {};
    let nextId = 1;
    let initPromise = null;
    let lastScoreAt = 0;
    const trust = (origins = []) => {
      for (const origin of origins.map(cleanOrigin).filter(Boolean)) {
        if (!allowed.includes(origin)) allowed.push(origin);
      }
    };
    trust(options.origins);
    const framed = () => {
      if (!win) return false;
      try {
        return Boolean(win.parent) && win.parent !== win;
      } catch (e) {
        return true;
      }
    };
    function send(type, payload, id) {
      if (!win) return;
      const message = { __deck: 1, v: 1, id, type, payload };
      if (parentOrigin) {
        win.parent.postMessage(message, parentOrigin);
        return;
      }
      for (const origin of allowed) {
        try {
          win.parent.postMessage(message, origin);
        } catch (e) {
        }
      }
    }
    function request(type, payload = {}, timeout = REQUEST_MS) {
      return new Promise((resolve, reject) => {
        if (!framed()) {
          reject(new DeckGamesError("standalone", "Not running inside Deck"));
          return;
        }
        const id = `d${nextId++}`;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new DeckGamesError("timeout", "Deck did not answer"));
        }, timeout);
        pending.set(id, {
          resolve: (value) => {
            clearTimeout(timer);
            resolve(value);
          },
          reject: (reason) => {
            clearTimeout(timer);
            reject(reason);
          }
        });
        send(type, payload, id);
      });
    }
    function emit(name, data) {
      var _a;
      for (const fn of ((_a = listeners[name]) != null ? _a : []).slice()) {
        try {
          fn(data);
        } catch (error) {
          setTimeout(() => {
            throw error;
          });
        }
      }
    }
    win == null ? void 0 : win.addEventListener("message", (event) => {
      var _a, _b;
      if (event.source !== win.parent) return;
      if (!allowed.includes(event.origin)) return;
      const data = event.data;
      if (!data || data.__deck !== 1) return;
      parentOrigin = event.origin;
      if (data.type === "response" && data.id && pending.has(data.id)) {
        const entry = pending.get(data.id);
        pending.delete(data.id);
        if (data.ok) entry.resolve(data.data);
        else
          entry.reject(
            new DeckGamesError(((_a = data.error) == null ? void 0 : _a.code) || "error", ((_b = data.error) == null ? void 0 : _b.message) || "Something went wrong")
          );
        return;
      }
      if (data.type === "event" && data.event) emit(data.event, data.data);
    });
    return {
      version: VERSION,
      /** Trust more Deck origins, e.g. a local copy of Deck. Call before `init()`. */
      configure(next) {
        trust(next.origins);
      },
      /**
       * Connects to the Deck player. `player` is set when someone is signed in;
       * `invite` is a room code if the player arrived through an invite link.
       */
      init(next) {
        if (next) trust(next.origins);
        if (initPromise) return initPromise;
        initPromise = request("init", { sdk: VERSION }, HANDSHAKE_MS).catch((reason) => {
          if (reason instanceof DeckGamesError && (reason.code === "timeout" || reason.code === "standalone")) {
            return { standalone: true, mode: null, orientation: null, viewport: null, player: null };
          }
          throw reason;
        });
        return initPromise;
      },
      /** Tell Deck your game has loaded, so the player drops its loading screen. */
      ready() {
        if (framed()) send("ready", {});
      },
      /**
       * A fresh session token for your server to verify. Asks the player to sign
       * in first if they have not (rejects with `signed_out` if they decline).
       */
      session: () => request("session"),
      /** What your game sells, as configured in the developer dashboard. */
      products: () => request("products"),
      /**
       * Buys a product by its id. Grant the item from your server on the
       * `purchase.paid` webhook, not on this promise.
       */
      purchase(productId) {
        if (typeof productId !== "string" || !productId) {
          return Promise.reject(new DeckGamesError("bad_request", "purchase() needs a product id"));
        }
        return request("purchase", { productId });
      },
      /** Everything this player has bought in your game. */
      getPurchases: () => request("getPurchases"),
      /** Posts a score to your game's Deck leaderboard. At most once every 10s, live mode only. */
      submitScore(score) {
        const value = Math.floor(Number(score));
        if (!Number.isFinite(value) || value < 0) {
          return Promise.reject(new DeckGamesError("bad_request", "Scores are whole numbers from 0"));
        }
        const now = Date.now();
        if (now - lastScoreAt < 1e4) {
          return Promise.reject(new DeckGamesError("rate_limited", "One score every 10 seconds"));
        }
        lastScoreAt = now;
        return request("submitScore", { score: value });
      },
      /** The top ten, and this player's own place. */
      leaderboard: () => request("leaderboard"),
      /**
       * Asks the player to go full screen — `fullscreen(false)` to come back, no
       * argument to toggle. Call it from a tap or a click.
       */
      fullscreen: (on) => request("fullscreen", typeof on === "boolean" ? { on } : {}),
      /**
       * Multiplayer through Deck: rooms, matchmaking and live messages. Switch it
       * on in your game's developer settings first.
       */
      multiplayer: {
        /** A new room with you as host. `{ visibility: 'public' }` lets quick match fill it. */
        create: (opts) => request("mp.create", { visibility: opts == null ? void 0 : opts.visibility }),
        /** Joins a room by its six-character code. */
        join: (code) => request("mp.join", { code }),
        /** The oldest open public room with a free seat — or a new one. */
        quickMatch: () => request("mp.quickMatch"),
        /** The room you are in, as last heard, or null. */
        room: () => request("mp.room"),
        setReady: (ready = true) => request("mp.ready", { ready: ready !== false }),
        /** Host only, once the room has its minimum players. */
        start: () => request("mp.start"),
        /** Any JSON up to 4 KB. `to`: `'others'` (default), `'all'`, `'host'`, or a player id. */
        send: (data, opts) => request("mp.send", { data, to: (opts == null ? void 0 : opts.to) || "others" }),
        /** Host only: shared state (up to 16 KB) everyone receives as a `state` event. */
        setState: (state) => request("mp.setState", { state }),
        leave: () => request("mp.leave"),
        /** Host only. Ends the room without results — those come from your server. */
        end: () => request("mp.end")
      },
      /** Listens for an event from the player. Returns a function that stops listening. */
      on(name, fn) {
        var _a;
        const key = name;
        const handler = fn;
        listeners[key] = [...(_a = listeners[key]) != null ? _a : [], handler];
        return () => {
          var _a2;
          listeners[key] = ((_a2 = listeners[key]) != null ? _a2 : []).filter((f) => f !== handler);
        };
      }
    };
  }

  // src/browser.ts
  if (!window.DeckGames) {
    const script = document.currentScript;
    const extra = script && script.getAttribute("data-deck-origins") || "";
    window.DeckGames = createDeckGames({ origins: extra.split(/[\s,]+/) });
  }
})();
