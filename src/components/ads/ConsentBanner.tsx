import { adsenseConfigured } from '@/lib/adsense';
import { Button } from '@/components/ui/Button';
import { useConsent } from '@/hooks/useConsent';

/**
 * Asks before loading Google's advertising script.
 *
 * Only appears when there is actually something to consent to — with no AdSense
 * id configured, Deck makes no third-party request and a banner asking about
 * one would be theatre.
 *
 * Both answers are equally easy to give. A "decline" hidden behind a settings
 * page, or greyed out beside a bright "accept", is the pattern regulators call
 * a dark pattern and readers call annoying; the two buttons here differ only in
 * which one is filled.
 *
 * Deck's own paid placements keep working either way — they are served from
 * Deck's API, set no cookies, and tell Google nothing.
 */
export function ConsentBanner() {
  const { choice, grant, deny } = useConsent();

  if (!adsenseConfigured || choice !== 'unset') return null;

  return (
    <div
      role="region"
      aria-label="Advertising choices"
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-edge bg-surface p-4"
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-4">
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-pretty">
          Deck can show ads from Google, which means Google sees your visit. Say no and you will
          still see everything on Deck — including the placements makers buy from us directly, which
          set no cookies.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="secondary" onClick={deny}>
            No thanks
          </Button>
          <Button size="sm" onClick={grant}>
            Allow
          </Button>
        </div>
      </div>
    </div>
  );
}
