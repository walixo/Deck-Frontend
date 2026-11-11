import type { ReactNode } from 'react';

/**
 * The API reference.
 *
 * Written as a page rather than pulled from a spec because there is one API
 * with about a dozen endpoints, and a generated reference for something this
 * small costs more to maintain than it saves — and generated references are
 * exactly where the two things that actually trip people up get lost: when to
 * send an idempotency key, and what a merchant's own minting endpoint must do.
 */
export function VaultDocs() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="display-tight text-3xl sm:text-4xl">Vault API</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
        One base URL, two kinds of key. Everything is JSON, and every amount is an integer number
        of kobo.
      </p>

      <Pre>{`https://onedeck.africa/api/vault/v1`}</Pre>

      <Section title="Keys">
        <p>
          Send your key as a bearer token. The prefix decides what it can do, so a key is never
          ambiguous about which side of Vault it belongs to.
        </p>
        <Table
          head={['Prefix', 'Who', 'Can']}
          rows={[
            ['vlt_test_ / vlt_live_', 'Distributor', 'Browse the catalogue, place orders, read its balance'],
            ['vli_test_ / vli_live_', 'Merchant', 'Check a card, redeem a card'],
          ]}
        />
        <Pre>{`curl https://onedeck.africa/api/vault/v1/me \\
  -H "Authorization: Bearer vlt_test_…"`}</Pre>
        <p>
          Test and live are completely separate — separate balances, separate cards. A sandbox code
          does not exist in production, and sandbox money cannot buy a live card.
        </p>
      </Section>

      <Section title="Catalogue">
        <Endpoint method="GET" path="/catalogue" note="distributor key" />
        <p>
          Every merchant selling, with their cards and the discount you buy at. A product is
          addressed as <Code>issuer/product</Code>.
        </p>
        <Pre>{`{
  "success": true,
  "data": [
    {
      "id": "chowdeck",
      "name": "Chowdeck",
      "products": [
        {
          "id": "chowdeck-gift-card",
          "denominationsMinor": [200000, 500000, 1000000, 2000000],
          "discountPercent": 8
        }
      ]
    }
  ]
}`}</Pre>
      </Section>

      <Section title="Ordering">
        <Endpoint method="POST" path="/orders" note="distributor key" />
        <p>
          Cards come back in the same response. The order is paid out of your prepaid balance, so
          there is no second step and nothing to poll in the normal case.
        </p>
        <Pre>{`curl -X POST https://onedeck.africa/api/vault/v1/orders \\
  -H "Authorization: Bearer vlt_live_…" \\
  -H "Idempotency-Key: order-8812" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product": "chowdeck/chowdeck-gift-card",
    "amountMinor": 1000000,
    "quantity": 3
  }'`}</Pre>
        <Pre>{`{
  "reference": "VLT-EUPCBV6S",
  "status": "fulfilled",
  "faceTotalMinor": 3000000,
  "discountMinor": 240000,
  "chargedMinor": 2760000,
  "balanceMinor": 47240000,
  "cards": [
    { "code": "VLT-6V5K-HXFA-APQX", "pin": "4340", "balanceMinor": 1000000 }
  ]
}`}</Pre>

        <Callout title="Send an idempotency key">
          <p>
            Minting cards spends real money and cannot be undone by trying again. If your request
            times out you have no way to know whether it landed — unless you sent an{' '}
            <Code>Idempotency-Key</Code>, in which case repeating the call returns the original
            order instead of buying a second time.
          </p>
          <p className="mt-2">
            Keys are scoped to your account and never expire. Use something from your own system:
            an order id, not a random value generated per attempt.
          </p>
        </Callout>

        <Endpoint method="GET" path="/orders/:reference" note="distributor key" />
        <p>
          The order and its cards, any time. This is the safe thing to call after a timeout if you
          did not send an idempotency key.
        </p>
      </Section>

      <Section title="Redeeming">
        <Endpoint method="POST" path="/cards/check" note="merchant key" />
        <p>Looks a card up without spending anything — what a till does before it commits.</p>

        <Endpoint method="POST" path="/cards/redeem" note="merchant key" />
        <p>
          Takes an amount off the card. Omit <Code>amountMinor</Code> to spend whatever is left.
          Cards carry a balance rather than a used flag, so partial redemption is the normal case.
        </p>
        <Pre>{`curl -X POST https://onedeck.africa/api/vault/v1/cards/redeem \\
  -H "Authorization: Bearer vli_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{ "code": "VLT-6V5K-HXFA-APQX", "pin": "4340", "amountMinor": 300000 }'`}</Pre>
        <Pre>{`{ "redeemedMinor": 300000, "balanceMinor": 700000, "status": "active" }`}</Pre>
        <p>
          You can only see and redeem your own cards. A code belonging to another merchant answers
          exactly as an unknown one does, which is deliberate: a different error would turn this
          endpoint into a way of guessing at other people&rsquo;s codes.
        </p>
      </Section>

      <Section title="Webhooks">
        <p>
          If you set an endpoint, Vault POSTs <Code>order.fulfilled</Code> to it. Signed like
          Stripe&rsquo;s, because that is the verifier most people have already written:
        </p>
        <Pre>{`x-vault-signature: t=1731330000,v1=5257a8…`}</Pre>
        <p>
          The signature is <Code>HMAC-SHA256(secret, "{'{t}'}.{'{raw body}'}")</Code>. Check the
          timestamp as well as the digest — a signature over the body alone replays forever.
        </p>
      </Section>

      <Section title="Minting your own codes">
        <p>
          Merchants can have Vault call their system instead of generating codes itself, so a card
          is native to their wallet or POS from the moment it exists. Set a fulfilment URL in the
          dashboard, and Vault will POST to it once per card:
        </p>
        <Pre>{`POST https://api.yourcompany.com/vault/mint
x-vault-signature: t=1731330000,v1=…
x-vault-idempotency-key: VLT-EUPCBV6S-2

{
  "event": "card.mint",
  "orderReference": "VLT-EUPCBV6S",
  "product": "chowdeck-gift-card",
  "amountMinor": 1000000,
  "currency": "NGN",
  "mode": "live",
  "expiresAt": "2027-11-11T00:00:00.000Z"
}`}</Pre>
        <p>Answer with the code you minted:</p>
        <Pre>{`{ "code": "CHW-8812-2231", "pin": "4418", "externalId": "wallet_9912" }`}</Pre>

        <Callout title="Honour the idempotency key">
          <p>
            Vault does not retry this call. If it times out, the order fails and the buyer is
            refunded — because a blind retry risks you issuing two cards while Vault charges for
            one, and issuing value twice is worse than failing a sale.
          </p>
          <p className="mt-2">
            If you key off <Code>x-vault-idempotency-key</Code> and return the same card for a
            repeat, a retry becomes free and that failure mode disappears.
          </p>
        </Callout>
      </Section>

      <Section title="Errors">
        <p>
          Every failure is <Code>{'{ "success": false, "error": { "message": … } }'}</Code> with a
          meaningful status. The ones worth handling explicitly:
        </p>
        <Table
          head={['Status', 'Means']}
          rows={[
            ['401', 'The key is missing, wrong, or not one of ours'],
            ['403', 'Right key, wrong side — a distributor key cannot redeem'],
            ['400', 'Not enough balance, an amount the product does not offer, a spent card'],
            ['404', 'No such product, order, or card'],
            ['502', "A merchant's own minting endpoint failed; the order was refunded"],
          ]}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="display-tight text-xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted [&_p]:text-pretty">
        {children}
      </div>
    </section>
  );
}

function Endpoint({ method, path, note }: { method: string; path: string; note: string }) {
  return (
    <p className="flex flex-wrap items-center gap-2 pt-2">
      <span className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-medium uppercase text-body">
        {method}
      </span>
      <code className="font-mono text-sm text-body">{path}</code>
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">{note}</span>
    </p>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded border border-line bg-surface-2 px-1 py-0.5 font-mono text-[12px] text-body">
      {children}
    </code>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-line bg-surface-2/60 p-4 font-mono text-[12px] leading-relaxed text-body">
      {children}
    </pre>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            {head.map((cell) => (
              <th key={cell} className="px-4 py-2.5 font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) => (
                <td
                  key={cell}
                  className={index === 0 ? 'px-4 py-2.5 font-mono text-xs text-body' : 'px-4 py-2.5 text-muted'}
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

function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-warning/50 bg-warning/10 p-4">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-body">
        {title}
      </p>
      <div className="mt-2 text-xs leading-relaxed text-body/80">{children}</div>
    </div>
  );
}
