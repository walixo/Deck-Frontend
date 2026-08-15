import { useEffect, useRef } from 'react';
import { adsense, adsenseConfigured, loadAdSense } from '@/lib/adsense';
import { useConsent } from '@/hooks/useConsent';

/**
 * A Google ad unit.
 *
 * Renders nothing unless AdSense is configured *and* the reader has said yes.
 * Both conditions are checked before the script is even requested, so declining
 * is not a cosmetic hide — the tag never loads and Google never sees the visit.
 *
 * An ad blocker leaves the container empty rather than broken: the wrapper has
 * no border, no label and no reserved height of its own, so a blocked unit
 * collapses to nothing instead of leaving a labelled hole in the page.
 */
export function GoogleAdSlot({ className }: { className?: string }) {
  const { choice } = useConsent();
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  const allowed = adsenseConfigured && choice === 'granted';

  useEffect(() => {
    if (!allowed || pushed.current || !insRef.current) return;

    loadAdSense();
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
      /* Guarded because AdSense throws if the same <ins> is pushed twice, which
         React's development double-effect would otherwise do every mount. */
      pushed.current = true;
    } catch {
      /* Blocked, offline, or the tag never arrived. Nothing to show, and
         nothing worth interrupting the page for. */
    }
  }, [allowed]);

  if (!allowed) return null;

  return (
    <div className={className} data-testid="google-ad">
      <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
        Advertisement
      </p>
      <ins
        ref={insRef}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={adsense.client}
        data-ad-slot={adsense.slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
