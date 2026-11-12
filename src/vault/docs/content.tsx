import {
  A,
  API,
  Callout,
  Cards,
  Code,
  Endpoint,
  H2,
  H3,
  List,
  P,
  Pre,
  Steps,
  Table,
  type DocProduct,
  type EndpointSpec,
} from '@/components/docs/kit';

/**
 * Vault's documentation.
 *
 * Written as pages rather than generated from a spec. There are eight
 * endpoints, and a generated reference for something this small costs more to
 * maintain than it saves — it also loses exactly the two things that actually
 * trip people up, because neither is expressible in a schema: when to send an
 * idempotency key, and what a merchant's own minting endpoint has to do when
 * Vault calls it and the call times out.
 *
 * Every amount in the API is an integer number of minor units. Every page that
 * shows money says so again, because the single most expensive mistake anyone
 * makes against a money API is sending 10000 where 1000000 was meant.
 */

const BASE = `${API}/vault/v1`;
const PARTNER_KEY = 'vlt_test_8f2c…';
const ISSUER_KEY = 'vli_test_3a91…';

/* -------------------------------------------------------------- endpoints --- */

const ME: EndpointSpec = {
  title: 'Who am I',
  method: 'GET',
  path: '/me',
  auth: PARTNER_KEY,
  description: (
    <>
      Tells you which account a key belongs to and which mode it is in. Useful as a first call when
      you are wiring up, and as a health check afterwards. Accepts either kind of key, and answers
      differently depending on which one you sent.
    </>
  ),
  response: {
    success: true,
    data: {
      audience: 'partner',
      id: 'paystack-gifts',
      name: 'Paystack Gifts',
      mode: 'test',
      status: 'live',
      balanceMinor: 47240000,
    },
  },
};

const CATALOGUE: EndpointSpec = {
  title: 'List the catalogue',
  method: 'GET',
  path: '/catalogue',
  auth: PARTNER_KEY,
  description: (
    <>
      Every live merchant and the cards they have on sale, with the discount you buy at already
      worked out. A product is addressed as <Code>issuer/product</Code>.
    </>
  ),
  response: {
    success: true,
    data: [
      {
        id: 'chowdeck',
        name: 'Chowdeck',
        tagline: 'Food, delivered',
        currency: 'NGN',
        products: [
          {
            id: 'chowdeck-gift-card',
            name: 'Chowdeck Gift Card',
            currency: 'NGN',
            denominationType: 'fixed',
            denominationsMinor: [200000, 500000, 1000000, 2000000],
            minMinor: null,
            maxMinor: null,
            discountPercent: 8,
            expiryDays: 365,
          },
        ],
      },
    ],
  },
};

const BALANCE: EndpointSpec = {
  title: 'Read your balance',
  method: 'GET',
  path: '/balance',
  auth: PARTNER_KEY,
  description: (
    <>
      What is left in the prepaid wallet this key spends from. Test and live hold separate
      balances, so the mode of the key decides which one you get.
    </>
  ),
  response: { success: true, data: { mode: 'test', balanceMinor: 47240000, currency: 'NGN' } },
};

const CREATE_ORDER: EndpointSpec = {
  title: 'Place an order',
  method: 'POST',
  path: '/orders',
  auth: PARTNER_KEY,
  status: 201,
  description: (
    <>
      Buys cards and returns them in the same response. The order is paid out of your prepaid
      balance, so there is no second step and nothing to poll in the normal case. Send an{' '}
      <Code>Idempotency-Key</Code> header — see <A to="/docs/orders">Placing an order</A> for why
      it matters more here than almost anywhere else.
    </>
  ),
  body: [
    {
      name: 'product',
      type: 'string',
      required: true,
      description: (
        <>
          <Code>issuer/product</Code>, or just <Code>product</Code> when only one merchant sells a
          card by that name. An ambiguous bare name is a 400 rather than a guess.
        </>
      ),
    },
    {
      name: 'amountMinor',
      type: 'integer',
      required: true,
      description: (
        <>
          The face value of each card, in minor units. Must be one the product offers — one of its{' '}
          <Code>denominationsMinor</Code>, or inside <Code>minMinor…maxMinor</Code> for a range
          card.
        </>
      ),
    },
    {
      name: 'quantity',
      type: 'integer',
      description: 'How many cards, 1 to 500. Defaults to 1.',
    },
    {
      name: 'recipientName',
      type: 'string',
      description: 'Carried on the card, if you are buying it for somebody by name.',
    },
    {
      name: 'recipientEmail',
      type: 'string',
      description: 'Where Deck should send the card, if you would rather it did the sending.',
    },
    { name: 'giftMessage', type: 'string', description: 'Up to 500 characters, shown with the card.' },
  ],
  example: { product: 'chowdeck/chowdeck-gift-card', amountMinor: 1000000, quantity: 3 },
  response: {
    success: true,
    data: {
      reference: 'VLT-EUPCBV6S',
      status: 'fulfilled',
      issuer: 'chowdeck',
      product: 'chowdeck-gift-card',
      quantity: 3,
      unitFaceMinor: 1000000,
      faceTotalMinor: 3000000,
      discountMinor: 240000,
      chargedMinor: 2760000,
      currency: 'NGN',
      balanceMinor: 44480000,
      cards: [
        {
          id: '6710f0c2a1b4e8d3f9c2a118',
          code: 'VLT-6V5K-HXFA-APQX',
          pin: '4340',
          faceValueMinor: 1000000,
          balanceMinor: 1000000,
          currency: 'NGN',
          expiresAt: '2027-11-11T00:00:00.000Z',
        },
      ],
    },
  },
};

const GET_ORDER: EndpointSpec = {
  title: 'Fetch an order',
  method: 'GET',
  path: '/orders/:reference',
  auth: PARTNER_KEY,
  description: (
    <>
      The order and its cards, any time. This is the safe thing to call after a timeout if you did
      not send an idempotency key — it reads, so calling it twice costs nothing.
    </>
  ),
  pathParams: [
    {
      name: 'reference',
      type: 'string',
      required: true,
      description: 'The reference the order came back with. Case-insensitive.',
    },
  ],
  response: {
    success: true,
    data: {
      reference: 'VLT-EUPCBV6S',
      status: 'fulfilled',
      quantity: 3,
      unitFaceMinor: 1000000,
      faceTotalMinor: 3000000,
      discountMinor: 240000,
      chargedMinor: 2760000,
      currency: 'NGN',
      createdAt: '2026-11-11T09:14:02.511Z',
      cards: [
        {
          id: '6710f0c2a1b4e8d3f9c2a118',
          code: 'VLT-6V5K-HXFA-APQX',
          pin: '4340',
          faceValueMinor: 1000000,
          balanceMinor: 700000,
          status: 'active',
          currency: 'NGN',
          expiresAt: '2027-11-11T00:00:00.000Z',
        },
      ],
    },
  },
};

const LIST_ORDERS: EndpointSpec = {
  title: 'List your orders',
  method: 'GET',
  path: '/orders',
  auth: PARTNER_KEY,
  exampleQuery: 'limit=25',
  description: 'Your most recent orders in this mode, newest first. Cards are not included.',
  query: [
    { name: 'limit', type: 'integer', description: 'How many to return, up to 100. Defaults to 25.' },
  ],
  response: {
    success: true,
    data: [
      {
        reference: 'VLT-EUPCBV6S',
        status: 'fulfilled',
        issuer: 'chowdeck',
        quantity: 3,
        chargedMinor: 2760000,
        currency: 'NGN',
        createdAt: '2026-11-11T09:14:02.511Z',
      },
    ],
  },
};

const CHECK_CARD: EndpointSpec = {
  title: 'Check a card',
  method: 'POST',
  path: '/cards/check',
  auth: ISSUER_KEY,
  description: (
    <>
      Looks a card up without spending anything — what a till does before it commits. Scoped to
      your own cards: a code belonging to another merchant answers exactly as an unknown one does.
    </>
  ),
  body: [
    { name: 'code', type: 'string', required: true, description: 'The card code. Dashes and case are ignored.' },
    { name: 'pin', type: 'string', description: 'Needed if the card was issued with one.' },
  ],
  example: { code: 'VLT-6V5K-HXFA-APQX', pin: '4340' },
  response: {
    success: true,
    data: {
      id: '6710f0c2a1b4e8d3f9c2a118',
      last4: 'APQX',
      status: 'active',
      faceValueMinor: 1000000,
      balanceMinor: 1000000,
      currency: 'NGN',
      issuedAt: '2026-11-11T09:14:02.511Z',
      expiresAt: '2027-11-11T00:00:00.000Z',
      requiresPin: true,
    },
  },
};

const REDEEM: EndpointSpec = {
  title: 'Redeem a card',
  method: 'POST',
  path: '/cards/redeem',
  auth: ISSUER_KEY,
  description: (
    <>
      Takes an amount off the card. Omit <Code>amountMinor</Code> to spend whatever is left. Cards
      carry a balance rather than a used flag, so partial redemption is the normal case and two
      tills hitting the same card at once cannot both spend it.
    </>
  ),
  body: [
    { name: 'code', type: 'string', required: true, description: 'The card code.' },
    { name: 'pin', type: 'string', description: 'Needed if the card was issued with one.' },
    {
      name: 'amountMinor',
      type: 'integer',
      description: 'How much to spend, in minor units. Omitted means the whole remaining balance.',
    },
  ],
  example: { code: 'VLT-6V5K-HXFA-APQX', pin: '4340', amountMinor: 300000 },
  response: {
    success: true,
    data: {
      reference: 'VLR-2K9XQ4',
      cardId: '6710f0c2a1b4e8d3f9c2a118',
      redeemedMinor: 300000,
      balanceMinor: 700000,
      status: 'active',
      currency: 'NGN',
    },
  },
};

/* ------------------------------------------------------------------ pages --- */

export const vault: DocProduct = {
  id: 'vault',
  name: 'Vault',
  apiBase: BASE,
  groups: [
    {
      title: 'Get started',
      pages: [
        {
          slug: 'overview',
          title: 'Vault',
          lead: 'Gift card infrastructure for Africa. Merchants list a card and are selling it the same day; businesses connect once and can buy from every merchant through a single API.',
          body: () => (
            <>
              <Cards
                items={[
                  {
                    title: 'Quick start',
                    body: 'A sandbox key, a play balance and your first card in about five minutes.',
                    to: '/docs/quick-start',
                    mark: '→',
                  },
                  {
                    title: 'Buy cards',
                    body: 'Browse the catalogue, place an order, get codes back in the same response.',
                    to: '/docs/orders',
                    mark: '₦',
                  },
                  {
                    title: 'API reference',
                    body: 'Eight endpoints, with the request and the response side by side.',
                    to: '/docs/api',
                    mark: '{}',
                  },
                ]}
              />

              <H2>Two sides, one platform</H2>
              <P>
                Vault exists because the two halves of a gift card business are usually two separate
                integrations. A merchant who wants to sell cards has to build issuance, balances and
                redemption; a business that wants to resell other people&rsquo;s cards has to
                integrate every merchant one at a time. Vault is the piece in between, so each side
                builds once.
              </P>
              <List
                items={[
                  <>
                    <strong>Merchants</strong> — called <Code>issuers</Code> throughout the API —
                    set denominations and the discount they offer. Vault mints the codes, holds the
                    balances and handles redemption, or calls the merchant&rsquo;s own system to
                    mint them. See <A to="/docs/issuing">Issuing cards</A>.
                  </>,
                  <>
                    <strong>Distributors</strong> — <Code>partners</Code> in the API — prepay a
                    wallet and buy from the whole catalogue through one key. See{' '}
                    <A to="/docs/catalogue">The catalogue</A>.
                  </>,
                  <>
                    <strong>Everyone else</strong> buys a single card from a merchant&rsquo;s shop
                    on Vault itself. There is nothing to integrate for that.
                  </>,
                ]}
              />

              <H2>Where the money goes</H2>
              <P>
                A distributor pays below face value. That discount is the merchant&rsquo;s offer and
                the distributor&rsquo;s margin. Deck&rsquo;s fee comes out of what is actually
                charged, never out of the gap — so a bigger discount never costs the merchant twice.
              </P>
              <Table
                keyColumn="label"
                head={['Step', 'What it is', 'Amount']}
                rows={[
                  ['Face value', 'What the card is worth to whoever holds it', '₦10,000'],
                  ["Merchant's discount", '8%, set by the merchant', '−₦800'],
                  ['Distributor pays', 'Debited from their Vault balance', '₦9,200'],
                  ["Deck's fee", '3% of the charge', '−₦276'],
                  ['Merchant is owed', "Settled on Deck's normal payout cycle", '₦8,924'],
                ]}
              />
              <P>
                The fee is rounded and the merchant takes the remainder, so the two always add back
                to the charge exactly. No amount is ever stored as a decimal.
              </P>

              <H2>What Vault guarantees</H2>
              <List
                items={[
                  <>
                    <strong>Codes are encrypted, not just hashed.</strong> A card has to be readable
                    by the person who bought it, so a hash alone would make the product impossible.
                    Codes are sealed with a key that is not in the database; a dump on its own
                    yields nothing.
                  </>,
                  <>
                    <strong>Partial redemption is the normal case.</strong> A card carries a
                    balance. Spend ₦3,000 of ₦10,000 and the rest stays live.
                  </>,
                  <>
                    <strong>Test and live are completely separate.</strong> Separate keys, separate
                    balances, separate cards. A sandbox code cannot be walked into production, and
                    play money cannot buy a real card.
                  </>,
                  <>
                    <strong>A retry never buys twice,</strong> as long as you send an idempotency
                    key.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          slug: 'quick-start',
          title: 'Quick start',
          lead: 'From nothing to a card code in about five minutes, on sandbox money.',
          body: () => (
            <>
              <H2>Get a key</H2>
              <Steps
                items={[
                  <>
                    Sign up at <A to="/distribute">Start distributing</A>. Sandbox keys and a play
                    balance are issued immediately — there is no call to get on first.
                  </>,
                  <>
                    Copy the test key. It is shown once; Vault stores only a hash of it and the last
                    four characters, so a key you lose has to be replaced rather than recovered.
                  </>,
                  <>Keep it server-side. A Vault key spends money and belongs nowhere near a browser.</>,
                ]}
              />

              <H2>Check it works</H2>
              <Pre label="cURL">{`curl ${BASE}/me \\
  -H "Authorization: Bearer ${PARTNER_KEY}"`}</Pre>
              <Pre label="200">{`{
  "success": true,
  "data": {
    "audience": "partner",
    "id": "your-business",
    "mode": "test",
    "status": "live",
    "balanceMinor": 50000000
  }
}`}</Pre>

              <H2>Find something to buy</H2>
              <P>
                The catalogue is every live merchant and every card they have on sale, with the
                discount you buy at already worked out.
              </P>
              <Pre label="cURL">{`curl ${BASE}/catalogue \\
  -H "Authorization: Bearer ${PARTNER_KEY}"`}</Pre>

              <H2>Buy a card</H2>
              <Pre label="cURL">{`curl -X POST ${BASE}/orders \\
  -H "Authorization: Bearer ${PARTNER_KEY}" \\
  -H "Idempotency-Key: your-own-order-id-8812" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product": "chowdeck/chowdeck-gift-card",
    "amountMinor": 1000000,
    "quantity": 1
  }'`}</Pre>
              <P>
                The codes come back in that same response. <Code>amountMinor</Code> is kobo:
                1000000 is ₦10,000.
              </P>

              <Callout>
                That is the whole happy path. The rest of these pages are about the two things that
                are not obvious from it — <A to="/docs/orders">what to do when a call times out</A>,
                and <A to="/docs/amounts">why every amount is an integer</A>.
              </Callout>

              <H2>Then go live</H2>
              <P>
                Live keys need an approved account and a funded wallet. Nothing else changes: the
                same endpoints, the same payloads, a different key prefix.
              </P>
            </>
          ),
        },
        {
          slug: 'authentication',
          title: 'Authentication',
          lead: 'One base URL, two kinds of key. The prefix decides what a key can do, so a key is never ambiguous about which side of Vault it belongs to.',
          body: () => (
            <>
              <Pre label="Base URL">{BASE}</Pre>

              <H2>Keys</H2>
              <P>
                Send your key as a bearer token on every request. There is no other authentication
                scheme and no session.
              </P>
              <Pre label="cURL">{`curl ${BASE}/me \\
  -H "Authorization: Bearer ${PARTNER_KEY}"`}</Pre>
              <Table
                head={['Prefix', 'Who it belongs to', 'What it can do']}
                rows={[
                  [
                    <>
                      <Code>vlt_test_</Code> <Code>vlt_live_</Code>
                    </>,
                    'A distributor',
                    'Browse the catalogue, place and read orders, read its balance',
                  ],
                  [
                    <>
                      <Code>vli_test_</Code> <Code>vli_live_</Code>
                    </>,
                    'A merchant',
                    'Check a card, redeem a card',
                  ],
                ]}
              />
              <P>
                Neither can do the other&rsquo;s work. A distributor key on{' '}
                <Code>/cards/redeem</Code> is a 403, not a 401 — the key is fine, it is just the
                wrong side of the product.
              </P>

              <H2>Test and live</H2>
              <P>
                The mode is part of the key, not a header or a flag you could forget to set. Test
                and live hold separate balances and separate cards, and nothing crosses between
                them: a sandbox code does not exist in production, and play money cannot buy a real
                card.
              </P>
              <Callout tone="warning">
                Keys are shown once. Vault stores a SHA-256 hash and the last four characters, which
                is enough to tell you which key is which in the dashboard and not enough to use one.
                A lost key is replaced, not recovered.
              </Callout>

              <H2>Rate limits</H2>
              <List
                items={[
                  <>
                    <strong>600 requests a minute</strong> across the API, counted before the key is
                    checked — so guessing keys is slow too.
                  </>,
                  <>
                    <strong>60 a minute</strong> on <Code>/cards/redeem</Code>. It is the one
                    endpoint where a correct guess is worth money. Six a second is far above any
                    real till and far below a useful search rate.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          slug: 'amounts',
          title: 'Amounts and currency',
          lead: 'Every amount in this API is an integer number of minor units. There are no decimals anywhere, in either direction.',
          body: () => (
            <>
              <P>
                A field ending in <Code>Minor</Code> is kobo for naira, cents for dollars — the
                smallest unit the currency has. ₦10,000 is <Code>1000000</Code>.
              </P>
              <Table
                keyColumn="label"
                head={['You mean', 'You send', 'Not']}
                rows={[
                  ['₦500', <Code>50000</Code>, <Code>500</Code>],
                  ['₦10,000', <Code>1000000</Code>, <Code>10000</Code>],
                  ['₦10,000.50', <Code>1000050</Code>, <Code>10000.50</Code>],
                ]}
              />
              <P>
                This is not pedantry. A decimal amount is the single most common source of money
                bugs across client languages — the value that arrives as <Code>9.999999</Code> from
                somebody&rsquo;s float, the one that rounds differently in two services. An integer
                number of kobo cannot be rounded wrong by anybody&rsquo;s float, so Vault refuses to
                accept one that could be.
              </P>
              <Callout tone="warning">
                A quantity cap goes with it: at most 500 cards an order. A typo of{' '}
                <Code>100000</Code> for <Code>1000</Code> in <Code>quantity</Code> would otherwise
                mint a hundred thousand bearer instruments before anybody noticed.
              </Callout>

              <H2>Currency</H2>
              <P>
                Every response that carries money carries its <Code>currency</Code> beside it. A
                card is denominated in the currency its issuer sells in; today that is naira
                throughout, and the field is there so it does not have to be added later.
              </P>

              <H2>Reading an order</H2>
              <Table
                head={['Field', 'What it is']}
                rows={[
                  ['unitFaceMinor', 'The face value of one card'],
                  ['faceTotalMinor', 'Face value × quantity — what the cards are worth'],
                  ['discountMinor', "The merchant's discount on the whole order"],
                  ['chargedMinor', 'What came out of your balance: face total − discount'],
                  ['balanceMinor', 'What is left in your wallet after the order'],
                ]}
              />
            </>
          ),
        },
      ],
    },
    {
      title: 'Buying cards',
      pages: [
        {
          slug: 'catalogue',
          title: 'The catalogue',
          lead: 'Every live merchant, every card they have on sale, and the price you actually pay.',
          body: () => (
            <>
              <Pre label="cURL">{`curl ${BASE}/catalogue \\
  -H "Authorization: Bearer ${PARTNER_KEY}"`}</Pre>

              <H2>Addressing a product</H2>
              <P>
                A product is addressed as <Code>issuer/product</Code> — both of them slugs from the
                catalogue response, not display names. You may send the bare{' '}
                <Code>product</Code> when only one merchant sells a card by that name, but Vault
                answers an ambiguous bare name with a 400 rather than guessing. Two merchants both
                calling their card <Code>standard</Code> is not a hypothetical.
              </P>
              <Pre label="Product ids">{`chowdeck/chowdeck-gift-card   ← always unambiguous
chowdeck-gift-card            ← fine until somebody else uses the name`}</Pre>

              <H2>What a product tells you</H2>
              <Table
                head={['Field', 'Means']}
                rows={[
                  ['denominationType', <>Either <Code>fixed</Code> or <Code>range</Code>.</>],
                  [
                    'denominationsMinor',
                    <>
                      For a <Code>fixed</Code> card, the amounts you may buy. Anything else is a 400.
                    </>,
                  ],
                  [
                    'minMinor / maxMinor',
                    <>
                      For a <Code>range</Code> card, the bounds. Any whole amount between them is
                      valid.
                    </>,
                  ],
                  [
                    'discountPercent',
                    'Already resolved for you — the product’s own discount if it has one, otherwise the merchant’s.',
                  ],
                  ['expiryDays', 'How long a card lives from issue. 0 or absent means it does not expire.'],
                  ['redeemInstructions', 'What the merchant wants the cardholder told. Worth passing through.'],
                ]}
              />
              <Callout>
                The discount is resolved server-side on purpose. A partner who computes it from two
                fields themselves is a partner who will eventually compute it differently from Vault
                and dispute an invoice.
              </Callout>

              <H2>Only live merchants appear</H2>
              <P>
                A merchant has to be approved before their cards are listed, and a product has to be{' '}
                <Code>active</Code>. A card that disappears from the catalogue has been paused;
                orders already placed against it are unaffected, and existing cards stay redeemable.
              </P>
            </>
          ),
        },
        {
          slug: 'orders',
          title: 'Placing an order',
          lead: 'Buy cards, get the codes back in the same response, and make sure a retry can never buy them twice.',
          body: () => (
            <>
              <Pre label="cURL">{`curl -X POST ${BASE}/orders \\
  -H "Authorization: Bearer vlt_live_…" \\
  -H "Idempotency-Key: order-8812" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product": "chowdeck/chowdeck-gift-card",
    "amountMinor": 1000000,
    "quantity": 3
  }'`}</Pre>
              <P>
                The order is paid out of your prepaid balance, so there is no payment step and
                nothing to poll in the normal case. Cards come back inside{' '}
                <Code>data.cards</Code>, each with its code, its PIN if it has one, and its balance.
              </P>

              <H2 id="idempotency">Send an idempotency key</H2>
              <P>
                Minting cards spends real money and cannot be undone by trying again. If your
                request times out you have no way to know whether it landed — the connection dropped
                somewhere, and both &ldquo;nothing happened&rdquo; and &ldquo;three cards exist and
                your wallet is ₦27,600 lighter&rdquo; look identical from your side.
              </P>
              <P>
                An <Code>Idempotency-Key</Code> header removes the question. Repeating the call with
                the same key returns the original order instead of buying a second time.
              </P>
              <Pre label="Header">{`Idempotency-Key: order-8812`}</Pre>
              <List
                items={[
                  'Keys are scoped to your account and never expire.',
                  <>
                    Use something from your own system — an order id, an invoice number. <strong>Not</strong>{' '}
                    a random value generated per attempt, which is a different key on the retry and
                    therefore a second order.
                  </>,
                  <>
                    Without one, the safe move after a timeout is{' '}
                    <A to="/docs/api#fetch-an-order">fetching the order</A> rather than repeating
                    the call.
                  </>,
                ]}
              />

              <H2>What can go wrong</H2>
              <Table
                head={['Status', 'What happened']}
                rows={[
                  ['400', 'Not enough balance, or an amount the product does not offer'],
                  ['400', 'An ambiguous bare product name — qualify it as issuer/product'],
                  ['404', 'No live issuer or active product with that id'],
                  ['502', "A merchant's own minting endpoint failed. The order failed and nothing was charged."],
                ]}
              />
              <P>
                A failed order leaves the balance where it was. There is no half-fulfilled state: an
                order that cannot mint every card it promised mints none of them.
              </P>

              <H2>Webhooks</H2>
              <P>
                Set a webhook URL in the dashboard and Vault will POST{' '}
                <Code>order.fulfilled</Code> to it. It is strictly a convenience — the order is
                already readable over the API, so a missed webhook costs a poll rather than a sale.
                See <A to="/docs/webhooks">Webhooks</A> for the signature.
              </P>
            </>
          ),
        },
        {
          slug: 'webhooks',
          title: 'Webhooks',
          lead: 'Vault tells you when an order is fulfilled, signed the way Stripe signs, over a timestamp as well as a body.',
          body: () => (
            <>
              <P>
                Set an endpoint in the distributor dashboard and Vault POSTs to it when something
                happens. It must be <Code>https</Code>.
              </P>
              <Pre label="POST your endpoint">{`{
  "event": "order.fulfilled",
  "mode": "live",
  "data": {
    "reference": "VLT-EUPCBV6S",
    "status": "fulfilled",
    "quantity": 3,
    "chargedMinor": 2760000
  },
  "sentAt": "2026-11-11T09:14:02.644Z"
}`}</Pre>

              <H2 id="verifying">Verifying the signature</H2>
              <Pre label="Header">{`x-vault-signature: t=1763890442,v1=5257a8…`}</Pre>
              <P>
                The digest is <Code>HMAC-SHA256(secret, &quot;{'{t}'}.{'{raw body}'}&quot;)</Code>,
                hex encoded. The secret is in your dashboard beside the webhook URL.
              </P>
              <Pre label="Node">{`import crypto from 'node:crypto';

function verify(rawBody, header, secret) {
  const parts = Object.fromEntries(
    header.split(',').map((piece) => piece.split('=')),
  );
  const expected = crypto
    .createHmac('sha256', secret)
    .update(\`\${parts.t}.\${rawBody}\`)
    .digest('hex');

  /* Constant time, so a wrong signature does not leak how wrong it was. */
  const ok = crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(parts.v1 ?? ''),
  );

  /* And the timestamp, or a captured request replays forever. */
  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  return ok && age < 300;
}`}</Pre>
              <Callout tone="warning">
                Check the timestamp as well as the digest. A signature over the body alone is valid
                forever, so anyone who captures one valid request can send it again tomorrow and it
                will still verify. Five minutes is a reasonable window.
              </Callout>
              <P>
                Verify against the <strong>raw</strong> body, before any JSON parsing. Re-serialising
                the parsed object changes key order and whitespace, and the digest with it.
              </P>

              <H2>Delivery</H2>
              <P>
                Fire and forget, on purpose: a webhook endpoint being slow or down must never fail
                the API call that triggered it, because by that point the cards exist and the money
                has moved. There are no retries, and no delivery log to replay from. If a webhook
                matters to your flow, reconcile with{' '}
                <A to="/docs/api#list-your-orders">the orders list</A> as well.
              </P>
            </>
          ),
        },
      ],
    },
    {
      title: 'Selling cards',
      pages: [
        {
          slug: 'issuing',
          title: 'Issuing cards',
          lead: 'What a merchant sets up, and the one decision that actually matters: who generates the code.',
          body: () => (
            <>
              <H2>Setting up</H2>
              <Steps
                items={[
                  <>
                    Create a card programme at <A to="/issue">Issue your cards</A>: a name, a logo,
                    your terms, and the discount you offer distributors.
                  </>,
                  <>
                    Add a card. Either <Code>fixed</Code> denominations — the amounts people may buy
                    — or a <Code>range</Code> with a smallest and a largest.
                  </>,
                  <>
                    Submit for review. Vault lists your cards once the programme is approved;
                    nothing is public before that.
                  </>,
                  <>Take an issuer key (vli_…) for your till or your backend.</>,
                ]}
              />

              <H2>Who mints the code</H2>
              <P>This is the decision. Everything else is a form.</P>
              <H3>Vault mints (the default)</H3>
              <P>
                Vault generates the code and the PIN, holds the balance and handles redemption. You
                do nothing but redeem. Choose this unless a card has to exist inside your own system
                to be useful.
              </P>
              <H3>You mint</H3>
              <P>
                Vault calls your system once per card, and the card is native to your wallet or POS
                from the moment it exists. Choose this if your customers already have a balance with
                you and a gift card ought to top it up. See{' '}
                <A to="/docs/minting">Minting your own codes</A>.
              </P>

              <H2>How a code is stored</H2>
              <P>
                Three ways at once, because a card code is not a password and cannot be treated like
                one — the person who bought it has to be able to read it back.
              </P>
              <List
                items={[
                  <>
                    A <strong>SHA-256 hash</strong>, which is what a lookup matches against. Indexed,
                    so redemption is one query.
                  </>,
                  <>
                    <strong>AES-256-GCM ciphertext</strong>, so the code can be shown to its owner.
                    The key lives in the environment, not the database.
                  </>,
                  <>
                    The <strong>last four characters</strong> in plain text, for support
                    conversations and dashboards.
                  </>,
                ]}
              />
              <Callout tone="warning">
                A database dump on its own yields nothing usable. That also means losing the key
                makes every issued code unreadable — it is backed up with the database, not instead
                of it.
              </Callout>
            </>
          ),
        },
        {
          slug: 'redeeming',
          title: 'Checking and redeeming',
          lead: 'Look a card up, then spend part or all of it. Cards carry a balance, not a used flag.',
          body: () => (
            <>
              <H2>Check first</H2>
              <P>
                <Code>/cards/check</Code> looks a card up without spending anything — what a till
                does before it commits to a bill.
              </P>
              <Pre label="cURL">{`curl -X POST ${BASE}/cards/check \\
  -H "Authorization: Bearer vli_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{ "code": "VLT-6V5K-HXFA-APQX", "pin": "4340" }'`}</Pre>

              <H2>Then redeem</H2>
              <Pre label="cURL">{`curl -X POST ${BASE}/cards/redeem \\
  -H "Authorization: Bearer vli_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{ "code": "VLT-6V5K-HXFA-APQX", "pin": "4340", "amountMinor": 300000 }'`}</Pre>
              <Pre label="200">{`{
  "success": true,
  "data": {
    "reference": "VLR-2K9XQ4",
    "cardId": "6710f0c2a1b4e8d3f9c2a118",
    "redeemedMinor": 300000,
    "balanceMinor": 700000,
    "status": "active",
    "currency": "NGN"
  }
}`}</Pre>
              <P>
                Omit <Code>amountMinor</Code> to spend whatever is left, which is what a till does
                when the card covers the bill. A card whose balance reaches zero becomes{' '}
                <Code>spent</Code>.
              </P>

              <H2>Two tills, one card</H2>
              <P>
                The decrement is a single conditional update with the balance as a precondition, so
                two redemptions arriving at once cannot both succeed against the same money. One
                wins and the other gets a 400. There is no window in which both read ₦10,000 and
                both spend it.
              </P>

              <H2>You can only see your own cards</H2>
              <P>
                A code belonging to another merchant answers exactly as an unknown one does — the
                same 404, the same wording. That is deliberate: a different error would turn this
                endpoint into an oracle for guessing at other people&rsquo;s codes, and{' '}
                <A to="/docs/authentication">the rate limit on it</A> would be the only thing left
                standing between a guesser and real money.
              </P>

              <H2>Expiry</H2>
              <P>
                Expiry is reported from the date, not only from the stored status, so a card that
                lapsed since its last write reads as <Code>expired</Code> here rather than{' '}
                <Code>active</Code>. Do not cache a status across a day boundary.
              </P>
            </>
          ),
        },
        {
          slug: 'minting',
          title: 'Minting your own codes',
          lead: 'Have Vault call your system instead of generating codes itself, so a card is native to your wallet from the moment it exists.',
          body: () => (
            <>
              <P>
                Set a fulfilment URL in the issuer dashboard and switch the programme to{' '}
                <Code>merchant</Code> fulfilment. Vault will POST to it once per card, and wait for
                the code you minted.
              </P>

              <H2>The call Vault makes</H2>
              <Pre label="POST your fulfilment URL">{`POST https://api.yourcompany.com/vault/mint
content-type: application/json
x-vault-signature: t=1763890442,v1=5257a8…
x-vault-idempotency-key: VLT-EUPCBV6S-2
user-agent: Deck-Vault/1.0

{
  "event": "card.mint",
  "orderReference": "VLT-EUPCBV6S",
  "product": "chowdeck-gift-card",
  "amountMinor": 1000000,
  "currency": "NGN",
  "mode": "live",
  "expiresAt": "2027-11-11T00:00:00.000Z"
}`}</Pre>
              <P>
                Signed exactly as <A to="/docs/webhooks#verifying">a webhook</A> is, with your
                fulfilment secret. One verification routine covers both.
              </P>

              <H2>What to answer</H2>
              <Pre label="200">{`{ "code": "CHW-8812-2231", "pin": "4418", "externalId": "wallet_9912" }`}</Pre>
              <Table
                head={['Field', 'Required', 'What it is']}
                rows={[
                  ['code', 'Yes', 'The card code you minted. A string; anything else is a 502 back to the buyer.'],
                  ['pin', 'No', 'If your cards carry one. Vault will require it on redemption.'],
                  ['externalId', 'No', 'Your own id for the card, stored and shown back to you.'],
                ]}
              />
              <P>
                Answer within the timeout, with JSON, and with a 2xx. Anything else — a slow
                response, a non-JSON body, a missing <Code>code</Code> — fails the order and refunds
                the buyer.
              </P>

              <H2 id="idempotency">Honour the idempotency key</H2>
              <Callout tone="warning">
                Vault does not retry this call. If it times out, the order fails and the buyer is
                refunded — because a blind retry risks you issuing two cards while Vault charges for
                one, and issuing value twice is worse than failing a sale.
              </Callout>
              <P>
                That is Vault failing closed on your behalf, and you can turn it into something
                better. Key off <Code>x-vault-idempotency-key</Code> — it is unique per card, not
                per order — and return the same card for a repeat. A retry then becomes free, and
                the failure mode above disappears.
              </P>
              <Pre label="Node">{`app.post('/vault/mint', async (req, res) => {
  const key = req.header('x-vault-idempotency-key');

  /* Already minted for this key: answer with the same card. */
  const existing = await cards.findOne({ mintKey: key });
  if (existing) return res.json({ code: existing.code, pin: existing.pin });

  const card = await wallet.issue({
    amountMinor: req.body.amountMinor,
    currency: req.body.currency,
    test: req.body.mode === 'test',
    mintKey: key,
  });
  res.json({ code: card.code, pin: card.pin, externalId: card.id });
});`}</Pre>

              <H2>Test mode reaches you too</H2>
              <P>
                A sandbox order calls the same URL with <Code>&quot;mode&quot;: &quot;test&quot;</Code>.
                Mint against your own test ledger when you see it — Vault cannot tell your systems
                apart for you, and a sandbox order that quietly issues a real card is the worst
                outcome available here.
              </P>
            </>
          ),
        },
      ],
    },
    {
      title: 'Reference',
      pages: [
        {
          slug: 'api',
          title: 'API reference',
          wide: true,
          lead: 'Eight endpoints. Every amount is an integer number of minor units; every response is wrapped in { success, data }.',
          body: () => (
            <>
              <Endpoint base={BASE} spec={ME} />
              <Endpoint base={BASE} spec={CATALOGUE} />
              <Endpoint base={BASE} spec={BALANCE} />
              <Endpoint base={BASE} spec={CREATE_ORDER} />
              <Endpoint base={BASE} spec={GET_ORDER} />
              <Endpoint base={BASE} spec={LIST_ORDERS} />
              <Endpoint base={BASE} spec={CHECK_CARD} />
              <Endpoint base={BASE} spec={REDEEM} />
            </>
          ),
        },
        {
          slug: 'errors',
          title: 'Errors',
          lead: 'One shape for every failure, and a meaningful status beside it.',
          body: () => (
            <>
              <Pre label="Any failure">{`{
  "success": false,
  "error": { "message": "Not enough balance for this order" }
}`}</Pre>

              <H2>The ones worth handling</H2>
              <Table
                head={['Status', 'Means', 'What to do']}
                keyColumn="code"
                rows={[
                  ['401', 'The key is missing, malformed, or not one of ours', 'Check the header, not the account'],
                  [
                    '403',
                    'Right key, wrong side — a distributor key cannot redeem; a suspended account cannot call at all',
                    'Use the other key, or talk to us',
                  ],
                  [
                    '400',
                    'Not enough balance, an amount the product does not offer, an ambiguous product name, a spent or expired card',
                    'The message says which. None of these are retryable unchanged',
                  ],
                  ['404', 'No such product, order, or card — or it is not yours', 'Do not retry'],
                  [
                    '429',
                    'Over the rate limit',
                    'Back off. 600/min across the API, 60/min on redeem',
                  ],
                  [
                    '502',
                    "A merchant's own minting endpoint failed. The order failed and nothing was charged",
                    'Retryable, but tell the merchant',
                  ],
                ]}
              />

              <H2>What a 404 does not tell you</H2>
              <P>
                An unknown card and somebody else&rsquo;s card answer identically, on purpose — see{' '}
                <A to="/docs/redeeming">Checking and redeeming</A>. Do not write logic that depends
                on telling them apart, because there is nothing there to tell apart.
              </P>

              <H2>Retrying safely</H2>
              <List
                items={[
                  <>
                    Every <Code>GET</Code> is safe to repeat. After a timeout on an order, fetching
                    it is always the right move.
                  </>,
                  <>
                    <Code>POST /orders</Code> is safe to repeat <strong>only</strong> with the same{' '}
                    <A to="/docs/orders#idempotency">
                      <Code>Idempotency-Key</Code>
                    </A>
                    .
                  </>,
                  <>
                    <Code>POST /cards/redeem</Code> is not idempotent. A timeout there is a{' '}
                    <Code>/cards/check</Code>, not a second redeem.
                  </>,
                ]}
              />
            </>
          ),
        },
      ],
    },
  ],
};
