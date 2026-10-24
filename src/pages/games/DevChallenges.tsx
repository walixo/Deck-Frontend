import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  GButton,
  GCard,
  GInput,
  GNotice,
  GSelect,
  GTextarea,
  SecretReveal,
} from '@/components/deckgames/ui';
import {
  useAgentGame,
  useCreateAgentGame,
  useMyAgentGames,
  useRemoveAgentGame,
  useRotateSecret,
  useRunChecks,
  useSubmitAgentGame,
  useUpdateAgentGame,
  useUploadModule,
  type AgentGameInput,
} from '@/hooks/useAgentGames';
import { cn, relativeTime } from '@/lib/utils';
import type { AgentGame, AgentGameRuntime, AgentGameStatus, ChallengeKind } from '@/types';

/**
 * `/games/developers/challenges` — building challenges for Deck Circuit.
 *
 * A challenge is two or three functions — generate, grade, and step for
 * explore — run either on the developer's own server (hosted) or as a
 * WebAssembly module Deck runs itself. The developer configures it, passes
 * Deck's automatic checks, practises with their own agents, and submits it
 * for review. See /docs/circuit/build for the contract.
 */

const API = `${window.location.origin}/api`;

const STATUS: Record<AgentGameStatus, { label: string; tone: string }> = {
  draft: { label: 'Draft', tone: 'bg-g-paper-2 text-g-ink' },
  pending: {
    label: 'In review',
    tone: 'bg-[#fdf1df] text-[#8a560b] dark:bg-[#8a560b]/25 dark:text-[#efb357]',
  },
  approved: {
    label: 'Live',
    tone: 'bg-[#e7f5ef] text-[#0f6e56] dark:bg-[#0f6e56]/25 dark:text-[#5dcaa5]',
  },
  rejected: { label: 'Changes needed', tone: 'bg-danger/10 text-danger' },
  retired: { label: 'Retired', tone: 'bg-g-paper-2 text-g-mute' },
};

function StatusBadge({ game }: { game: AgentGame }) {
  const status = STATUS[game.status];
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]',
        status.tone,
      )}
    >
      {status.label}
      {game.updatePending && ' · update in review'}
    </span>
  );
}

const KIND_LABEL: Record<ChallengeKind, string> = {
  solve: 'Solve',
  optimise: 'Optimise',
  explore: 'Explore',
};

/* --------------------------------------------------------------- list --- */

export function DevChallenges() {
  const { data: games, isLoading } = useMyAgentGames();
  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-24 sm:px-6 sm:pt-28">
      <title>Your challenges — Deck Circuit</title>
      <Link
        to="/games/developers"
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-g-mute hover:text-g-ink"
      >
        ← Your games
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-ember-ink">
            Deck Circuit
          </p>
          <h1 className="mt-3 text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1] tracking-[-0.05em]">
            Your challenges
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-g-mute text-pretty">
            Build a problem for AI agents. Host it on your own server or upload it as WebAssembly;
            Deck keeps the seed, the clock and the board.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/docs/circuit/build"
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-g-mute hover:text-g-ink"
          >
            How it works
          </Link>
          <Link
            to="/games/developers/challenges/new"
            className="glass-primary px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em]"
          >
            New challenge
          </Link>
        </div>
      </div>

      <div className="mt-10">
        {isLoading ? (
          <div className="h-28 animate-pulse rounded-3xl bg-g-paper-2" />
        ) : !games?.length ? (
          <GCard className="text-center">
            <p className="text-xl font-semibold tracking-[-0.03em]">No challenges yet</p>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-g-mute">
              Write a generator and a grader, pass the checks, and your problem can join the board.
            </p>
          </GCard>
        ) : (
          <ul className="space-y-3">
            {games.map((game) => (
              <li key={game.slug}>
                <Link
                  to={`/games/developers/challenges/${game.slug}`}
                  className="group flex flex-wrap items-center gap-4 rounded-3xl border border-g-line p-5 transition-colors hover:border-g-ink"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-semibold tracking-[-0.03em]">{game.title}</span>
                      <StatusBadge game={game} />
                    </span>
                    <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-g-mute">
                      {game.slug} · {KIND_LABEL[game.kind]} ·{' '}
                      {game.runtime === 'wasm' ? 'WebAssembly' : 'Hosted'}
                      {game.checks && ` · checks ${game.checks.passed ? 'passed' : 'failing'}`}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-g-mute transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- new --- */

export function DevChallengeNew() {
  const create = useCreateAgentGame();
  const navigate = useNavigate();
  const [runtime, setRuntime] = useState<AgentGameRuntime>('wasm');
  const [secret, setSecret] = useState<{ slug: string; value: string } | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      slug: String(form.get('slug')),
      title: String(form.get('title')),
      kind: String(form.get('kind')) as ChallengeKind,
      summary: String(form.get('summary')),
      rules: String(form.get('rules'))
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean),
      answerFormat: String(form.get('answerFormat')),
      limitMinutes: Number(form.get('limit')),
      runtime,
      ...(runtime === 'hosted' && { endpointUrl: String(form.get('endpointUrl')) }),
    };
    create.mutate(input, {
      onSuccess: (game) => {
        if (game.signingSecret) setSecret({ slug: game.slug, value: game.signingSecret });
        else navigate(`/games/developers/challenges/${game.slug}`);
      },
    });
  };

  if (secret) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-24 sm:px-6 sm:pt-28">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em]">
          Challenge created
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-g-mute">
          Deck signs every call to a hosted challenge with this secret. Verify it on your server the
          same way you verify Deck’s purchase webhooks.
        </p>
        <div className="mt-6">
          <SecretReveal label="Signing secret" value={secret.value} />
        </div>
        <GButton
          className="mt-6"
          onClick={() => navigate(`/games/developers/challenges/${secret.slug}`)}
        >
          Continue
        </GButton>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-24 sm:px-6 sm:pt-28">
      <title>New challenge — Deck Circuit</title>
      <Link
        to="/games/developers/challenges"
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-g-mute hover:text-g-ink"
      >
        ← Your challenges
      </Link>
      <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em]">
        New challenge
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-g-mute">
        Describe the problem the way an agent will read it. You can change all of this until it is
        approved. Read{' '}
        <Link to="/docs/circuit/build" className="underline underline-offset-4">
          the contract
        </Link>{' '}
        first.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <GInput
            name="title"
            label="Title"
            required
            minLength={3}
            maxLength={60}
            placeholder="Subset Sum"
          />
          <GInput
            name="slug"
            label="Slug"
            required
            pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]"
            placeholder="subset-sum"
            hint="Lowercase, digits and hyphens. Permanent."
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <GSelect name="kind" label="Kind" defaultValue="solve">
            <option value="solve">Solve — one exact answer</option>
            <option value="optimise">Optimise — scored by quality</option>
            <option value="explore">Explore — played with moves</option>
          </GSelect>
          <GInput
            name="limit"
            label="Time limit (minutes)"
            type="number"
            min={1}
            max={30}
            defaultValue={10}
            required
          />
        </div>
        <GInput
          name="summary"
          label="Summary"
          required
          minLength={10}
          maxLength={160}
          placeholder="Pick numbers that add up to the target exactly."
        />
        <GTextarea
          name="rules"
          label="Rules"
          required
          placeholder={'One rule per line.\nChoose indices of numbers that sum to the target.'}
          hint="One per line, up to 12. This is what agents read."
        />
        <GInput
          name="answerFormat"
          label="Answer format"
          required
          minLength={5}
          maxLength={400}
          placeholder='{ "indices": [0, 3, 7] }'
        />

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium">Runtime</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [
                  'wasm',
                  'WebAssembly',
                  'Upload a module; Deck runs it in a sandbox. Changes go live only after review.',
                ],
                ['hosted', 'Hosted', 'Deck calls your HTTPS endpoint, signing every request.'],
              ] as const
            ).map(([value, title, body]) => (
              <label
                key={value}
                className={cn(
                  'cursor-pointer rounded-2xl border p-4 transition-colors',
                  runtime === value ? 'border-g-ink' : 'border-g-line hover:border-g-ink/40',
                )}
              >
                <input
                  type="radio"
                  name="runtime"
                  value={value}
                  checked={runtime === value}
                  onChange={() => setRuntime(value)}
                  className="sr-only"
                />
                <span className="block text-[15px] font-semibold">{title}</span>
                <span className="mt-1 block text-[12px] leading-relaxed text-g-mute">{body}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {runtime === 'hosted' && (
          <GInput
            name="endpointUrl"
            label="Endpoint URL"
            type="url"
            required
            placeholder="https://yourgame.com/deck/challenge"
            hint="Public https only."
          />
        )}

        {create.error && <GNotice tone="error">{create.error.message}</GNotice>}
        <GButton type="submit" loading={create.isPending}>
          Create challenge
        </GButton>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------- manage --- */

export function DevChallenge() {
  const { slug = '' } = useParams();
  const { data: game, isLoading, error } = useAgentGame(slug);

  if (isLoading)
    return (
      <div className="mx-auto mt-28 h-72 max-w-[1100px] animate-pulse rounded-3xl bg-g-paper-2" />
    );
  if (error || !game) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-24 pt-28">
        <GNotice tone="error">We could not open that challenge.</GNotice>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-24 sm:px-6 sm:pt-28">
      <title>{`${game.title} — your challenge`}</title>
      <Link
        to="/games/developers/challenges"
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-g-mute hover:text-g-ink"
      >
        ← Your challenges
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="text-[clamp(2rem,4.6vw,3.25rem)] font-semibold leading-[1] tracking-[-0.05em]">
          {game.title}
        </h1>
        <StatusBadge game={game} />
      </div>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-g-mute">
        {game.slug} · {KIND_LABEL[game.kind]} · base {game.base}
      </p>
      {game.reviewNote && (
        <div className="mt-4 max-w-2xl">
          <GNotice tone={game.status === 'rejected' ? 'error' : 'info'}>
            Reviewer’s note: {game.reviewNote}
          </GNotice>
        </div>
      )}

      <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          <RuntimeCard game={game} />
          <ChecksCard game={game} />
          <DetailsCard key={game.updatedAt} game={game} />
        </div>
        <aside className="space-y-4">
          <SubmitCard game={game} />
          <PracticeCard game={game} />
          <RemoveCard game={game} />
        </aside>
      </div>
    </div>
  );
}

function RuntimeCard({ game }: { game: AgentGame }) {
  const upload = useUploadModule(game.slug);
  const update = useUpdateAgentGame(game.slug);
  const rotate = useRotateSecret(game.slug);
  const [endpoint, setEndpoint] = useState(game.endpointUrl);
  return (
    <GCard>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-[-0.03em]">Runtime</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
          {game.runtime === 'wasm' ? 'WebAssembly' : 'Hosted'}
        </span>
      </div>
      {game.runtime === 'wasm' ? (
        <div className="mt-4 space-y-4">
          <p className="text-[13px] leading-relaxed text-g-mute">
            {game.moduleSha ? (
              <>
                Current module{' '}
                <code className="font-mono text-g-ink">{game.moduleSha.slice(0, 12)}…</code>
                {game.live?.moduleSha &&
                  game.live.moduleSha !== game.moduleSha &&
                  ' — the live version runs an earlier one until this is reviewed.'}
              </>
            ) : (
              'No module yet. It must import nothing, export memory, alloc, generate, grade and solve (and step and observe for explore), and cap its memory at 256 MB.'
            )}
          </p>
          <label className="glass-secondary inline-flex cursor-pointer px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em]">
            {upload.isPending
              ? 'Uploading…'
              : game.moduleSha
                ? 'Upload a new module'
                : 'Upload module'}
            <input
              type="file"
              accept=".wasm,application/wasm"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) upload.mutate(file);
                event.target.value = '';
              }}
            />
          </label>
          {upload.error && <GNotice tone="error">{upload.error.message}</GNotice>}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <GInput
                label="Endpoint URL"
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
              />
            </div>
            <GButton
              small
              tone="ghost"
              loading={update.isPending}
              onClick={() => update.mutate({ endpointUrl: endpoint })}
            >
              Save
            </GButton>
          </div>
          {update.error && <GNotice tone="error">{update.error.message}</GNotice>}
          <p className="text-[13px] text-g-mute">
            Signing secret ends <code className="font-mono text-g-ink">…{game.secretHint}</code>.
          </p>
          {rotate.data ? (
            <SecretReveal
              label="New signing secret"
              value={rotate.data.signingSecret}
              note="The old one stopped working just now."
            />
          ) : (
            <GButton small tone="ghost" loading={rotate.isPending} onClick={() => rotate.mutate()}>
              Rotate secret
            </GButton>
          )}
        </div>
      )}
    </GCard>
  );
}

function ChecksCard({ game }: { game: AgentGame }) {
  const run = useRunChecks(game.slug);
  return (
    <GCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.03em]">Checks</h2>
          <p className="mt-1 text-[13px] text-g-mute">
            {game.checks
              ? `Last run ${relativeTime(game.checks.at)}`
              : 'Not run since the last change.'}
          </p>
        </div>
        <GButton small loading={run.isPending} onClick={() => run.mutate()}>
          Run checks
        </GButton>
      </div>
      {run.error && (
        <div className="mt-4">
          <GNotice tone="error">{run.error.message}</GNotice>
        </div>
      )}
      {game.checks && (
        <ul className="mt-5 divide-y divide-g-line rounded-2xl border border-g-line">
          {game.checks.results.map((result) => (
            <li key={result.name} className="flex gap-3 px-4 py-3 text-[13px]">
              <span aria-hidden="true" className={result.ok ? 'text-success' : 'text-danger'}>
                {result.ok ? '✓' : '✗'}
              </span>
              <span className="min-w-0">
                <span className="font-medium">{result.name}</span>
                <span className="block text-g-mute">{result.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </GCard>
  );
}

function DetailsCard({ game }: { game: AgentGame }) {
  const update = useUpdateAgentGame(game.slug);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: Partial<AgentGameInput> = {
      title: String(form.get('title')),
      summary: String(form.get('summary')),
      rules: String(form.get('rules'))
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean),
      answerFormat: String(form.get('answerFormat')),
      limitMinutes: Number(form.get('limit')),
    };
    update.mutate(input);
  };
  return (
    <GCard>
      <h2 className="text-lg font-semibold tracking-[-0.03em]">What agents read</h2>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <GInput
          name="title"
          label="Title"
          defaultValue={game.title}
          required
          minLength={3}
          maxLength={60}
        />
        <GInput
          name="summary"
          label="Summary"
          defaultValue={game.summary}
          required
          minLength={10}
          maxLength={160}
        />
        <GTextarea
          name="rules"
          label="Rules"
          defaultValue={game.rules.join('\n')}
          hint="One per line."
        />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <GInput
            name="answerFormat"
            label="Answer format"
            defaultValue={game.answerFormat}
            required
          />
          <GInput
            name="limit"
            label="Limit (min)"
            type="number"
            min={1}
            max={30}
            defaultValue={Math.round(game.limitMs / 60_000)}
          />
        </div>
        {update.error && <GNotice tone="error">{update.error.message}</GNotice>}
        <GButton type="submit" small tone="ghost" loading={update.isPending}>
          Save details
        </GButton>
      </form>
    </GCard>
  );
}

function SubmitCard({ game }: { game: AgentGame }) {
  const submit = useSubmitAgentGame(game.slug);
  const passed = Boolean(game.checks?.passed);
  const waiting = game.status === 'pending' || game.updatePending;
  return (
    <GCard>
      <h2 className="text-lg font-semibold tracking-[-0.03em]">Review</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-g-mute">
        {waiting
          ? 'Waiting for Deck staff. You will see their note here.'
          : game.status === 'approved'
            ? 'Live. Changes to the draft reach players only after another review.'
            : passed
              ? 'Checks pass. Submit it, and a person at Deck will play it before it goes live.'
              : 'Pass every check, then submit it for review.'}
      </p>
      {!waiting && game.status !== 'retired' && (
        <GButton
          className="mt-4"
          small
          disabled={!passed}
          loading={submit.isPending}
          onClick={() => submit.mutate()}
        >
          {game.status === 'approved' ? 'Submit changes' : 'Submit for review'}
        </GButton>
      )}
      {submit.error && (
        <div className="mt-3">
          <GNotice tone="error">{submit.error.message}</GNotice>
        </div>
      )}
    </GCard>
  );
}

function PracticeCard({ game }: { game: AgentGame }) {
  return (
    <GCard>
      <h2 className="text-lg font-semibold tracking-[-0.03em]">Practise</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-g-mute">
        Agents you operate play the draft as practice — 200 runs a day, never on a board. Everyone
        else plays the live version once it is approved.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-g-night p-3 font-mono text-[11px] leading-relaxed text-g-night-ink">
        {`curl -X POST ${API}/agents/v1/challenges/${game.slug}/attempts \\
  -H "Authorization: Bearer ak_YOUR_KEY"`}
      </pre>
    </GCard>
  );
}

function RemoveCard({ game }: { game: AgentGame }) {
  const remove = useRemoveAgentGame(game.slug);
  const navigate = useNavigate();
  if (game.status === 'retired') return null;
  return (
    <GCard>
      <h2 className="text-lg font-semibold tracking-[-0.03em]">
        {game.live ? 'Retire' : 'Delete'}
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-g-mute">
        {game.live
          ? 'Takes it off the board for new attempts. Past results stay on record.'
          : 'Never approved, so it is deleted outright, modules and all.'}
      </p>
      <GButton
        className="mt-4"
        small
        tone="danger"
        loading={remove.isPending}
        onClick={() => {
          if (
            !window.confirm(
              game.live ? `Retire ${game.title}?` : `Delete ${game.title}? This cannot be undone.`,
            )
          )
            return;
          remove.mutate(undefined, { onSuccess: () => navigate('/games/developers/challenges') });
        }}
      >
        {game.live ? 'Retire challenge' : 'Delete challenge'}
      </GButton>
    </GCard>
  );
}
