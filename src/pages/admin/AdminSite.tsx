import { Card } from '@/components/ui/Card';
import { useSaveSite, useSite, type SiteSettings } from '@/hooks/useSite';
import { cn } from '@/lib/utils';

/**
 * What onedeck.africa shows, for staff: the launch product on or off, and
 * which landing page the home page uses. Changes are live for everyone within
 * a minute, with no deploy, and each one is written to the trail.
 */
export function AdminSite() {
  const site = useSite();
  const save = useSaveSite();
  const set = (change: Partial<SiteSettings>) => save.mutate(change);
  return (
    <div className="space-y-10">
      <header>
        <h1 className="display-tight text-3xl">Site</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
          What onedeck.africa shows. Changes reach everyone within a minute, with no deploy, and are
          recorded in the trail.
        </p>
      </header>

      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-lg font-medium">Launches</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">
              The launch product: the daily board, Discover and Picks, launch pages, submitting and
              editing launches, founder pages, Acquisitions, Future Gen, and the ads that run on
              them. Off, they leave the menus and their pages show as not found — except to staff,
              who can still open them.
            </p>
          </div>
          <Switch
            name="Launches"
            on={site.launches}
            label={site.launches ? 'Shown' : 'Hidden'}
            busy={save.isPending}
            onChange={(launches) => set({ launches })}
          />
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-medium">Landing page</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">
            What onedeck.africa opens on.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Landing page">
          {(
            [
              ['products', 'Match and Deck Games', 'Deck’s own products, with a way into each.'],
              [
                'launches',
                'Launches',
                'The launch board’s landing page: the reel, launches, Future Gen.',
              ],
            ] as const
          ).map(([value, title, body]) => {
            const chosen = site.landing === value;
            const blocked = value === 'launches' && !site.launches;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={chosen}
                disabled={save.isPending}
                onClick={() => set({ landing: value })}
                className={cn(
                  'rounded-slab border p-4 text-left transition-colors',
                  chosen
                    ? 'border-edge bg-surface-2 shadow-hard'
                    : 'border-line hover:bg-surface-2',
                )}
              >
                <span className="block font-medium">{title}</span>
                <span className="mt-1 block text-[13px] text-muted">{body}</span>
                {chosen && blocked && (
                  <span className="mt-2 block text-[12px] text-danger">
                    Showing Match and Deck Games until launches are switched on.
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>
      {save.error && <p className="text-sm text-danger">{save.error.message}</p>}
    </div>
  );
}

function Switch({
  name,
  on,
  label,
  busy,
  onChange,
}: {
  name: string;
  on: boolean;
  label: string;
  busy: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={name}
      disabled={busy}
      onClick={() => onChange(!on)}
      className="flex items-center gap-3 disabled:opacity-60"
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{label}</span>
      <span
        className={cn(
          'relative h-7 w-12 rounded-full border border-edge transition-colors',
          on ? 'bg-accent' : 'bg-surface-2',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full border border-edge bg-canvas transition-[left]',
            on ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}
