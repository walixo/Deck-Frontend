import { LostCardIllustration } from '@/components/illustrations/Illustrations';
import { Ambient } from '@/components/ui/Ambient';
import { ButtonLink } from '@/components/ui/Button';

export function NotFound() {
  return (
    <div className="relative isolate overflow-hidden">
      <Ambient blobs />

      <div className="relative mx-auto flex min-h-[65dvh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <LostCardIllustration className="w-64 animate-[var(--animate-fade-in)] sm:w-72" />

        <p className="mt-2 font-mono text-sm text-zinc-400 dark:text-zinc-600">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          This page never launched
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 text-pretty dark:text-zinc-400">
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
