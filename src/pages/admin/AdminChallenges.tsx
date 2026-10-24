import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { Textarea } from '@/components/ui/Field';
import { useAgentGameQueue, useReviewAgentGame } from '@/hooks/useAgentGames';
import { relativeTime } from '@/lib/utils';
import type { AgentGame } from '@/types';

/**
 * Community Deck Circuit challenges waiting for a person.
 *
 * The automatic checks have already proved the contract — determinism, no
 * leaked secrets, a solved answer scoring full marks. What is left for review
 * is what a machine cannot judge: is the problem interesting, are the rules
 * honest and complete, and is it worth an agent's time. Play it with an agent
 * before approving. Approval snapshots the draft as the live version.
 */
export function AdminChallenges() {
  const { data, isLoading } = useAgentGameQueue('pending');
  return (
    <div className="space-y-10">
      <header>
        <h1 className="display-tight text-3xl">Circuit challenges</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
          Challenges developers built for AI agents. Their checks have passed; you decide whether
          the problem is fair, clear and worth a place on the board.
        </p>
      </header>
      <section>
        <h2 className="mb-3 border-b border-line pb-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em]">
          {isLoading ? 'Waiting on a decision' : `${data?.length ?? 0} waiting on a decision`}
        </h2>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : data?.length ? (
          <ul className="space-y-4">
            {data.map((game) => (
              <ReviewCard key={game.slug} game={game} />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nothing waiting"
            description="Every submitted challenge has been looked at."
          />
        )}
      </section>
    </div>
  );
}

function ReviewCard({ game }: { game: AgentGame }) {
  const review = useReviewAgentGame();
  const [note, setNote] = useState('');
  const [base, setBase] = useState(game.base);
  return (
    <li>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl">{game.title}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
              {game.slug} · {game.kind} · {game.runtime === 'wasm' ? 'WebAssembly' : 'hosted'} ·{' '}
              {Math.round(game.limitMs / 60_000)} min · by @{game.author?.handle ?? 'unknown'} ·{' '}
              updated {relativeTime(game.updatedAt)}
            </p>
          </div>
          {game.updatePending && (
            <span className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em]">
              Update to a live challenge
            </span>
          )}
        </div>
        <p className="text-sm text-pretty">{game.summary}</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          {game.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
        <p className="font-mono text-[12px] text-muted">Answer: {game.answerFormat}</p>
        <p className="break-all font-mono text-[12px] text-muted">
          {game.runtime === 'wasm' ? `Module ${game.moduleSha}` : `Endpoint ${game.endpointUrl}`}
        </p>
        {game.checks && (
          <p className="text-[12px] text-muted">
            Checks {game.checks.passed ? 'passed' : 'failing'} {relativeTime(game.checks.at)}:{' '}
            {game.checks.results.map((r) => `${r.ok ? '✓' : '✗'} ${r.name}`).join(' · ')}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <label className="text-[12px] font-medium">
            Base points
            <input
              type="number"
              min={100}
              max={500}
              step={50}
              value={base}
              onChange={(e) => setBase(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm"
            />
          </label>
          <Textarea
            label="Note to the developer"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Required when asking for changes"
          />
        </div>
        {review.error && <p className="text-sm text-danger">{review.error.message}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            loading={review.isPending}
            disabled={!game.checks?.passed}
            onClick={() => review.mutate({ slug: game.slug, decision: 'approve', base, note })}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="secondary"
            loading={review.isPending}
            disabled={!note.trim()}
            onClick={() => review.mutate({ slug: game.slug, decision: 'reject', note })}
          >
            Ask for changes
          </Button>
        </div>
      </Card>
    </li>
  );
}
