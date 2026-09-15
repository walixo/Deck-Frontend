import { LaunchForm } from '@/components/items/LaunchForm';
import { PageBanner } from '@/components/ui/Ambient';

export function Submit() {
  return (
    <div className="relative isolate mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8 max-w-2xl">
        <p className="mb-3 inline-block border border-edge bg-deep px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-deep">
          New launch
        </p>
        <h1 className="display-tight text-3xl uppercase text-balance sm:text-4xl">
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
