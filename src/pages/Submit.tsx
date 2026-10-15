import { LaunchForm } from '@/components/items/LaunchForm';
import { PageBanner } from '@/components/ui/Ambient';

export function Submit() {
  return (
    <div className="relative isolate mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8 max-w-2xl">
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
          New launch
        </p>
        <h1 className="display-tight text-3xl text-balance sm:text-4xl">
          Put your product on the board
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
          It goes live immediately and joins today&apos;s leaderboard. You can delete it later from
          its page.
        </p>
      </header>

      <LaunchForm mode="new" />
    </div>
  );
}
