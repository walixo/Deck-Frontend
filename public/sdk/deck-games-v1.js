/*!
 * Deck Games SDK v1
 * https://onedeck.africa/games/developers/docs
 *
 * Talks to the Deck player your game is running inside, by postMessage. It
 * never holds a Deck password or cookie: the player does the signed-in work
 * and hands your game only what it asked for.
 *
 *   <script src="https://onedeck.africa/sdk/deck-games-v1.js"></script>
 *   const deck = await DeckGames.init();
 *
 * Outside Deck (opening your game's URL directly) `init()` resolves with
 * `standalone: true` after a short wait, so the same build runs anywhere.
 *
 * Testing against a local copy of Deck? Allow its origin on the script tag:
 *   <script src="…/deck-games-v1.js" data-deck-origins="http://localhost:3000"></script>
 */
(function (global) {
  'use strict';

  if (global.DeckGames) return;

  var VERSION = '1.0.0';
  var DEFAULT_ORIGINS = ['https://onedeck.africa', 'https://www.onedeck.africa'];
  var HANDSHAKE_MS = 1500;
  var REQUEST_MS = 15 * 60 * 1000; /* a checkout can take a while */

  var script = document.currentScript;
  var extra = (script && script.getAttribute('data-deck-origins')) || '';
  var allowed = DEFAULT_ORIGINS.concat(
    extra
      .split(/[\s,]+/)
      .map(function (value) {
        return value.trim().replace(/\/+$/, '');
      })
      .filter(Boolean),
  );

  var parentOrigin = null; /* learnt from the first verified message */
  var pending = {};
  var listeners = {};
  var nextId = 1;
  var initPromise = null;
  var lastScoreAt = 0;

  function framed() {
    try {
      return global.parent && global.parent !== global;
    } catch (_) {
      return true;
    }
  }

  function send(type, payload, id) {
    var message = { __deck: 1, v: 1, id: id, type: type, payload: payload || {} };
    if (parentOrigin) {
      global.parent.postMessage(message, parentOrigin);
      return;
    }
    /* Not yet known: address every allowed origin. postMessage drops a message
       whose target origin does not match, so only the real parent receives it. */
    for (var i = 0; i < allowed.length; i += 1) {
      try {
        global.parent.postMessage(message, allowed[i]);
      } catch (_) {
        /* An origin string the browser refuses — skip it. */
      }
    }
  }

  function request(type, payload, timeout) {
    return new Promise(function (resolve, reject) {
      if (!framed()) {
        reject(error('standalone', 'Not running inside Deck'));
        return;
      }
      var id = 'd' + nextId++;
      var timer = setTimeout(function () {
        delete pending[id];
        reject(error('timeout', 'Deck did not answer'));
      }, timeout || REQUEST_MS);
      pending[id] = {
        resolve: function (value) {
          clearTimeout(timer);
          resolve(value);
        },
        reject: function (reason) {
          clearTimeout(timer);
          reject(reason);
        },
      };
      send(type, payload, id);
    });
  }

  function error(code, message) {
    var err = new Error(message);
    err.code = code;
    return err;
  }

  function emit(name, data) {
    (listeners[name] || []).slice().forEach(function (fn) {
      try {
        fn(data);
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    });
  }

  global.addEventListener('message', function (event) {
    /* Only the window we are framed by, and only from an origin we trust. */
    if (event.source !== global.parent) return;
    if (allowed.indexOf(event.origin) === -1) return;
    var data = event.data;
    if (!data || data.__deck !== 1) return;

    parentOrigin = event.origin;

    if (data.type === 'response' && data.id && pending[data.id]) {
      var entry = pending[data.id];
      delete pending[data.id];
      if (data.ok) entry.resolve(data.data);
      else
        entry.reject(
          error(
            (data.error && data.error.code) || 'error',
            (data.error && data.error.message) || 'Something went wrong',
          ),
        );
      return;
    }

    if (data.type === 'event' && data.event) emit(data.event, data.data);
  });

  var DeckGames = {
    version: VERSION,

    /**
     * Connects to the Deck player. Resolves with
     * `{ standalone, mode, orientation, viewport, player }` — `player` is
     * `{ playerId, displayName }` when someone is signed in, otherwise null.
     */
    init: function () {
      if (initPromise) return initPromise;
      initPromise = request('init', { sdk: VERSION }, HANDSHAKE_MS).catch(function (reason) {
        if (reason && (reason.code === 'timeout' || reason.code === 'standalone')) {
          return { standalone: true, mode: null, orientation: null, viewport: null, player: null };
        }
        throw reason;
      });
      return initPromise;
    },

    /** Tell Deck your game has loaded, so the player drops its loading screen. */
    ready: function () {
      if (framed()) send('ready', {});
    },

    /**
     * A fresh session token for your server to verify with
     * `POST /api/games/v1/session/verify`. Asks the player to sign in first if
     * they have not (rejects with code `signed_out` if they decline).
     */
    session: function () {
      return request('session', {});
    },

    /** What your game sells, as configured in the developer dashboard. */
    products: function () {
      return request('products', {});
    },

    /**
     * Buys a product by its id. Resolves with `{ reference, status, productId }`
     * — `status` is `paid` or `cancelled`. Grant the item from your server on
     * the `purchase.paid` webhook, not on this promise.
     */
    purchase: function (productId) {
      if (typeof productId !== 'string' || !productId) {
        return Promise.reject(error('bad_request', 'purchase() needs a product id'));
      }
      return request('purchase', { productId: productId });
    },

    /** Everything this player has bought in your game. */
    getPurchases: function () {
      return request('getPurchases', {});
    },

    /** Posts a score to your game's Deck leaderboard. At most once every 10s. */
    submitScore: function (score) {
      var value = Math.floor(Number(score));
      if (!isFinite(value) || value < 0) {
        return Promise.reject(error('bad_request', 'Scores are whole numbers from 0'));
      }
      var now = Date.now();
      if (now - lastScoreAt < 10000) {
        return Promise.reject(error('rate_limited', 'One score every 10 seconds'));
      }
      lastScoreAt = now;
      return request('submitScore', { score: value });
    },

    /** The top ten, and this player's own place. */
    leaderboard: function () {
      return request('leaderboard', {});
    },

    /**
     * Events from the player: `pause` and `resume` (the tab or the player was
     * hidden), `orientation` (`{ orientation, viewport }` on rotate/resize).
     */
    on: function (name, fn) {
      (listeners[name] = listeners[name] || []).push(fn);
      return function off() {
        listeners[name] = (listeners[name] || []).filter(function (f) {
          return f !== fn;
        });
      };
    },
  };

  global.DeckGames = DeckGames;
})(typeof window !== 'undefined' ? window : this);
