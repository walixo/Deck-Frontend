import {
  ArrowsRightLeftIcon,
  BoltIcon,
  BuildingStorefrontIcon,
  CodeBracketIcon,
  CreditCardIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { Backdrop } from '@/components/ui/Ambient';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useVaultStats } from '../useVault';

/**
 * What Vault is, for the two audiences who land here from different places.
 *
 * A merchant arrives asking "can I sell my own gift cards"; a developer
 * arrives asking "can I buy other people's through one API". The page answers
 * both without making either read the other's half first — hence two columns
 * rather than one argument.
 */
export function VaultLanding() {
  const { data: stats } = useVaultStats();

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Backdrop pattern="grid" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
              <BoltIcon aria-hidden="true" className="size-3.5" />
              Gift card infrastructure
            </p>

            <h1 className="display-tight mt-6 text-4xl text-balance sm:text-6xl">
              Your gift cards, everywhere your customers already are.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted text-pretty">
              Vault is two things at once. Merchants list a gift card and are selling it the same
              day. Businesses connect once and can buy from every merchant on the platform through
              a single API.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to="/issue" size="lg">
                Issue your cards
              </ButtonLink>
              <ButtonLink to="/distribute" variant="secondary" size="lg">
                Start distributing
              </ButtonLink>
            </div>

            {stats && (
              <dl className="mt-14 flex flex-wrap gap-x-10 gap-y-4">
                <Stat label="Merchants issuing" value={stats.issuers} />
                <Stat label="Cards on sale" value={stats.products} />
                <Stat label="Orders fulfilled" value={stats.orders} />
              </dl>
            )}
          </div>
        </div>
      </section>

      {/* The two sides, side by side. */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <Side
            icon={BuildingStorefrontIcon}
            eyebrow="For merchants"
            title="List a card. Be selling by lunchtime."
            points={[
              'Set your denominations and the discount you offer distributors.',
              'Vault mints the codes, holds the balances and handles redemption — or calls your own system to mint them, if the card should be native to your wallet.',
              'Redeem from a dashboard console, or from your till through one API call.',
              'See what you have sold, what you are owed, and what is still outstanding against you.',
            ]}
            cta={{ to: '/issue', label: 'Set up a card programme' }}
          />

          <Side
            icon={ArrowsRightLeftIcon}
            eyebrow="For distributors"
            title="One integration. Every merchant."
            points={[
              'Sandbox keys and a play balance the moment you sign up — no call first.',
              'Browse the catalogue, place an order, get codes back in the same response.',
              'Prepay a wallet; orders debit it. Idempotency keys so a retry never buys twice.',
              'Webhooks when an order is fulfilled, if you would rather not poll.',
            ]}
            cta={{ to: '/distribute', label: 'Get a sandbox key' }}
          />
        </div>
      </section>

      {/* How the money actually moves — the question both sides ask third. */}
      <section className="border-y border-line bg-surface-2/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="display-tight text-2xl text-balance sm:text-3xl">
            Where the money goes
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
            A distributor pays below face value. That discount is the merchant&rsquo;s offer and the
            distributor&rsquo;s margin — Deck&rsquo;s fee comes out of what is actually charged, never
            out of the gap.
          </p>

          <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-surface">
            <table className="w-full text-sm">
              <caption className="sr-only">
                A worked example of a ten thousand naira card at an eight percent discount
              </caption>
              <tbody className="divide-y divide-line">
                <MoneyRow label="Face value" detail="What the card is worth to whoever holds it" value="₦10,000" />
                <MoneyRow label="Merchant's discount" detail="8%, set by the merchant" value="−₦800" />
                <MoneyRow label="Distributor pays" detail="Debited from their Vault balance" value="₦9,200" strong />
                <MoneyRow label="Deck's fee" detail="3% of the charge" value="−₦276" />
                <MoneyRow label="Merchant is owed" detail="Settled on Deck's normal payout cycle" value="₦8,924" strong />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-3">
          <Feature
            icon={ShieldCheckIcon}
            title="Codes are encrypted, not just hashed"
            body="A card has to be readable by the person who bought it, so a hash alone would make the product impossible. Codes are encrypted with a key that is not in the database — a dump on its own yields nothing."
          />
          <Feature
            icon={CreditCardIcon}
            title="Partial redemption, properly"
            body="A card carries a balance, not a used flag. Spend ₦3,000 of ₦10,000 and the rest stays live. Two tills hitting the same card at once cannot both spend it."
          />
          <Feature
            icon={CodeBracketIcon}
            title="Test and live are separate"
            body="Separate keys, separate balances, separate cards. A sandbox code cannot be walked into production, and play money cannot buy a real card."
          />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-surface p-6">
          <div className="min-w-0 flex-1">
            <h3 className="display-tight text-lg">Just want to send someone a card?</h3>
            <p className="mt-1 text-sm text-muted">
              Every live merchant has a shop here. Buy one for yourself or send it with a message.
            </p>
          </div>
          <ButtonLink to="/shop" variant="secondary">
            Browse the shop
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="font-display text-3xl tabular-nums">{value}</dd>
      <dt className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{label}</dt>
    </div>
  );
}

function Side({
  icon: Icon,
  eyebrow,
  title,
  points,
  cta,
}: {
  icon: typeof BoltIcon;
  eyebrow: string;
  title: string;
  points: string[];
  cta: { to: string; label: string };
}) {
  return (
    <Card className="flex flex-col p-6 sm:p-8">
      <Icon aria-hidden="true" className="size-7 text-accent" />
      <p className="mt-4 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
        {eyebrow}
      </p>
      <h2 className="display-tight mt-2 text-2xl text-balance">{title}</h2>

      <ul className="mt-5 flex-1 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-muted text-pretty">
            <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
            {point}
          </li>
        ))}
      </ul>

      <div className="mt-7">
        <Link
          to={cta.to}
          className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-body underline-offset-4 hover:underline"
        >
          {cta.label} →
        </Link>
      </div>
    </Card>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof BoltIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-5">
      <Icon aria-hidden="true" className="size-5 text-muted" />
      <h3 className="display-tight mt-3 text-base">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">{body}</p>
    </div>
  );
}

function MoneyRow({
  label,
  detail,
  value,
  strong = false,
}: {
  label: string;
  detail: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <tr>
      <th scope="row" className="px-5 py-3.5 text-left align-top">
        <span className={strong ? 'font-display' : 'text-body'}>{label}</span>
        <span className="mt-0.5 block text-xs font-normal text-muted">{detail}</span>
      </th>
      <td className={`px-5 py-3.5 text-right tabular-nums ${strong ? 'font-display' : 'text-muted'}`}>
        {value}
      </td>
    </tr>
  );
}
