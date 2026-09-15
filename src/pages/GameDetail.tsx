import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageBanner } from '@/components/ui/Ambient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { Avatar } from '@/components/ui/Avatar';
import { BlockDrop } from '@/components/games/BlockDrop';
import { GameLogo } from '@/components/games/GameLogo';
import { Leaderboard } from '@/components/games/Leaderboard';
import { SkyRun } from '@/components/games/SkyRun';
import { SpeedX } from '@/components/games/SpeedX';
import { Snakejo } from '@/components/games/Snakejo';
import { useGame, useRecordPlay } from '@/hooks/useGames';
import { formatNumber, relativeTime, profilePath } from '@/lib/utils';
import { GAME_GENRE_LABELS } from '@/types';

/**
 * Deck's own games, by component key.
 *
 * A lookup rather than a dynamic import of whatever string the database holds.
 * The row says `sky-run` and this decides what that means — so a compromised or
 * mistyped row can at worst fail to match, never load something unintended.
 */
const GAME_COMPONENTS: Record<string, () => React.ReactElement> = {
  'sky-run': () => <SkyRun />,
  snakejo: () => <Snakejo />,
  'block-drop': () => <BlockDrop />,
  'speed-x': () => <SpeedX />,
};

export function GameDetail() {
  const { slug = '' } = useParams();
  const { data: game, isLoading, isError, error, refetch } = useGame(slug);
  const play = useRecordPlay();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  if (isError || !game) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState message={error?.message ?? 'We could not find that game'} onRetry={() => void refetch()} />
      </div>
    );
  }

  const Builtin = game.kind === 'builtin' && game.component
    ? GAME_COMPONENTS[game.component]
    : undefined;

  return (
    <div className="relative isolate mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageBanner />

      <Link
        to="/games"
        className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted underline-offset-4 hover:text-accent hover:underline"
      >
        ← The arcade
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            {game.kind === 'builtin' && game.component && (
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-[6px] border border-edge bg-surface-2"
              >
                <GameLogo mark={game.component} colour="currentColor" className="size-7" />
              </span>
            )}
            <h1 className="display-tight text-3xl uppercase text-balance sm:text-4xl">
              {game.title}
            </h1>
            {game.featured && <Badge tone="pop">★ Pick</Badge>}
            {game.status !== 'approved' && (
              <Badge tone="invert">{game.status === 'pending' ? 'In review' : 'Not approved'}</Badge>
            )}
          </div>
          <p className="mt-2 text-base leading-relaxed text-muted text-pretty">{game.tagline}</p>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
        <span>{GAME_GENRE_LABELS[game.genre]}</span>
        <span aria-hidden="true" className="text-muted/50">/</span>
        <span className="tabular-nums">{formatNumber(game.plays)} plays</span>
        <span aria-hidden="true" className="text-muted/50">/</span>
        <span>{relativeTime(game.createdAt)}</span>
      </div>

      <div className="mt-8">
        {Builtin ? (
          <Builtin />
        ) : game.embeddable && game.playUrl ? (
          <Embedded url={game.playUrl} title={game.title} onPlay={() => play.mutate(game.slug)} />
        ) : (
          <div className="rounded-slab border border-edge bg-surface-2 p-6 text-center sm:p-10">
            {game.coverUrl && (
              <img
                src={game.coverUrl}
                alt=""
                className="mx-auto mb-6 max-h-64 w-auto rounded-slab border border-edge"
              />
            )}
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted text-pretty">
              This one is hosted by its maker and opens in a new tab. Deck only runs another
              site inside its own page when staff have specifically cleared it.
            </p>
            <div className="mt-5">
              <Button
                onClick={() => {
                  /* Counted here rather than on the server's redirect, because
                     there is no redirect: the link goes straight to them. */
                  play.mutate(game.slug);
                  window.open(game.playUrl ?? '', '_blank', 'noopener,noreferrer');
                }}
                disabled={!game.playUrl}
              >
                Play {game.title} ↗
              </Button>
            </div>
            {game.playUrl && (
              <p className="mt-3 break-all font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                {game.playUrl}
              </p>
            )}
          </div>
        )}
      </div>

      {game.author && (
        <div className="mt-8 flex items-center gap-3 border-t border-edge pt-5">
          <Avatar user={game.author} size="sm" />
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              Made by
            </p>
            <Link
              to={profilePath(game.author.username)}
              className="text-sm font-bold underline-offset-4 hover:text-accent hover:underline"
            >
              {game.author.name}
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-edge pt-6">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]">About</h2>
        {game.description.split('\n\n').map((paragraph) => (
          <p
            key={paragraph.slice(0, 40)}
            className="mt-3 max-w-2xl text-[15px] leading-[1.75] text-pretty"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <Leaderboard slug={game.slug} className="mt-10" />
    </div>
  );
}

/**
 * A hosted game, running inside Deck.
 *
 * Off by default and staff-only, because framing a stranger's page under Deck's
 * header is a real hand-over: whatever they serve is what a visitor sees inside
 * our chrome, and they can change it any time after review.
 *
 * Two things make it survivable.
 *
 * `sandbox="allow-scripts"` **without** `allow-same-origin`. That pairing is the
 * whole security model: the frame is given a unique opaque origin, so its
 * scripts cannot read Deck's cookies or localStorage, cannot touch this
 * document, and cannot navigate the top window. Adding `allow-same-origin`
 * alongside `allow-scripts` would hand the frame the power to remove its own
 * sandbox, which is why the two are never combined here.
 *
 * And it does not load until asked. Nothing is fetched from the maker's server
 * — no requests, no cookies, no IP — until somebody presses play, which also
 * keeps a third party off the page for readers who declined cookies.
 */
function Embedded({
  url,
  title,
  onPlay,
}: {
  url: string;
  title: string;
  onPlay: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <figure className="rounded-slab border border-edge bg-surface-2 p-3">
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          Running from {safeHost(url)} — not Deck
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] underline-offset-4 hover:text-accent hover:underline"
        >
          Open in a new tab ↗
        </a>
      </figcaption>

      {loaded ? (
        <iframe
          src={url}
          title={title}
          className="block aspect-[16/10] w-full rounded-[4px] border border-edge bg-canvas"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          /* Denies every permission a frame can ask for — camera, microphone,
             location, payment. An arcade game needs none of them. */
          allow=""
          loading="lazy"
        />
      ) : (
        <div className="grid aspect-[16/10] w-full place-items-center rounded-[4px] border border-edge bg-canvas p-6 text-center">
          <div>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted text-pretty">
              {title} runs on its maker&apos;s site. Nothing is loaded from them until you
              press play.
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                onPlay();
                setLoaded(true);
              }}
            >
              Load and play
            </Button>
          </div>
        </div>
      )}
    </figure>
  );
}

/** The host, or the raw string if it will not parse. Never rendered as a link. */
function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'another site';
  }
}
