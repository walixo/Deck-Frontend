import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GameForm } from '@/components/deckgames/GameForm';
import {
  GButton,
  GCard,
  GDialog,
  GInput,
  GNotice,
  GSelect,
  SecretReveal,
  StatusDot,
} from '@/components/deckgames/ui';
import { useAuth } from '@/hooks/useAuth';
import {
  useCreateProduct,
  useDeveloperView,
  useGameSales,
  useMintKey,
  useMintWebhookSecret,
  useResendWebhook,
  useTestWebhook,
  useUpdateDeveloperSettings,
  useUpdateProduct,
} from '@/hooks/useGamePlatform';
import { useUpdateGame } from '@/hooks/useGames';
import { RequestError } from '@/lib/api';
import { cn, formatMoney, relativeTime } from '@/lib/utils';
import type { GameDeveloperView, GameMode, GameOrientation, GameProduct } from '@/types';

/**
 * `/games/developers/:slug` — everything a developer manages for one game.
 *
 * Five tabs, in the order a developer needs them: where things stand, the
 * keys and webhook that connect their server, what the game sells, what has
 * sold, and the game's own details.
 */
type Tab = 'overview' | 'keys' | 'store' | 'sales' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'keys', label: 'Keys & webhooks' },
  { id: 'store', label: 'Store' },
  { id: 'sales', label: 'Sales' },
  { id: 'settings', label: 'Settings' },
];

export function DevGame() {
  const { slug = '' } = useParams();
  const { data, isLoading, error } = useDeveloperView(slug);
  const [tab, setTab] = useState<Tab>('overview');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-28 sm:px-6">
        <div className="h-12 w-72 animate-pulse rounded-full bg-g-paper-2" />
        <div className="mt-8 h-64 animate-pulse rounded-3xl bg-g-paper-2" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-24 pt-32 text-center sm:px-6">
        <p className="text-3xl font-medium tracking-[-0.04em]">Not one of yours</p>
        <p className="mt-3 text-sm text-g-mute">
          {error?.message ?? 'We could not find that game.'}
        </p>
        <Link
          to="/games/developers"
          className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.16em] text-g-ember-ink hover:underline"
        >
          ← Your games
        </Link>
      </div>
    );
  }

  const { game } = data;

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-24 sm:px-6 sm:pt-28">
      <title>{`${game.title} — Developer — Deck Games`}</title>
      <Link
        to="/games/developers"
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-g-mute hover:text-g-ink"
      >
        ← Your games
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(2rem,4.6vw,3.5rem)] font-medium leading-[1] tracking-[-0.05em]">
            {game.title}
          </h1>
          <div className="mt-3">
            <StatusDot status={game.status} />
          </div>
        </div>
        <Link
          to={`/games/${game.slug}${game.status === 'approved' ? '?mode=test' : ''}`}
          className="rounded-[3px] bg-g-ink px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-g-paper"
        >
          Play in test mode
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Developer sections"
        className="mt-10 flex gap-1 overflow-x-auto border-b border-g-line"
      >
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            onClick={() => setTab(entry.id)}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-3 py-3 text-[13px] font-medium tracking-[-0.01em] transition-colors',
              tab === entry.id
                ? 'border-g-ember text-g-ink'
                : 'border-transparent text-g-mute hover:text-g-ink',
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'overview' && <Overview view={data} onGo={setTab} />}
        {tab === 'keys' && <Keys view={data} />}
        {tab === 'store' && <Store view={data} />}
        {tab === 'sales' && <Sales slug={game.slug} />}
        {tab === 'settings' && <Settings view={data} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ overview */

function Overview({ view, onGo }: { view: GameDeveloperView; onGo: (tab: Tab) => void }) {
  const { game, settings, products, sales } = view;
  const steps: { done: boolean; label: string; tab?: Tab; hint: string }[] = [
    {
      done: settings.sdk,
      label: 'Add the SDK',
      tab: 'settings',
      hint: 'One script tag in your game.',
    },
    {
      done: Boolean(settings.keys.test),
      label: 'Create a test key',
      tab: 'keys',
      hint: 'For your server to verify players.',
    },
    {
      done: Boolean(settings.webhookUrl && settings.hasWebhookSecret),
      label: 'Connect a webhook',
      tab: 'keys',
      hint: 'So purchases reach your server.',
    },
    {
      done: products.length > 0,
      label: 'Add something to sell',
      tab: 'store',
      hint: 'Optional — free games are welcome.',
    },
    {
      done: sales.test.sales > 0,
      label: 'Make a test purchase',
      hint: 'Play in test mode and buy something.',
    },
    {
      done: game.status === 'approved',
      label: 'Pass review',
      hint:
        game.status === 'rejected'
          ? 'See the note below, fix and resubmit.'
          : 'Deck reviews every game before it goes live.',
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <GCard>
        <h2 className="text-lg font-medium tracking-[-0.03em]">Getting to live</h2>
        {game.status === 'rejected' && game.reviewNote && (
          <div className="mt-4">
            <GNotice tone="error">Reviewer’s note: {game.reviewNote}</GNotice>
          </div>
        )}
        <ol className="mt-5 space-y-1">
          {steps.map((step, index) => (
            <li key={step.label} className="flex items-center gap-4 rounded-2xl px-2 py-2.5">
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full font-mono text-[11px]',
                  step.done ? 'bg-g-ember text-g-on-ember' : 'border border-g-line text-g-mute',
                )}
              >
                {step.done ? '✓' : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-[14px] font-medium',
                    step.done && 'text-g-mute line-through decoration-g-line',
                  )}
                >
                  {step.label}
                </span>
                <span className="block text-[12px] text-g-mute">{step.hint}</span>
              </span>
              {step.tab && !step.done && (
                <button
                  type="button"
                  onClick={() => onGo(step.tab!)}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-g-ember-ink hover:underline"
                >
                  Do it →
                </button>
              )}
            </li>
          ))}
        </ol>
      </GCard>

      <div className="space-y-4">
        <Totals label="Live sales" totals={sales.live} currency={sales.currency} share />
        <Totals label="Test purchases" totals={sales.test} currency={sales.currency} />
        <p className="px-2 text-[12px] leading-relaxed text-g-mute">
          You keep {100 - view.feePercent}% of every live sale. It’s paid to your Bachs account 14
          days after the sale — set that up from{' '}
          <Link to="/games/developers" className="text-g-ink underline underline-offset-4">
            your games
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function Totals({
  label,
  totals,
  currency,
  share,
}: {
  label: string;
  totals: GameDeveloperView['sales']['live'];
  currency: string;
  share?: boolean;
}) {
  return (
    <GCard>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-mute">{label}</p>
      <p className="mt-2 text-3xl font-medium tracking-[-0.05em] tabular-nums">
        {formatMoney(share ? totals.developerShareMinor : totals.grossMinor, currency)}
      </p>
      <p className="mt-1 text-[12px] text-g-mute">
        {totals.sales} {totals.sales === 1 ? 'purchase' : 'purchases'}
        {share && ' · your share'}
        {totals.undelivered > 0 && ` · ${totals.undelivered} not yet delivered`}
      </p>
    </GCard>
  );
}

/* ---------------------------------------------------------------- keys */

function Keys({ view }: { view: GameDeveloperView }) {
  const slug = view.game.slug;
  const mint = useMintKey(slug);
  const secret = useMintWebhookSecret(slug);
  const save = useUpdateDeveloperSettings(slug);
  const ping = useTestWebhook(slug);
  const [revealed, setRevealed] = useState<{ label: string; value: string } | null>(null);
  const [confirm, setConfirm] = useState<GameMode | 'secret' | null>(null);
  const [webhookUrl, setWebhookUrl] = useState(view.settings.webhookUrl ?? '');

  const doMint = (what: GameMode | 'secret') => {
    setConfirm(null);
    if (what === 'secret') {
      secret.mutate(undefined, {
        onSuccess: ({ secret: value }) => setRevealed({ label: 'Webhook signing secret', value }),
      });
    } else {
      mint.mutate(what, {
        onSuccess: ({ key }) =>
          setRevealed({ label: `${what === 'test' ? 'Test' : 'Live'} API key`, value: key }),
      });
    }
  };

  const saveError =
    save.error instanceof RequestError
      ? (save.error.fieldError('webhookUrl') ?? save.error.message)
      : null;

  return (
    <div className="space-y-4">
      {revealed && <SecretReveal label={revealed.label} value={revealed.value} />}

      <GCard>
        <h2 className="text-lg font-medium tracking-[-0.03em]">API keys</h2>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-g-mute">
          Your server sends one as{' '}
          <code className="font-mono text-[12px]">Authorization: Bearer …</code> to Deck’s server
          API. Test keys only see test players and purchases; live keys only see live ones.
        </p>
        <ul className="mt-5 divide-y divide-g-line">
          {(['test', 'live'] as const).map((mode) => {
            const key = view.settings.keys[mode];
            return (
              <li key={mode} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <span>
                  <span className="block text-[14px] font-medium capitalize">{mode} key</span>
                  <span className="block font-mono text-[12px] text-g-mute">
                    {key
                      ? `dk_${mode}_••••${key.hint} · created ${relativeTime(key.createdAt)}`
                      : 'None yet'}
                  </span>
                  {mode === 'live' && view.game.status !== 'approved' && (
                    <span className="block text-[12px] text-g-mute">
                      Works once the game is approved.
                    </span>
                  )}
                </span>
                <GButton
                  small
                  tone={key ? 'ghost' : 'ink'}
                  loading={mint.isPending && mint.variables === mode}
                  onClick={() => (key ? setConfirm(mode) : doMint(mode))}
                >
                  {key ? 'Rotate' : 'Create'}
                </GButton>
              </li>
            );
          })}
        </ul>
      </GCard>

      <GCard>
        <h2 className="text-lg font-medium tracking-[-0.03em]">Webhook</h2>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-g-mute">
          Deck POSTs <code className="font-mono text-[12px]">purchase.paid</code> here the moment a
          purchase settles, signed with your secret. Retried for about nine hours if your server
          doesn’t answer 2xx.
        </p>
        <form
          className="mt-5 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ webhookUrl: webhookUrl.trim() || null });
          }}
        >
          <div className="min-w-[16rem] flex-1">
            <GInput
              label="Endpoint URL"
              type="url"
              placeholder="https://api.yourstudio.com/deck/webhook"
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
              error={saveError ?? undefined}
            />
          </div>
          <GButton type="submit" tone="ink" loading={save.isPending}>
            Save
          </GButton>
        </form>
        {save.isSuccess && !save.isPending && (
          <p className="mt-2 text-[12px] text-success">Saved.</p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-g-line pt-5">
          <span>
            <span className="block text-[14px] font-medium">Signing secret</span>
            <span className="block text-[12px] text-g-mute">
              {view.settings.hasWebhookSecret
                ? 'Set. Rotate it if it ever leaks.'
                : 'Create one before your first webhook.'}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <GButton
              small
              tone="ghost"
              loading={secret.isPending}
              onClick={() =>
                view.settings.hasWebhookSecret ? setConfirm('secret') : doMint('secret')
              }
            >
              {view.settings.hasWebhookSecret ? 'Rotate' : 'Create'}
            </GButton>
            <GButton
              small
              tone="ink"
              loading={ping.isPending}
              disabled={!view.settings.webhookUrl || !view.settings.hasWebhookSecret}
              onClick={() => ping.mutate()}
            >
              Send test ping
            </GButton>
          </div>
        </div>
        {ping.data && (
          <div className="mt-4">
            <GNotice tone={ping.data.ok ? 'success' : 'error'}>
              {ping.data.ok
                ? `Delivered — your server answered ${ping.data.status}.`
                : `Not delivered: ${ping.data.error}`}
            </GNotice>
          </div>
        )}
        {ping.error && (
          <div className="mt-4">
            <GNotice tone="error">{ping.error.message}</GNotice>
          </div>
        )}
      </GCard>

      <GDialog open={confirm !== null} onClose={() => setConfirm(null)} title="Rotate this secret?">
        <p className="text-[14px] leading-relaxed text-g-mute">
          The current one stops working the moment you confirm. Update your server straight after,
          or its calls{' '}
          {confirm === 'secret' ? 'will fail signature checks' : 'to Deck will be refused'}.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <GButton tone="ghost" onClick={() => setConfirm(null)}>
            Keep it
          </GButton>
          <GButton onClick={() => confirm && doMint(confirm)}>Rotate</GButton>
        </div>
      </GDialog>
    </div>
  );
}

/* --------------------------------------------------------------- store */

function Store({ view }: { view: GameDeveloperView }) {
  const slug = view.game.slug;
  const create = useCreateProduct(slug);
  const update = useUpdateProduct(slug);
  const [draft, setDraft] = useState({
    productId: '',
    name: '',
    description: '',
    price: '',
    type: 'one_off' as GameProduct['type'],
  });
  const failure = create.error instanceof RequestError ? create.error : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <GCard>
        <h2 className="text-lg font-medium tracking-[-0.03em]">Products</h2>
        {!view.products.length ? (
          <p className="mt-3 text-[13px] text-g-mute">
            Nothing for sale yet. Free games are welcome too.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-g-line">
            {view.products.map((product) => (
              <li
                key={product.productId}
                className={cn(
                  'flex flex-wrap items-center gap-3 py-3',
                  !product.active && 'opacity-50',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">{product.name}</span>
                  <span className="block font-mono text-[11px] text-g-mute">
                    {product.productId} · {product.type === 'one_off' ? 'one-off' : 'consumable'}
                  </span>
                </span>
                <span className="font-mono text-[12px] tabular-nums">
                  {formatMoney(product.priceMinor, product.currency)}
                </span>
                <GButton
                  small
                  tone="ghost"
                  onClick={() =>
                    update.mutate({ productId: product.productId, active: !product.active })
                  }
                >
                  {product.active ? 'Retire' : 'Restore'}
                </GButton>
              </li>
            ))}
          </ul>
        )}
      </GCard>

      <GCard>
        <h2 className="text-lg font-medium tracking-[-0.03em]">Add a product</h2>
        <form
          className="mt-4 space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(
              {
                productId: draft.productId.trim(),
                name: draft.name.trim(),
                description: draft.description.trim() || undefined,
                price: Number(draft.price),
                type: draft.type,
              },
              {
                onSuccess: () =>
                  setDraft({
                    productId: '',
                    name: '',
                    description: '',
                    price: '',
                    type: 'one_off',
                  }),
              },
            );
          }}
        >
          {failure && !failure.fields.length && <GNotice tone="error">{failure.message}</GNotice>}
          <GInput
            label="Product ID"
            placeholder="coins.100"
            value={draft.productId}
            onChange={(event) =>
              setDraft((current) => ({ ...current, productId: event.target.value }))
            }
            error={failure?.fieldError('productId')}
            hint="What your code passes to DeckGames.purchase()."
          />
          <GInput
            label="Name"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            error={failure?.fieldError('name')}
          />
          <GInput
            label="Description (optional)"
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({ ...current, description: event.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <GInput
              label="Price (₦)"
              type="number"
              inputMode="decimal"
              min={100}
              value={draft.price}
              onChange={(event) =>
                setDraft((current) => ({ ...current, price: event.target.value }))
              }
              error={failure?.fieldError('price')}
            />
            <GSelect
              label="Type"
              value={draft.type}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  type: event.target.value as GameProduct['type'],
                }))
              }
            >
              <option value="one_off">One-off</option>
              <option value="consumable">Consumable</option>
            </GSelect>
          </div>
          {Number(draft.price) >= 100 && (
            <p className="text-[12px] text-g-mute">
              You receive{' '}
              {formatMoney(
                Math.round(Number(draft.price) * 100 * (1 - view.feePercent / 100)),
                'NGN',
              )}{' '}
              per sale.
            </p>
          )}
          <GButton type="submit" loading={create.isPending}>
            Add product
          </GButton>
        </form>
      </GCard>
    </div>
  );
}

/* --------------------------------------------------------------- sales */

function Sales({ slug }: { slug: string }) {
  const [mode, setMode] = useState<GameMode>('live');
  const { data, isLoading } = useGameSales(slug, mode);
  const resend = useResendWebhook(slug);

  return (
    <GCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium tracking-[-0.03em]">Purchases</h2>
        <div className="flex rounded-full border border-g-line p-0.5">
          {(['live', 'test'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={cn(
                'rounded-full px-3 py-1 text-[12px] font-medium capitalize',
                mode === value ? 'bg-g-ink text-g-paper' : 'text-g-mute',
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 h-32 animate-pulse rounded-2xl bg-g-paper-2" />
      ) : !data?.data.length ? (
        <p className="mt-5 text-[13px] text-g-mute">
          {mode === 'live'
            ? 'No live sales yet.'
            : 'No test purchases yet — play in test mode and buy something.'}
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
              <tr>
                <th className="pb-3 font-normal">Purchase</th>
                <th className="pb-3 font-normal">Player</th>
                <th className="pb-3 font-normal">Status</th>
                <th className="pb-3 font-normal">Webhook</th>
                <th className="pb-3 text-right font-normal">Your share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-g-line">
              {data.data.map((sale) => (
                <tr key={sale.reference}>
                  <td className="py-3">
                    <span className="block font-medium">{sale.productName}</span>
                    <span className="block font-mono text-[11px] text-g-mute">
                      {sale.reference} · {relativeTime(sale.createdAt)}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-[11px] text-g-mute">{sale.playerId}</td>
                  <td className="py-3">
                    <span className="capitalize">{sale.status}</span>
                    {sale.deliveredAt && (
                      <span className="block text-[11px] text-g-mute">Delivered</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span
                      className={cn('capitalize', sale.webhook.state === 'failed' && 'text-danger')}
                    >
                      {sale.webhook.state === 'none' ? 'No endpoint' : sale.webhook.state}
                    </span>
                    {sale.webhook.lastError && (
                      <span className="block max-w-[12rem] truncate text-[11px] text-g-mute">
                        {sale.webhook.lastError}
                      </span>
                    )}
                    {sale.status === 'paid' &&
                      !['delivered', 'none'].includes(sale.webhook.state) && (
                        <button
                          type="button"
                          onClick={() => resend.mutate(sale.reference)}
                          className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-g-ember-ink hover:underline"
                        >
                          Resend
                        </button>
                      )}
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums">
                    {formatMoney(sale.developerShareMinor, sale.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GCard>
  );
}

/* ------------------------------------------------------------ settings */

function Settings({ view }: { view: GameDeveloperView }) {
  const { user } = useAuth();
  const slug = view.game.slug;
  const save = useUpdateDeveloperSettings(slug);
  const edit = useUpdateGame(slug);
  const [orientation, setOrientation] = useState<GameOrientation>(view.settings.orientation);
  const [sdk, setSdk] = useState(view.settings.sdk);
  const [testUrl, setTestUrl] = useState(view.settings.testUrl ?? '');
  const failure = save.error instanceof RequestError ? save.error : null;
  const frozen = view.game.status === 'approved' && user?.role !== 'admin';

  return (
    <div className="space-y-4">
      <GCard>
        <h2 className="text-lg font-medium tracking-[-0.03em]">Player</h2>
        <form
          className="mt-5 space-y-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ orientation, sdk, testUrl: testUrl.trim() || null });
          }}
        >
          {failure && !failure.fields.length && <GNotice tone="error">{failure.message}</GNotice>}
          <div className="grid gap-5 sm:grid-cols-2">
            <GSelect
              label="Orientation"
              value={orientation}
              onChange={(event) => setOrientation(event.target.value as GameOrientation)}
              hint="The player sizes its frame from this and asks phones to turn."
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
              <option value="both">Either way</option>
            </GSelect>
            <GInput
              label="Test build URL (optional)"
              type="url"
              placeholder="http://localhost:5173"
              value={testUrl}
              onChange={(event) => setTestUrl(event.target.value)}
              error={failure?.fieldError('testUrl')}
              hint="Loaded instead of the live URL when you play in test mode. http://localhost works."
            />
          </div>
          <label className="flex items-center gap-3 text-[13px]">
            <input
              type="checkbox"
              checked={sdk}
              onChange={(event) => setSdk(event.target.checked)}
              className="size-4 accent-[var(--g-ember)]"
            />
            Uses the Deck Games SDK
          </label>
          <GButton type="submit" tone="ink" loading={save.isPending}>
            Save player settings
          </GButton>
          {save.isSuccess && !save.isPending && (
            <span className="ml-3 text-[12px] text-success">Saved.</span>
          )}
        </form>
      </GCard>

      <GCard>
        <h2 className="text-lg font-medium tracking-[-0.03em]">Listing</h2>
        <div className="mt-5">
          <GameForm
            game={view.game}
            frozen={frozen}
            listingOnly
            submitting={edit.isPending}
            error={edit.error}
            submitLabel={view.game.status === 'rejected' ? 'Save and resubmit' : 'Save listing'}
            onSubmit={(draft) => edit.mutate(draft)}
          />
          {edit.isSuccess && !edit.isPending && (
            <p className="mt-3 text-[12px] text-success">Saved.</p>
          )}
        </div>
      </GCard>
    </div>
  );
}
