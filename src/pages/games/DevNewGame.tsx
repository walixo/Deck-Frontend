import { Link, useNavigate } from 'react-router-dom';
import { GameForm } from '@/components/deckgames/GameForm';
import { useSubmitGame } from '@/hooks/useGames';

/** `/games/developers/new` — register a game and go straight to its desk. */
export function DevNewGame() {
  const submit = useSubmitGame();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-24 sm:px-6 sm:pt-28">
      <title>New game — Deck Games</title>
      <Link
        to="/games/developers"
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-g-mute hover:text-g-ink"
      >
        ← Your games
      </Link>
      <h1 className="mt-4 text-[clamp(2rem,4.6vw,3.25rem)] font-medium leading-[1] tracking-[-0.05em]">
        Register a game
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-g-mute">
        Nobody sees it until it’s reviewed. In the meantime you get test keys and a test player, so
        you can build the whole integration first.
      </p>
      <div className="mt-10">
        <GameForm
          submitting={submit.isPending}
          error={submit.error}
          submitLabel="Register game"
          onSubmit={(draft) =>
            submit.mutate(draft, {
              onSuccess: (game) => navigate(`/games/developers/${game.slug}`),
            })
          }
        />
      </div>
    </div>
  );
}
