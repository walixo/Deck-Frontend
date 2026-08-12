import { LostCardIllustration } from '@/components/illustrations/Illustrations';
import { Backdrop } from '@/components/ui/Ambient';
import { ButtonLink } from '@/components/ui/Button';

export function NotFound() {
  return (
    <div className="relative isolate overflow-hidden">
      <Backdrop pattern="stripes" />

      <div className="relative mx-auto flex min-h-[65dvh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <LostCardIllustration className="w-64 animate-[var(--animate-slam)] sm:w-72" />

        <p className="mt-3 border-2 border-edge bg-coral px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-white">
          Error 404
        </p>
        <h1 className="display-tight mt-4 text-4xl uppercase text-balance sm:text-5xl">
          This page never launched
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted text-pretty">
          The link may be broken, or the launch it pointed to was removed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/">Back home</ButtonLink>
          <ButtonLink to="/discover" variant="secondary">
            Browse launches
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
