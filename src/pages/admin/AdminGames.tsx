import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { Textarea } from '@/components/ui/Field';
import { useGameQueue, useReviewGame } from '@/hooks/useGames';
import { cn, formatNumber, relativeTime } from '@/lib/utils';
import { GAME_GENRE_LABELS, type GameSummary } from '@/types';

/**
 * The arcade's review queue.
 *
 * Approving a game puts somebody else's page one click from Deck's, under
 * Deck's recommendation — so the questions are the same ones as for a listing:
 * is it theirs, does the link go where it says, and is it something Deck wants
 * to send people to.
 *
 * Framing is a separate switch from approving, and defaults off. A game can be
 * worth listing without being trusted to run inside Deck's chrome, where its
 * JavaScript could imitate Deck's own UI — and unlike the listing, that trust
 * cannot be withdrawn after the fact by the maker changing their page.
 */
export function AdminGames() {
  const { data, isLoading } = useGameQueue();

  const pending = data?.filter((game) => game.status === 'pending') ?? [];
  const decided = data?.filter((game) => game.status !== 'pending') ?? [];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="display-tight text-3xl uppercase">Games</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
          Games people have submitted to the arcade. Deck links out to them rather than framing
          them, so the risk is what you are recommending, not what you are running.
        </p>
      </header>

      <section>
        <h2 className="mb-3 border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          {isLoading ? 'Waiting on a decision' : `${pending.length} waiting on a decision`}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((n) => (
              <Skeleton key={n} className="h-48 w-full" />
            ))}
          </div>
        ) : pending.length ? (
          <ul className="space-y-4">
            {pending.map((game) => (
              <ReviewCard key={game.id} game={game} />
            ))}
          </ul>
        ) : (
          <EmptyState title="Nothing waiting" description="Every submission has been looked at." />
        )}
      </section>

      <section>
        <h2 className="mb-3 border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          Already decided
        </h2>
        {decided.length ? (
          <ul className="space-y-2">
            {decided.map((game) => (
              <DecidedRow key={game.id} game={game} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing yet.</p>
        )}
      </section>
    </div>
  );
}

function ReviewCard({ game }: { game: GameSummary }) {
  const review = useReviewGame();
  const [note, setNote] = useState('');
  const [embeddable, setEmbeddable] = useState(false);
  const [featured, setFeatured] = useState(false);

  return (
    <li>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <h3 className="text-lg uppercase">{game.title}</h3>
            <p className="mt-1 text-sm text-muted text-pretty">{game.tagline}</p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
              {GAME_GENRE_LABELS[game.genre]} · submitted {relativeTime(game.createdAt)}
            </p>

            {game.playUrl && (
              <a
                href={game.playUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block break-all border border-edge bg-surface-2 px-2 py-1 font-mono text-[11px] tracking-[0.04em] underline-offset-4 hover:text-accent hover:underline"
              >
                {game.playUrl} ↗
              </a>
            )}
          </div>

          {game.author && (
            <div className="flex items-center gap-2">
              <Avatar user={game.author} size="sm" />
              <div className="font-mono text-[11px] uppercase tracking-[0.06em]">
                <p className="font-bold">{game.author.name}</p>
                <p className="text-muted">@{game.author.username}</p>
              </div>
            </div>
          )}
        </div>

        {game.coverUrl && (
          <img
            src={game.coverUrl}
            alt=""
            className="mt-4 max-h-48 w-auto rounded-slab border border-edge"
          />
        )}

        <div className="mt-4 space-y-3 border-t border-edge pt-4">
          <Textarea
            label="Note (required to reject)"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={600}
            hint="Sent to the maker. Editing their submission puts it back in this queue."
          />

          <div className="flex flex-wrap gap-4">
            <Toggle checked={featured} onChange={setFeatured} label="Feature on the shelf" />
            <Toggle
              checked={embeddable}
              onChange={setEmbeddable}
              label="Allow framing inside Deck"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              loading={review.isPending}
              onClick={() =>
                review.mutate({
                  id: game.id,
                  status: 'approved',
                  reviewNote: note.trim() || undefined,
                  embeddable,
                  featured,
                })
              }
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!note.trim()}
              loading={review.isPending}
              onClick={() =>
                review.mutate({ id: game.id, status: 'rejected', reviewNote: note.trim() })
              }
            >
              Reject
            </Button>
          </div>
        </div>
      </Card>
    </li>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 shrink-0 border border-edge accent-accent"
      />
      {label}
    </label>
  );
}

function DecidedRow({ game }: { game: GameSummary }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border border-edge bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold uppercase">{game.title}</p>
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
          {GAME_GENRE_LABELS[game.genre]} · {formatNumber(game.plays)} plays
          {game.embeddable && ' · framed'}
          {game.featured && ' · featured'}
        </p>
      </div>
      <span
        className={cn(
          'border border-edge px-2 py-0.5 font-mono text-[10px] font-bold uppercase',
          game.status === 'approved' ? 'bg-success text-ink' : 'bg-edge text-canvas',
        )}
      >
        {game.status}
      </span>
    </li>
  );
}
