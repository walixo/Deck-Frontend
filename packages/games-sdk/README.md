# @onedeck/games-sdk

The Deck Games SDK for web games on [Deck](https://onedeck.africa/games): players
signed in with GameID, purchases through Deck checkout, scores and leaderboards,
full screen, and multiplayer rooms — with no server of your own for any of it.

Works with anything that runs in a browser: three.js, Phaser, PixiJS, Babylon.js,
plain canvas.

```bash
npm install @onedeck/games-sdk
```

```ts
import DeckGames from '@onedeck/games-sdk';

const deck = await DeckGames.init();
if (deck.standalone) {
  // Opened outside Deck — run as a plain web game.
} else {
  console.log('Hello', deck.player?.displayName, 'in', deck.mode, 'mode');
}
// …load your assets, then:
DeckGames.ready();
```

No bundler? The same SDK is served as a script tag:

```html
<script src="https://onedeck.africa/sdk/deck-games-v1.js"></script>
```

## How it works

Deck runs your game — hosted on your own domain, over https — in a sandboxed
frame. The SDK talks to the Deck page around it by `postMessage`. Your game never
sees a Deck password, cookie or email address: each player gets a `playerId`
that is stable in your game and different in every other.

Anything you grant — items, coins, unlocks — should be granted by your server,
after Deck's server confirms it. The browser can be edited; Deck's server API and
signed webhooks cannot. See the [docs](https://onedeck.africa/docs/developers).

## Testing locally

Against a local copy of Deck, trust its origin before connecting:

```ts
await DeckGames.init({ origins: ['http://localhost:3000'] });
```

In Deck's developer settings, set a test build URL — even `http://localhost:5173`
— and press **Play in test mode**: purchases are simulated, webhooks are real.

## API

Every call returns a promise. Rejections are `DeckGamesError`s with a `code`:
`standalone`, `timeout`, `signed_out`, `busy`, `conflict`, `bad_request`,
`rate_limited`, `test_mode`.

| Call | Resolves with |
| --- | --- |
| `init(options?)` | `{ standalone, mode, orientation, viewport, player, multiplayer, invite }` |
| `ready()` | — drops Deck's loading screen |
| `session()` | `{ token, playerId, displayName, mode, expiresAt }` — verify `token` on your server |
| `products()` | `Product[]` |
| `purchase(productId)` | `{ reference, status, productId }` |
| `getPurchases()` | `Purchase[]` |
| `submitScore(score)` | `{ best, improved, rank }` — live mode, once every 10s |
| `leaderboard()` | `{ scores, players, you }` |
| `fullscreen(on?)` | `{ active }` — call from a tap or click |
| `on(event, fn)` | an `off()` function |

Events: `pause`, `resume`, `orientation`, `fullscreen`, and the multiplayer
events below. Every one is typed.

## Multiplayer

Switch multiplayer on in your game's developer settings. Rooms, codes, invite
links and quick match are Deck's; your game decides what the messages mean.

```ts
import DeckGames, { type Room } from '@onedeck/games-sdk';

interface Board { cells: number[]; turn: string }

const deck = await DeckGames.init();
const room: Room<Board> = deck.invite
  ? await DeckGames.multiplayer.join<Board>(deck.invite)
  : await DeckGames.multiplayer.quickMatch<Board>();

DeckGames.on('room', (room) => drawLobby(room.players));
DeckGames.on('started', () => beginRound());
DeckGames.on('message', ({ from, data }) => applyMove(from, data));
DeckGames.on('state', ({ state }) => syncBoard(state as Board));

await DeckGames.multiplayer.setReady(true);
// The host, once enough players are ready:
await DeckGames.multiplayer.start();
DeckGames.multiplayer.send({ move: 'e4' }, { to: 'host' });
```

| Call | Notes |
| --- | --- |
| `multiplayer.create({ visibility })` | `'private'` (default) or `'public'` |
| `multiplayer.join(code)` | six characters |
| `multiplayer.quickMatch()` | oldest open public room, or a new one |
| `multiplayer.room()` | the room you are in, or `null` |
| `multiplayer.setReady(ready)` | |
| `multiplayer.start()` | host only |
| `multiplayer.send(data, { to })` | up to 4 KB; `'others'`, `'all'`, `'host'` or a player id |
| `multiplayer.setState(state)` | host only, up to 16 KB |
| `multiplayer.leave()` / `end()` | `end()` is host only |

Messages travel through Deck in real time — fine for turn-based, party and casual
games, not for twitch action. For anything ranked, let your server referee with
the server API: only results your server sends reach the leaderboard.

A complete example to read: [Four in a Row](https://onedeck.africa/docs/developers/sample).

## With three.js

```ts
import * as THREE from 'three';
import DeckGames from '@onedeck/games-sdk';

const deck = await DeckGames.init();
const renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.appendChild(renderer.domElement);

// Deck sizes the frame; follow it.
const fit = () => renderer.setSize(innerWidth, innerHeight);
addEventListener('resize', fit);
fit();

// Stop the loop when Deck hides the game.
let running = true;
DeckGames.on('pause', () => (running = false));
DeckGames.on('resume', () => (running = true));
renderer.setAnimationLoop(() => running && renderer.render(scene, camera));

DeckGames.ready();
```

## License

MIT
