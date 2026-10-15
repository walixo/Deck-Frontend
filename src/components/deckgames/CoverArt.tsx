import { GameLogo } from '@/components/games/GameLogo';
import { cn } from '@/lib/utils';
import type { GameSummary } from '@/types';

/**
 * A game's cover: its own image when it has one, otherwise a generated one.
 *
 * The generated cover is a warm gradient picked from the slug, so a game
 * always gets the same colours and two games side by side rarely match. Deck's
 * own games carry their mark on it. Never a grey box — an arcade shelf of grey
 * boxes reads as broken.
 */
const GRADIENTS = [
  'bg-[linear-gradient(140deg,#ffd27a,#e8641b_55%,#5a1a04)]',
  'bg-[linear-gradient(160deg,#9b7bff,#3b1d4a_60%,#0b0614)]',
  'bg-[linear-gradient(150deg,#3fd1c1,#0f5d63_60%,#04191b)]',
  'bg-[linear-gradient(140deg,#ff9a7a,#c93a0c_55%,#2a0c02)]',
  'bg-[linear-gradient(170deg,#7cc4ff,#1f4f8f_60%,#06142a)]',
  'bg-[linear-gradient(135deg,#ffe3a3,#f7a531_45%,#8c2a07)]',
];

function pick(slug: string): string {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export function CoverArt({
  game,
  className,
  showTitle = true,
}: {
  game: Pick<GameSummary, 'slug' | 'title' | 'coverUrl' | 'kind' | 'component'>;
  className?: string;
  showTitle?: boolean;
}) {
  if (game.coverUrl) {
    return (
      <img
        src={game.coverUrl}
        alt=""
        loading="lazy"
        className={cn('size-full object-cover', className)}
      />
    );
  }

  return (
    <div className={cn('relative size-full overflow-hidden', pick(game.slug), className)}>
      <div className="absolute -right-1/4 -top-1/4 size-3/4 rounded-full bg-white/25 blur-2xl" />
      {game.kind === 'builtin' && game.component ? (
        <GameLogo
          mark={game.component}
          colour="rgba(255,255,255,0.92)"
          className="absolute left-1/2 top-1/2 size-1/3 -translate-x-1/2 -translate-y-1/2"
        />
      ) : null}
      {showTitle && (
        <span className="absolute inset-x-3 bottom-3 line-clamp-2 text-[15px] font-medium leading-tight tracking-[-0.03em] text-white">
          {game.title}
        </span>
      )}
    </div>
  );
}
