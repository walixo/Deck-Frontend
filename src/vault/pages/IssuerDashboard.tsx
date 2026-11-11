import { naira } from '../format';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { RequestError } from '@/lib/api';
import { ModeSwitch, Panel, Row, SecretReveal, StatusChip } from '../components';
import {
  useConsoleRedeem,
  useCreateIssuer,
  useIssuerOrders,
  useIssuerSummary,
  useMintKey,
  useMyIssuer,
  useMyProducts,
  usePauseProduct,
  useRedemptions,
  useSaveProduct,
  useSubmitIssuer,
  useUpdateIssuer,
  type VaultMode,
} from '../useVault';

/**
 * The merchant's side of Vault.
 *
 * Deliberately one scrolling page rather than a sidebar of sections. A
 * merchant's whole job here is small — a programme, a few cards, the money,
 * and a box to type a code into — and splitting four short sections across
 * four routes would turn a two-minute setup into a hunt.
 */
export function IssuerDashboard() {
  const { isAuthenticated } = useAuth();
  const { data: issuer, isLoading } = useMyIssuer();
  const [mode, setMode] = useState<VaultMode>('live');

  if (!isAuthenticated) return <SignInFirst what="issue gift cards" />;
  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-muted">Loading…</div>;
  if (!issuer) return <CreateIssuerForm />;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display-tight text-3xl">{issuer.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <StatusChip status={issuer.status} />
            vault.onedeck.africa/shop/{issuer.slug}
          </p>
        </div>
        <ModeSwitch mode={mode} onChange={setMode} />
      </header>

      {issuer.status === 'draft' && <SubmitPrompt />}
      {issuer.status === 'rejected' && issuer.reviewNote && (
        <InlineAlert>{issuer.reviewNote}</InlineAlert>
      )}

      <Money />
      <Products />
      <RedeemConsole mode={mode} />
      <Redemptions />
      <Orders mode={mode} />
      <Settings issuer={issuer} />
      <Keys issuer={issuer} />
    </div>
  );
}

function SignInFirst({ what }: { what: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="display-tight text-2xl">Sign in to {what}</h1>
      <p className="mt-2 text-sm text-muted">
        Vault uses your Deck account. If you have one, you are one click away.
      </p>
      <a
        href={`https://onedeck.africa/login?next=${encodeURIComponent(window.location.href)}`}
        className="mt-6 inline-block rounded-xl bg-deep px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-on-deep"
      >
        Sign in on Deck
      </a>
    </div>
  );
}

/* ----------------------------------------------------------------- set up */

function CreateIssuerForm() {
  const create = useCreateIssuer();
  const [form, setForm] = useState({ name: '', tagline: '', discountPercent: '8' });
  const error = create.error instanceof RequestError ? create.error : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="display-tight text-3xl text-balance">Set up a card programme</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
        Two fields to start. You can add cards, artwork and terms before anything goes live.
      </p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate({
            name: form.name.trim(),
            tagline: form.tagline.trim() || undefined,
            discountPercent: Number(form.discountPercent) || 0,
          });
        }}
      >
        {error && <InlineAlert>{error.message}</InlineAlert>}

        <Input
          label="Business name"
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Chowdeck"
          error={error?.fieldError('name')}
        />
        <Input
          label="One line about it"
          value={form.tagline}
          onChange={(event) => setForm({ ...form, tagline: event.target.value })}
          placeholder="Groceries and meals, delivered in minutes"
        />
        <Input
          label="Distributor discount (%)"
          type="number"
          min={0}
          max={90}
          step={0.5}
          value={form.discountPercent}
          onChange={(event) => setForm({ ...form, discountPercent: event.target.value })}
          hint="How far below face value a business buys at. This is what makes anyone want to resell your card."
        />

        <Button type="submit" size="lg" className="w-full" loading={create.isPending}>
          Create programme
        </Button>
      </form>
    </div>
  );
}

function SubmitPrompt() {
  const submit = useSubmitIssuer();
  const error = submit.error instanceof RequestError ? submit.error : null;

  return (
    <div className="rounded-3xl border border-line bg-surface-2/50 p-5">
      <h2 className="display-tight text-base">Ready to go live?</h2>
      <p className="mt-1 text-sm text-muted">
        Add at least one card, then submit. Deck reviews programmes before they can be sold to
        distributors.
      </p>
      {error && <div className="mt-3"><InlineAlert>{error.message}</InlineAlert></div>}
      <Button className="mt-4" onClick={() => submit.mutate()} loading={submit.isPending}>
        Submit for review
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ money */

function Money() {
  const { data } = useIssuerSummary();
  if (!data) return null;

  return (
    <Panel title="Money" description="Live cards only. Test orders are play money and are excluded.">
      <dl className="grid gap-x-8 sm:grid-cols-2">
        <Row label="Sold (face value)">{naira(data.soldMinor)}</Row>
        <Row label="You are owed">{naira(data.owedMinor)}</Row>
        <Row label="Outstanding on live cards">{naira(data.outstandingMinor)}</Row>
        <Row label="Cards issued">{data.cardsIssued}</Row>
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        <strong className="font-display">Outstanding</strong> is face value sitting unredeemed on
        live cards — your liability, not your revenue. It falls as people spend.
      </p>
    </Panel>
  );
}

/* --------------------------------------------------------------- products */

const BLANK = {
  id: undefined as string | undefined,
  name: '',
  denominations: '2000, 5000, 10000',
  discountPercent: '',
  redeemInstructions: '',
};

function Products() {
  const { data: products } = useMyProducts();
  const save = useSaveProduct();
  const pause = usePauseProduct();
  const [draft, setDraft] = useState<typeof BLANK | null>(null);
  const error = save.error instanceof RequestError ? save.error : null;

  return (
    <Panel
      title="Cards"
      description="Each card is a product people buy. Amounts are in naira."
      action={
        !draft && (
          <Button size="sm" variant="secondary" onClick={() => setDraft({ ...BLANK })}>
            Add a card
          </Button>
        )
      }
    >
      {draft && (
        <form
          className="mb-6 space-y-4 rounded-2xl border border-line bg-surface-2/40 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(
              {
                id: draft.id,
                name: draft.name.trim(),
                denominationType: 'fixed',
                denominations: draft.denominations
                  .split(',')
                  .map((part) => Number(part.trim()))
                  .filter((value) => Number.isFinite(value) && value > 0),
                discountPercent: draft.discountPercent === '' ? null : Number(draft.discountPercent),
                redeemInstructions: draft.redeemInstructions.trim() || undefined,
              },
              { onSuccess: () => setDraft(null) },
            );
          }}
        >
          {error && <InlineAlert>{error.message}</InlineAlert>}

          <Input
            label="Card name"
            required
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Chowdeck Gift Card"
            error={error?.fieldError('name')}
          />
          <Input
            label="Amounts (₦, comma separated)"
            required
            value={draft.denominations}
            onChange={(event) => setDraft({ ...draft, denominations: event.target.value })}
            placeholder="2000, 5000, 10000, 20000"
            error={error?.fieldError('denominations')}
          />
          <Input
            label="Discount override (%)"
            type="number"
            min={0}
            max={90}
            step={0.5}
            value={draft.discountPercent}
            onChange={(event) => setDraft({ ...draft, discountPercent: event.target.value })}
            hint="Leave empty to use your programme's rate."
          />
          <Textarea
            label="How to redeem it"
            value={draft.redeemInstructions}
            onChange={(event) => setDraft({ ...draft, redeemInstructions: event.target.value })}
            placeholder="Enter the code in the app under Wallet → Redeem."
          />

          <div className="flex gap-2">
            <Button type="submit" loading={save.isPending}>
              {draft.id ? 'Save card' : 'Add card'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {products?.length ? (
        <ul className="space-y-2">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-line px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-display text-sm">
                  {product.name}
                  <StatusChip status={product.status ?? 'active'} />
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted">
                  {product.denominationsMinor.map((value) => naira(value)).join(' · ')} ·{' '}
                  {product.effectiveDiscountPercent}% off for distributors
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setDraft({
                    id: product.id,
                    name: product.name,
                    denominations: product.denominationsMinor.map((v) => v / 100).join(', '),
                    discountPercent: product.discountPercent == null ? '' : String(product.discountPercent),
                    redeemInstructions: product.redeemInstructions ?? '',
                  })
                }
              >
                Edit
              </Button>
              {product.status === 'active' && (
                <Button size="sm" variant="ghost" onClick={() => pause.mutate(product.id!)}>
                  Pause
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !draft && <p className="text-sm text-muted">No cards yet. Add one to start selling.</p>
      )}
    </Panel>
  );
}

/* ----------------------------------------------------------------- redeem */

function RedeemConsole({ mode }: { mode: VaultMode }) {
  const redeem = useConsoleRedeem(mode);
  const [form, setForm] = useState({ code: '', pin: '', amount: '' });
  const error = redeem.error instanceof RequestError ? redeem.error : null;

  return (
    <Panel
      title="Redeem a card"
      description="For a till without an integration. The API does the same thing — see the docs."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          redeem.mutate({
            code: form.code.trim(),
            pin: form.pin.trim() || undefined,
            amount: form.amount ? Number(form.amount) : undefined,
          });
        }}
      >
        {error && <InlineAlert>{error.message}</InlineAlert>}
        {redeem.data && (
          <InlineAlert tone="success">
            Redeemed {naira(redeem.data.redeemedMinor)} — {naira(redeem.data.balanceMinor)} left on
            the card ({redeem.data.status}).
          </InlineAlert>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Input
              label="Card code"
              required
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              placeholder="VLT-XXXX-XXXX-XXXX"
              className="font-mono"
            />
          </div>
          <Input
            label="PIN"
            value={form.pin}
            onChange={(event) => setForm({ ...form, pin: event.target.value })}
            placeholder="4 digits"
            inputMode="numeric"
          />
        </div>

        <Input
          label="Amount to take (₦)"
          type="number"
          min={0}
          step={0.01}
          value={form.amount}
          onChange={(event) => setForm({ ...form, amount: event.target.value })}
          hint="Leave empty to spend whatever is left on the card."
        />

        <Button type="submit" loading={redeem.isPending}>
          Redeem
        </Button>
      </form>
    </Panel>
  );
}

function Redemptions() {
  const { data } = useRedemptions();
  if (!data?.length) return null;

  return (
    <Panel title="Recent redemptions">
      <ul className="divide-y divide-line">
        {data.slice(0, 10).map((entry) => (
          <li key={entry.reference} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="font-mono text-xs">{entry.reference}</p>
              <p className="text-[11px] text-muted">
                {entry.source.replace('_', ' ')} · {new Date(entry.createdAt).toLocaleString()}
              </p>
            </div>
            <p className="shrink-0 text-sm tabular-nums">
              −{naira(entry.amountMinor)}
              <span className="ml-2 text-[11px] text-muted">
                {naira(entry.balanceAfterMinor)} left
              </span>
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Orders({ mode }: { mode: VaultMode }) {
  const { data } = useIssuerOrders(mode);

  return (
    <Panel title="Sales" description={`Orders placed in ${mode} mode.`}>
      {data?.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                <th className="py-2 pr-3 font-medium">Reference</th>
                <th className="py-2 pr-3 font-medium">Buyer</th>
                <th className="py-2 pr-3 text-right font-medium">Qty</th>
                <th className="py-2 pr-3 text-right font-medium">Face</th>
                <th className="py-2 text-right font-medium">You get</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((order) => (
                <tr key={order.reference}>
                  <td className="py-2.5 pr-3 font-mono text-xs">{order.reference}</td>
                  <td className="py-2.5 pr-3">{order.buyer}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{order.quantity}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{naira(order.faceTotalMinor)}</td>
                  <td className="py-2.5 text-right tabular-nums">{naira(order.issuerNetMinor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted">No {mode} orders yet.</p>
      )}
    </Panel>
  );
}

/* --------------------------------------------------------------- settings */

function Settings({ issuer }: { issuer: NonNullable<ReturnType<typeof useMyIssuer>['data']> }) {
  const update = useUpdateIssuer();
  const [form, setForm] = useState({
    tagline: issuer.tagline,
    description: issuer.description,
    terms: issuer.terms,
    discountPercent: String(issuer.discountPercent),
    fulfilment: issuer.fulfilment,
    fulfilUrl: issuer.fulfilUrl ?? '',
  });
  const error = update.error instanceof RequestError ? update.error : null;

  return (
    <Panel title="Programme settings">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          update.mutate({
            tagline: form.tagline,
            description: form.description,
            terms: form.terms,
            discountPercent: Number(form.discountPercent),
            fulfilment: form.fulfilment,
            fulfilUrl: form.fulfilment === 'merchant' ? form.fulfilUrl : '',
          });
        }}
      >
        {error && <InlineAlert>{error.message}</InlineAlert>}
        {update.isSuccess && <InlineAlert tone="success">Saved.</InlineAlert>}

        <Input
          label="Tagline"
          value={form.tagline}
          onChange={(event) => setForm({ ...form, tagline: event.target.value })}
        />
        <Textarea
          label="About"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <Textarea
          label="Terms"
          value={form.terms}
          onChange={(event) => setForm({ ...form, terms: event.target.value })}
          hint="Shown to a buyer before they pay, and on the card."
        />
        <Input
          label="Distributor discount (%)"
          type="number"
          min={0}
          max={90}
          step={0.5}
          value={form.discountPercent}
          onChange={(event) => setForm({ ...form, discountPercent: event.target.value })}
        />

        <Select
          label="Who mints the codes"
          value={form.fulfilment}
          onChange={(event) =>
            setForm({ ...form, fulfilment: event.target.value as 'deck' | 'merchant' })
          }
          options={[
            { value: 'deck', label: 'Vault — nothing to build' },
            { value: 'merchant', label: 'My own system — Vault calls my API' },
          ]}
          hint="Switching this puts a live programme back into review."
        />

        {form.fulfilment === 'merchant' && (
          <>
            <Input
              label="Fulfilment URL"
              type="url"
              required
              value={form.fulfilUrl}
              onChange={(event) => setForm({ ...form, fulfilUrl: event.target.value })}
              placeholder="https://api.yourcompany.com/vault/mint"
              hint="Vault POSTs here to have each code minted. Must be https."
              error={error?.fieldError('fulfilUrl')}
            />
            <p className="rounded-2xl border border-line bg-surface-2/50 p-4 text-xs leading-relaxed text-muted">
              Vault signs each call with your fulfilment secret and sends an{' '}
              <code className="font-mono">x-vault-idempotency-key</code>. Honour that key: a retry
              must return the same card. If it does not, Vault fails the order and refunds rather
              than risk issuing twice. See the API docs.
            </p>
          </>
        )}

        <Button type="submit" loading={update.isPending}>
          Save
        </Button>
      </form>
    </Panel>
  );
}

function Keys({ issuer }: { issuer: NonNullable<ReturnType<typeof useMyIssuer>['data']> }) {
  const mint = useMintKey('issuer');

  return (
    <Panel
      title="Till keys"
      description="For checking and redeeming cards from your own systems. These cannot buy anything."
    >
      {mint.data && <div className="mb-4"><SecretReveal label={`${mint.data.mode} key`} value={mint.data.key} /></div>}

      <div className="space-y-2">
        {(['test', 'live'] as const).map((mode) => (
          <div
            key={mode}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-line px-4 py-3"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              {mode}
            </span>
            <span className="font-mono text-xs">
              {issuer.keys[mode] ? `vli_${mode}_…${issuer.keys[mode]!.hint}` : 'none yet'}
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="ml-auto"
              onClick={() => mint.mutate(mode)}
              loading={mint.isPending && mint.variables === mode}
            >
              {issuer.keys[mode] ? 'Replace' : 'Create'}
            </Button>
          </div>
        ))}
      </div>

      {mint.error instanceof RequestError && (
        <div className="mt-3"><InlineAlert>{mint.error.message}</InlineAlert></div>
      )}
    </Panel>
  );
}
