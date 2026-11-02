import { Backdrop } from '@/components/ui/Ambient';
import { ToppledBricks } from '@/components/ui/Bricks';
import { ButtonLink } from '@/components/ui/Button';
import { useLaunches } from '@/hooks/useSite';

export function NotFound() {
  const launches = useLaunches();
  return (
    <div className="relative isolate overflow-hidden">
      <Backdrop pattern="stripes" />

      <div className="relative mx-auto flex min-h-[65dvh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        {/* The brand mark, knocked over — the one state the logo is never in
            anywhere else on the site, which is the joke. */}
        <ToppledBricks className="w-56 animate-[var(--animate-slam)] text-edge sm:w-64" />

        <p className="rounded-full mt-3 border border-line bg-edge px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-canvas">
          Error 404
        </p>
        <h1 className="display-tight mt-4 text-4xl text-balance sm:text-5xl">
          This page never launched
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted text-pretty">
          {launches
            ? 'The link may be broken, or the launch it pointed to was removed.'
            : 'The link may be broken, or the page it pointed to has moved.'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/">Back home</ButtonLink>
          {launches ? (
            <ButtonLink to="/discover" variant="secondary">
              Browse launches
            </ButtonLink>
          ) : (
            <ButtonLink to="/games" variant="secondary">
              Play Deck Games
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}
