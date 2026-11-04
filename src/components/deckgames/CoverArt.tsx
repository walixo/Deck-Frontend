import { GameLogo } from '@/components/games/GameLogo';
import { cn } from '@/lib/utils';
import type { GameSummary } from '@/types';

/**
 * A game's cover: its own image when it has one, otherwise a generated one.
 *
 * The generated cover is a cool gradient picked from the slug, so a game
 * always gets the same colours and two games side by side rarely match. Deck's
 * own games carry their mark on it. Never a grey box — an arcade shelf of grey
 * boxes reads as broken.
 *
 * All six sit in the blue half of the wheel to match the arcade's light, but
 * they are deliberately spread across it — morph blue, violet, cyan, slate,
 * sky, ultramarine — and one is desaturated. Six shades of the same blue would
 * satisfy the palette and defeat the point of the component.
 */
const GRADIENTS = [
  'bg-[linear-gradient(140deg,#9aabff,#5769f7_55%,#11142e)]',
  'bg-[linear-gradient(160deg,#c4a6ff,#a366f0_60%,#1b0f3a)]',
  'bg-[linear-gradient(150deg,#8fe4f7,#3fc3e8_60%,#06303d)]',
  'bg-[linear-gradient(140deg,#aab8d8,#4a5f8f_55%,#0e1626)]',
  'bg-[linear-gradient(170deg,#7cc4ff,#1f4f8f_60%,#06142a)]',
  'bg-[linear-gradient(135deg,#b9c3ff,#2b3199_45%,#080a1c)]',
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
