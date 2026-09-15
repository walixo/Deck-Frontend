import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { NeoSelect } from '@/components/ui/NeoSelect';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, InlineAlert } from '@/components/ui/States';
import { useDeleteGame, useMyGames, useSubmitGame, useUpdateGame } from '@/hooks/useGames';
import { RequestError } from '@/lib/api';
import { cn, formatNumber, relativeTime } from '@/lib/utils';
import { GAME_GENRES, GAME_GENRE_LABELS, type GameGenre, type GameSummary } from '@/types';

/**
 * Submit a game to the arcade, and see where your submissions stand.
 *
 * Editing a rejected game puts it back in the queue, which is the whole point
 * of getting a reason — so the form is the same one either way and the row says
 * what will happen when you save.
 */
export function AccountGames() {
  const { data: games, isLoading } = useMyGames();
  const [editing, setEditing] = useState<GameSummary | null>(null);
  const [composing, setComposing] = useState(false);

  const open = composing || editing !== null;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-tight text-3xl uppercase">Games</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted text-pretty">
            Put a game on{' '}
            <Link to="/games" className="font-bold text-body underline underline-offset-2">
              the arcade
            </Link>
            . Staff read every one before it appears, and it stays hosted by you.
          </p>
        </div>
        {!open && <Button onClick={() => setComposing(true)}>Submit a game</Button>}
      </header>

      {open && (
        <Composer
          game={editing}
          onDone={() => {
            setComposing(false);
            setEditing(null);
          }}
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((n) => (
            <Skeleton key={n} className="h-20 w-full" />
          ))}
        </div>
      ) : games?.length ? (
        <ul className="mt-8 space-y-2">
          {games.map((game) => (
            <Row key={game.id} game={game} onEdit={() => setEditing(game)} />
          ))}
        </ul>
      ) : (
        !open && (
          <EmptyState
            title="No games submitted"
            description="If you have made something small and playable, it can go on the shelf."
            action={<Button onClick={() => setComposing(true)}>Submit a game</Button>}
          />
        )
      )}
    </div>
  );
}

function Row({ game, onEdit }: { game: GameSummary; onEdit: () => void }) {
  const remove = useDeleteGame();

  const tone =
    game.status === 'approved'
      ? 'bg-success text-ink'
      : game.status === 'rejected'
        ? 'bg-edge text-canvas'
        : 'bg-surface-2 text-muted';

  return (
    <li className="rounded-slab border border-edge bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base uppercase">
              {game.status === 'approved' ? (
                <Link to={`/games/${game.slug}`} className="hover:underline">
                  {game.title}
                </Link>
              ) : (
                game.title
              )}
            </h2>
            <span
              className={cn(
                'border border-edge px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em]',
                tone,
              )}
            >
              {game.status === 'pending' ? 'In review' : game.status}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-muted">{game.tagline}</p>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
            {GAME_GENRE_LABELS[game.genre]} · {formatNumber(game.plays)} plays ·{' '}
            {relativeTime(game.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {game.status !== 'approved' && (
            <Button size="sm" variant="secondary" onClick={onEdit}>
              Edit
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            loading={remove.isPending}
            onClick={() => remove.mutate(game.slug)}
          >
            Delete
          </Button>
        </div>
      </div>

      {game.status === 'rejected' && game.reviewNote && (
        <p className="mt-3 border border-edge bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted text-pretty">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-body">
            Not approved
          </span>
          <br />
          {game.reviewNote}
          <br />
          <span className="text-body">Editing it puts it back in the queue.</span>
        </p>
      )}
    </li>
  );
}

const LIMITS = { title: 80, tagline: 140, description: 4000 };

function Composer({ game, onDone }: { game: GameSummary | null; onDone: () => void }) {
  const submit = useSubmitGame();
  const update = useUpdateGame(game?.slug ?? '');
  const active = game ? update : submit;

  const [form, setForm] = useState({
    title: game?.title ?? '',
    tagline: game?.tagline ?? '',
    description: '',
    genre: (game?.genre ?? 'arcade') as GameGenre,
    coverUrl: game?.coverUrl ?? '',
    playUrl: game?.playUrl ?? '',
  });

  const error = active.error instanceof RequestError ? active.error : null;

  const set =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    active.mutate(
      {
        title: form.title.trim(),
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        genre: form.genre,
        coverUrl: form.coverUrl || undefined,
        playUrl: form.playUrl.trim(),
      },
      { onSuccess: onDone },
    );
  };

  return (
    <Card className="mb-8 p-5 sm:p-6">
      <form onSubmit={save} noValidate>
        <h2 className="border-b border-edge pb-3 font-display text-lg uppercase">
          {game ? `Edit ${game.title}` : 'Submit a game'}
        </h2>

        <div className="mt-5 space-y-4">
          {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

          <Input
            label="Name"
            required
            value={form.title}
            onChange={set('title')}
            error={error?.fieldError('title')}
            maxLength={LIMITS.title}
          />

          <Input
            label="One line about it"
            required
            value={form.tagline}
            onChange={set('tagline')}
            error={error?.fieldError('tagline')}
            maxLength={LIMITS.tagline}
            hint="What it is, in the length of a tweet's first line."
          />

          <Textarea
            label="How does it play?"
            required
            rows={5}
            value={form.description}
            onChange={set('description')}
            error={error?.fieldError('description')}
            maxLength={LIMITS.description}
            hint="Controls, what you are trying to do, roughly how long a go takes."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <NeoSelect
              label="Genre"
              value={form.genre}
              onChange={(value) => setForm((c) => ({ ...c, genre: value as GameGenre }))}
              options={GAME_GENRES.map((genre) => ({
                value: genre,
                label: GAME_GENRE_LABELS[genre],
              }))}
            />

            <Input
              label="Where does it run?"
              required
              type="url"
              inputMode="url"
              value={form.playUrl}
              onChange={set('playUrl')}
              error={error?.fieldError('playUrl')}
              placeholder="https://example.com/my-game"
              hint="Has to be https — the play button opens it in a new tab."
            />
          </div>

          <ImageUpload
            label="Cover image (optional)"
            hint="A screenshot works. Shown on the shelf at 16:9."
            aspect="wide"
            max={1}
            value={form.coverUrl ? [form.coverUrl] : []}
            onChange={(urls) => setForm((c) => ({ ...c, coverUrl: urls[0] ?? '' }))}
            error={error?.fieldError('coverUrl')}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-edge pt-4">
          <Button type="submit" loading={active.isPending}>
            {game ? 'Save and resubmit' : 'Submit for review'}
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
