import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * `/games/developers/docs` — everything a developer needs, on one page.
 *
 * Written against what the platform actually does: every call, field and
 * header here exists in the code, and nothing is described that is not built.
 * A sticky contents column on wide screens; on a phone it is one long read.
 */
const SECTIONS = [
  ['overview', 'How it works'],
  ['quick-start', 'Quick start'],
  ['orientation', 'Portrait & landscape'],
  ['sdk', 'SDK reference'],
  ['server', 'Server API'],
  ['webhooks', 'Webhooks'],
  ['test-mode', 'Test mode'],
  ['money', 'Money & payouts'],
  ['review', 'Review & rules'],
] as const;

export function DevDocs() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-28 pt-24 sm:px-6 sm:pt-28">
      <title>Developer docs — Deck Games</title>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-ember-ink">
        Developer docs
      </p>
      <h1 className="mt-4 max-w-3xl text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[0.95] tracking-[-0.055em] text-balance">
        Build for Deck Games
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-g-mute">
        Host your web game anywhere, add one script, and Deck brings the players, sign-in, store,
        leaderboards and payouts. You keep 80% of every sale.
      </p>

      <div className="mt-14 grid gap-14 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ol className="sticky top-24 space-y-2.5 border-l border-g-line pl-4 text-[13px]">
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-g-mute transition-colors hover:text-g-ink">
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0 max-w-3xl space-y-20">
          <Section id="overview" title="How it works">
            <P>
              Your game is a web page you host, on your own domain, over https. Deck shows it inside
              the Deck Games player — a sandboxed iframe sized for your game’s orientation — and
              gives it a small JavaScript SDK that talks to the player by <Code>postMessage</Code>.
            </P>
            <P>
              The player does everything that needs a Deck account: signing the player in, opening
              checkout, posting scores. Your game never sees a Deck password, cookie or email
              address. Each player gets a <strong>player ID</strong> that is random, stable for them
              in your game, and different in every other game.
            </P>
            <P>
              Anything you grant — items, coins, unlocks — should be granted by <em>your server</em>
              , after Deck’s server confirms it. The browser can be edited; Deck’s server API and
              signed webhooks cannot.
            </P>
            <Diagram />
          </Section>

          <Section id="quick-start" title="Quick start">
            <Steps
              items={[
                <>
                  <Link to="/games/developers/new" className="underline underline-offset-4">
                    Register your game
                  </Link>{' '}
                  with its live URL, orientation and genre. Nobody sees it until it’s reviewed.
                </>,
                <>Add the SDK to your game’s page and connect on load:</>,
              ]}
            />
            <Pre>{`<script src="https://onedeck.africa/sdk/deck-games-v1.js"></script>
<script>
  const deck = await DeckGames.init();
  if (deck.standalone) {
    // Opened outside Deck — run as a plain web game.
  } else {
    console.log('Hello', deck.player?.displayName, 'in', deck.mode, 'mode');
  }
  // …load your assets, then:
  DeckGames.ready();
</script>`}</Pre>
            <Steps
              start={3}
              items={[
                <>
                  In your game’s developer page, create a <strong>test key</strong> and a{' '}
                  <strong>webhook</strong>, and add a product if you sell anything.
                </>,
                <>
                  Press <strong>Play in test mode</strong>. Buy something — nothing is charged — and
                  watch the webhook arrive at your server.
                </>,
                <>
                  When it all works, it’s already submitted: Deck reviews it, and once approved your
                  live key and the live store switch on.
                </>,
              ]}
            />
          </Section>

          <Section id="orientation" title="Portrait & landscape">
            <P>Choose one when you register; change it any time in Settings.</P>
            <Table
              head={['Orientation', 'Desktop', 'Phone']}
              rows={[
                [
                  'Portrait',
                  'A 9:16 column, as tall as the screen allows',
                  'Fills the screen held upright; asks to be turned if held sideways',
                ],
                [
                  'Landscape',
                  'A 16:9 band, as wide as the page',
                  'Asks to be turned sideways; full screen locks to landscape where the browser allows',
                ],
                ['Either way', 'Fills the stage', 'Fills the screen whichever way it is held'],
              ]}
            />
            <P>
              Design for the frame, not the window: size to <Code>window.innerWidth</Code> and{' '}
              <Code>innerHeight</Code> inside your page and listen for resize. The SDK also sends an{' '}
              <Code>orientation</Code> event when the device turns. Players can always choose “play
              anyway”, so a portrait game should not break if it is briefly given a wide frame.
            </P>
            <P>
              Full screen is offered by the player. Your game may also request it itself — the frame
              allows <Code>fullscreen</Code>, <Code>gamepad</Code>, <Code>autoplay</Code> and motion
              sensors.
            </P>
          </Section>

          <Section id="sdk" title="SDK reference">
            <P>
              Every method returns a promise. Errors carry a <Code>code</Code>.
            </P>
            <Api
              name="DeckGames.init()"
              returns="{ standalone, mode, orientation, viewport, player }"
            >
              Connects to the player. Outside Deck it resolves after about 1.5 seconds with{' '}
              <Code>standalone: true</Code>. <Code>player</Code> is{' '}
              <Code>{'{ playerId, displayName }'}</Code> if someone is signed in, otherwise{' '}
              <Code>null</Code>. <Code>mode</Code> is <Code>test</Code> or <Code>live</Code>.
            </Api>
            <Api name="DeckGames.ready()" returns="—">
              Tells the player your game has loaded so it can drop the loading screen. If you never
              call it, the player lifts the curtain after a few seconds anyway.
            </Api>
            <Api
              name="DeckGames.session()"
              returns="{ token, playerId, displayName, mode, expiresAt }"
            >
              A fresh 15-minute session token. Send it to your server and verify it there (below).
              If the player is signed out, Deck asks them to sign in and this rejects with{' '}
              <Code>signed_out</Code>.
            </Api>
            <Api name="DeckGames.products()" returns="Product[]">
              Your active products: <Code>productId</Code>, <Code>name</Code>,{' '}
              <Code>description</Code>, <Code>priceMinor</Code>, <Code>currency</Code>,{' '}
              <Code>type</Code> (<Code>one_off</Code> or <Code>consumable</Code>).
            </Api>
            <Api name="DeckGames.purchase(productId)" returns="{ reference, status, productId }">
              Opens Deck checkout in a separate window so your game keeps running. Resolves with{' '}
              <Code>paid</Code> or <Code>cancelled</Code> (or <Code>pending</Code> if checkout ran
              past 15 minutes). Prices come from Deck, never from the call. Treat this as a hint for
              your UI; grant the item when your server gets <Code>purchase.paid</Code>. A one-off
              the player already owns rejects with a conflict, and a second purchase while checkout
              is open rejects with <Code>busy</Code>.
            </Api>
            <Api name="DeckGames.getPurchases()" returns="Purchase[]">
              Everything this player has bought in your game.
            </Api>
            <Api name="DeckGames.submitScore(score)" returns="{ best, improved, rank }">
              Posts a whole-number score to your Deck leaderboard. Live mode only; at most once
              every 10 seconds. Scores come from the browser, so never tie rewards to them.
            </Api>
            <Api name="DeckGames.leaderboard()" returns="{ scores, players, you }">
              The top ten and the player’s own place.
            </Api>
            <Api name="DeckGames.on(event, fn)" returns="unsubscribe()">
              <Code>pause</Code> and <Code>resume</Code> when the tab is hidden or shown;{' '}
              <Code>orientation</Code> with <Code>{'{ orientation, viewport }'}</Code> on rotate or
              resize.
            </Api>
            <Callout>
              Testing against a local copy of Deck? Allow its origin on the script tag:{' '}
              <Code>{'data-deck-origins="http://localhost:3000"'}</Code>. The SDK only listens to
              the window it is framed by, from an allowed Deck origin.
            </Callout>
          </Section>

          <Section id="server" title="Server API">
            <P>
              Base URL <Code>https://onedeck.africa/api/games/v1</Code>. Authenticate with your key:{' '}
              <Code>Authorization: Bearer dk_test_…</Code> or <Code>dk_live_…</Code>. A test key
              only sees test players and purchases; a live key only live ones. Keys are secrets —
              keep them on your server. Responses look like <Code>{'{ success, data }'}</Code>;
              errors like <Code>{'{ success: false, error: { message } }'}</Code>.
            </P>
            <Endpoint method="GET" path="/me">
              Which game and mode your key is for.
            </Endpoint>
            <Endpoint method="POST" path="/session/verify">
              Body <Code>{'{ token }'}</Code>. Returns{' '}
              <Code>{'{ playerId, displayName, mode, expiresAt }'}</Code>, or 401 if the token is
              expired, forged, from another game or from the other mode. This is the call that lets
              you trust who is playing.
            </Endpoint>
            <Endpoint method="GET" path="/products">
              All your products, including retired ones.
            </Endpoint>
            <Endpoint method="GET" path="/purchases/:reference">
              One purchase.
            </Endpoint>
            <Endpoint method="POST" path="/purchases/:reference/deliver">
              Mark a paid purchase as handed over. Idempotent — the second call returns the first
              delivery’s time.
            </Endpoint>
            <Endpoint method="GET" path="/players/:playerId/purchases">
              A player’s purchases. <Code>?status=paid&undelivered=true</Code> lists what is paid
              but not yet delivered — run it when a player connects to catch up on any webhook you
              missed.
            </Endpoint>
            <Pre>{`// Node — verify a player, then grant what they own
const res = await fetch('https://onedeck.africa/api/games/v1/session/verify', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.DECK_GAMES_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ token }),
});
if (!res.ok) throw new Error('Not a real Deck player');
const { data: player } = await res.json();`}</Pre>
          </Section>

          <Section id="webhooks" title="Webhooks">
            <P>
              Deck POSTs JSON to your endpoint the moment a purchase is paid. Each request carries{' '}
              <Code>X-Deck-Event</Code> and <Code>X-Deck-Signature: t=…,v1=…</Code> — an
              HMAC-SHA256, in hex, of <Code>{'"{t}.{raw body}"'}</Code> with your signing secret.
              Verify it against the <em>raw</em> body, and reject anything more than five minutes
              old.
            </P>
            <Pre>{`{
  "id": "evt_GP-7JB5JXFB_paid",
  "type": "purchase.paid",
  "created_at": "2026-10-15T11:21:48.042Z",
  "mode": "live",
  "game": "lagos-rush",
  "data": {
    "reference": "GP-7JB5JXFB",
    "productId": "suya.pack",
    "productName": "Suya pack",
    "productType": "one_off",
    "playerId": "p_2fb0302b0eb86df41737",
    "priceMinor": 150000,
    "developerShareMinor": 120000,
    "currency": "NGN",
    "paidAt": "2026-10-15T11:21:48.042Z"
  }
}`}</Pre>
            <Pre>{`// Node / Express
import crypto from 'node:crypto';

app.post('/deck/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const header = req.get('X-Deck-Signature') ?? '';
  const { t, v1 } = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  const expected = crypto
    .createHmac('sha256', process.env.DECK_WEBHOOK_SECRET)
    .update(\`\${t}.\${req.body}\`)
    .digest('hex');
  const fresh = Math.abs(Date.now() / 1000 - Number(t)) < 300;
  if (!fresh || !v1 || !crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected))) {
    return res.status(401).end();
  }
  const event = JSON.parse(req.body);
  // Seen event.id before? Acknowledge and stop.
  // Otherwise grant event.data.productId to event.data.playerId, then call /deliver.
  res.status(200).end();
});`}</Pre>
            <P>
              Delivery is at least once: dedupe on <Code>id</Code>. Anything but a 2xx is retried —
              after 1 minute, 5 minutes, 30 minutes, 2 hours and 6 hours — then marked failed.
              Redirects are not followed. You can resend any purchase from the Sales tab, and{' '}
              <Code>ping</Code> events from the Keys tab check your endpoint end to end. Endpoints
              must be https and publicly reachable.
            </P>
          </Section>

          <Section id="test-mode" title="Test mode">
            <P>
              Before review, test mode is the only mode, and only you (and Deck staff) can open your
              game. After approval you can switch between test and live on your game’s page.
            </P>
            <List
              items={[
                'Purchases are simulated: nothing is charged and they settle instantly.',
                'Webhooks fire for real, signed exactly as live ones are, with "mode": "test".',
                'Test players have t_ IDs and are invisible to your live key, and vice versa.',
                'Set a test build URL in Settings — even http://localhost — and test mode loads it in the real player.',
                'Scores are not recorded in test mode.',
              ]}
            />
          </Section>

          <Section id="money" title="Money & payouts">
            <P>
              Players pay in naira through Bachs. Of every live purchase,{' '}
              <strong>80% is yours</strong> and 20% is Deck’s. The split is fixed at the moment of
              sale. Prices run from ₦100 to ₦500,000.
            </P>
            <P>
              Your share is held for <strong>14 days</strong> to cover refunds and disputes, then
              sent automatically to your own Bachs account. Set that account up once, from{' '}
              <Link to="/games/developers" className="underline underline-offset-4">
                your games
              </Link>{' '}
              — Bachs collects your bank and identity details directly; Deck never sees them.
              Balances under ₦100 wait for the next sale. Earnings and transfers show on your
              developer page and in your Deck shop dashboard.
            </P>
          </Section>

          <Section id="review" title="Review & rules">
            <P>
              A person reviews every game before it goes live, and again if a rejected game is
              resubmitted.
            </P>
            <List
              items={[
                'The game must load over https from your own domain — never a Deck domain.',
                'It must allow being framed by https://onedeck.africa: no X-Frame-Options: DENY, and if you send a CSP frame-ancestors, include onedeck.africa.',
                'It must work in the orientation you chose, on a phone and a laptop.',
                'It must never ask for a password, card number or other credentials. Payments only through DeckGames.purchase().',
                'No malware, crypto-mining, deceptive ads or content that breaks Deck’s terms.',
                'Once approved, your URL and write-up are locked to what was reviewed. Orientation, webhooks, keys and products stay yours to change.',
              ]}
            />
            <P>
              The frame is sandboxed: scripts, your own storage and pointer lock are allowed;
              top-level navigation, popups, forms, camera, microphone and location are not.
            </P>
          </Section>
        </article>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <h2
        id={`${id}-title`}
        className="text-[clamp(1.5rem,3vw,2.25rem)] font-medium tracking-[-0.045em]"
      >
        {title}
      </h2>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

const P = ({ children }: { children: ReactNode }) => (
  <p className="text-[15px] leading-[1.75] text-g-ink/85 text-pretty">{children}</p>
);

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded-md bg-g-paper-2 px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
);

function Pre({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-g-night p-5 font-mono text-[12.5px] leading-[1.7] text-g-night-ink">
      <code>{children}</code>
    </pre>
  );
}

function Steps({ items, start = 1 }: { items: ReactNode[]; start?: number }) {
  return (
    <ol start={start} className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-4 text-[15px] leading-[1.7]">
          <span className="grid size-6 shrink-0 translate-y-0.5 place-items-center rounded-full border border-g-line font-mono text-[11px] text-g-mute">
            {start + index}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[15px] leading-[1.7]">
          <span aria-hidden="true" className="mt-3 size-1 shrink-0 rounded-full bg-g-ember" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Api({ name, returns, children }: { name: string; returns: string; children: ReactNode }) {
  return (
    <div className="border-t border-g-line pt-5">
      <p className="font-mono text-[14px] font-medium">{name}</p>
      <p className="mt-1 font-mono text-[11px] text-g-mute">→ {returns}</p>
      <p className="mt-2 text-[14px] leading-[1.7] text-g-ink/85">{children}</p>
    </div>
  );
}

function Endpoint({
  method,
  path,
  children,
}: {
  method: string;
  path: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-g-line pt-5">
      <p className="font-mono text-[13px]">
        <span className="mr-2 rounded-md bg-g-ink px-1.5 py-0.5 text-[10px] text-g-paper">
          {method}
        </span>
        {path}
      </p>
      <p className="mt-2 text-[14px] leading-[1.7] text-g-ink/85">{children}</p>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-g-line">
      <table className="w-full min-w-[520px] text-left text-[13px]">
        <thead className="bg-g-paper-2 font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
          <tr>
            {head.map((cell) => (
              <th key={cell} className="px-4 py-3 font-normal">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-g-line">
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={index === 0 ? 'px-4 py-3 font-medium' : 'px-4 py-3 text-g-mute'}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-g-paper-2 p-4 text-[14px] leading-[1.7]">{children}</div>;
}

/** The three parties and the two directions trust flows. */
function Diagram() {
  const box = 'rounded-2xl border border-g-line bg-g-paper p-4 text-center';
  return (
    <div className="grid items-center gap-3 rounded-3xl bg-g-paper-2 p-5 text-[13px] sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
      <div className={box}>
        <p className="font-medium">Your game</p>
        <p className="mt-1 text-[11px] text-g-mute">in the sandboxed frame</p>
      </div>
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
        SDK ⇄
      </p>
      <div className={box}>
        <p className="font-medium">Deck player</p>
        <p className="mt-1 text-[11px] text-g-mute">sign-in, checkout, scores</p>
      </div>
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
        API · webhooks ⇄
      </p>
      <div className={box}>
        <p className="font-medium">Your server</p>
        <p className="mt-1 text-[11px] text-g-mute">verifies, grants, delivers</p>
      </div>
    </div>
  );
}
