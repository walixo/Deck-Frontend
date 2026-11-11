import { naira } from '../format';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { RequestError } from '@/lib/api';
import { ModeSwitch, Panel, Row, SecretReveal, StatusChip } from '../components';
import {
  useCreatePartner,
  useLedger,
  useMintKey,
  useMyPartner,
  useShop,
  useTopUp,
  useUpdatePartner,
  type VaultMode,
} from '../useVault';

/**
 * The distributor's side: keys, a balance, and the catalogue they can buy from.
 *
 * There is no "place an order" button here on purpose. Ordering is a server
 * call made with a secret key, and a browser form that did it would either
 * need the key in the page or a second, session-authenticated ordering path
 * that the API docs do not describe. One way to buy, and it is the documented
 * one.
 */
export function PartnerDashboard() {
  const { isAuthenticated } = useAuth();
  const { data: partner, isLoading } = useMyPartner();
  const [mode, setMode] = useState<VaultMode>('test');

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="display-tight text-2xl">Sign in to distribute cards</h1>
        <p className="mt-2 text-sm text-muted">Vault uses your Deck account.</p>
        <a
          href={`https://onedeck.africa/login?next=${encodeURIComponent(window.location.href)}`}
          className="mt-6 inline-block rounded-xl bg-deep px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-on-deep"
        >
          Sign in on Deck
        </a>
      </div>
    );
  }

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-muted">Loading…</div>;
  }
  if (!partner) return <CreatePartnerForm />;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display-tight text-3xl">{partner.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <StatusChip status={partner.status} /> distributor account
          </p>
        </div>
        <ModeSwitch mode={mode} onChange={setMode} />
      </header>

      <Panel title="Balance" description="Orders debit this. Test and live are separate pots.">
        <dl className="grid gap-x-8 sm:grid-cols-2">
          <Row label="Sandbox">{naira(partner.balances.test)}</Row>
          <Row label="Live">{naira(partner.balances.live)}</Row>
        </dl>
        <TopUpForm mode={mode} />
      </Panel>

      <Keys partner={partner} />
      <Wallet mode={mode} />
      <Catalogue />
      <Webhook partner={partner} />
    </div>
  );
}

function CreatePartnerForm() {
  const create = useCreatePartner();
  const [form, setForm] = useState({ name: '', website: '' });
  const error = create.error instanceof RequestError ? create.error : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="display-tight text-3xl text-balance">Start distributing</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
        You get sandbox keys and a play balance immediately. Nothing to pay, and nobody to talk to
        before your first test order.
      </p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate({ name: form.name.trim(), website: form.website.trim() || undefined });
        }}
      >
        {error && <InlineAlert>{error.message}</InlineAlert>}

        <Input
          label="Business name"
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Payhub"
          error={error?.fieldError('name')}
        />
        <Input
          label="Website"
          type="url"
          value={form.website}
          onChange={(event) => setForm({ ...form, website: event.target.value })}
          placeholder="https://payhub.example"
        />

        <Button type="submit" size="lg" className="w-full" loading={create.isPending}>
          Create account
        </Button>
      </form>
    </div>
  );
}

function TopUpForm({ mode }: { mode: VaultMode }) {
  const topUp = useTopUp();
  const [amount, setAmount] = useState('');
  const error = topUp.error instanceof RequestError ? topUp.error : null;

  return (
    <form
      className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-5"
      onSubmit={(event) => {
        event.preventDefault();
        topUp.mutate(
          { mode, amount: Number(amount) },
          {
            onSuccess: (result) => {
              setAmount('');
              /* Live top-ups go off to Bachs; sandbox ones are already done. */
              if (result.checkoutUrl) window.location.href = result.checkoutUrl;
            },
          },
        );
      }}
    >
      <div className="min-w-40 flex-1">
        <Input
          label={`Top up ${mode} balance (₦)`}
          type="number"
          min={1}
          step={1}
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="50000"
        />
      </div>
      <Button type="submit" loading={topUp.isPending}>
        {mode === 'test' ? 'Add play money' : 'Pay'}
      </Button>
      {error && <div className="w-full"><InlineAlert>{error.message}</InlineAlert></div>}
    </form>
  );
}

function Keys({ partner }: { partner: NonNullable<ReturnType<typeof useMyPartner>['data']> }) {
  const mint = useMintKey('partner');

  return (
    <Panel
      title="API keys"
      description="A live key needs an approved account. Sandbox works straight away."
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
              {partner.keys[mode] ? `vlt_${mode}_…${partner.keys[mode]!.hint}` : 'none yet'}
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="ml-auto"
              onClick={() => mint.mutate(mode)}
              loading={mint.isPending && mint.variables === mode}
            >
              {partner.keys[mode] ? 'Replace' : 'Create'}
            </Button>
          </div>
        ))}
      </div>

      {mint.error instanceof RequestError && (
        <div className="mt-3"><InlineAlert>{mint.error.message}</InlineAlert></div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Replacing a key takes effect immediately and the old one stops working. See the{' '}
        <Link to="/docs" className="underline underline-offset-4">
          API docs
        </Link>{' '}
        for how to use them.
      </p>
    </Panel>
  );
}

function Wallet({ mode }: { mode: VaultMode }) {
  const { data } = useLedger(mode);
  if (!data) return null;

  return (
    <Panel title="Statement" description={`Every movement on the ${mode} balance.`}>
      {data.entries.length ? (
        <ul className="divide-y divide-line">
          {data.entries.map((entry) => (
            <li key={entry.reference} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-mono text-xs">{entry.reference}</p>
                <p className="text-[11px] text-muted">
                  {entry.kind}
                  {entry.note && ` · ${entry.note}`} ·{' '}
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
              <p
                className={`shrink-0 text-sm tabular-nums ${
                  entry.amountMinor < 0 ? 'text-muted' : 'text-success'
                }`}
              >
                {entry.amountMinor < 0 ? '−' : '+'}
                {naira(Math.abs(entry.amountMinor))}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nothing on this balance yet.</p>
      )}
    </Panel>
  );
}

function Catalogue() {
  const { data } = useShop();

  return (
    <Panel
      title="Catalogue"
      description="What you can buy. The ids are what you send as `product` in an order."
    >
      {data?.length ? (
        <ul className="space-y-3">
          {data.map((issuer) => (
            <li key={issuer.slug} className="rounded-2xl border border-line p-4">
              <p className="font-display text-sm">{issuer.name}</p>
              <ul className="mt-2 space-y-1">
                {issuer.products.map((product) => (
                  <li key={product.slug} className="flex flex-wrap items-baseline gap-x-3 text-xs">
                    <code className="font-mono text-body">
                      {issuer.slug}/{product.slug}
                    </code>
                    <span className="text-muted">
                      {product.denominationsMinor.map((value) => naira(value)).join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No merchants are live yet.</p>
      )}
    </Panel>
  );
}

function Webhook({ partner }: { partner: NonNullable<ReturnType<typeof useMyPartner>['data']> }) {
  const update = useUpdatePartner();
  const [url, setUrl] = useState(partner.webhookUrl ?? '');
  const error = update.error instanceof RequestError ? update.error : null;

  return (
    <Panel title="Webhook" description="Where Vault tells you an order was fulfilled. Optional — the API is pollable.">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          update.mutate({ webhookUrl: url.trim() });
        }}
      >
        <div className="min-w-48 flex-1">
          <Input
            label="Endpoint"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://api.payhub.example/vault/hooks"
            error={error?.fieldError('webhookUrl')}
          />
        </div>
        <Button type="submit" loading={update.isPending}>
          Save
        </Button>
      </form>
      {error && !error.fieldError('webhookUrl') && (
        <div className="mt-3"><InlineAlert>{error.message}</InlineAlert></div>
      )}
    </Panel>
  );
}
