import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useConsent } from '@/hooks/useConsent';

/**
 * The cookie notice, shown once to a first-time visitor.
 *
 * Shown to everybody now, not only when an AdSense id happens to be configured.
 * The old banner was tied to that one script, which meant a deploy without ads
 * asked nobody anything while embedded players still loaded — the reader's
 * exposure did not actually depend on the setting the banner was keyed to.
 *
 * **Both answers cost the same.** Two buttons, same size, same row, differing
 * only in which is filled. A "reject" hidden behind a settings page, greyed
 * out, or phrased as "manage preferences" is the pattern regulators call a dark
 * pattern and readers call a con. Rejecting here is one click and it is the
 * click nearest the reader's thumb.
 *
 * Nothing on Deck breaks either way: everything the site does itself keeps
 * working, including the placements makers buy directly, which are served from
 * Deck's own API and set no cookies at all.
 *
 * The banner is `aria-live`-free and non-modal on purpose. It does not trap
 * focus and does not block the page — a reader who wants to read Deck and
 * decide later can, and until they decide, nothing non-essential has loaded.
 */
export function ConsentBanner() {
  const { choice, grant, deny } = useConsent();
  const [detail, setDetail] = useState(false);

  if (choice !== 'unset') return null;

  return (
    <div
      role="region"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-edge bg-surface p-4 shadow-hard-lg"
    >
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center gap-4">
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-pretty">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
              Cookies
            </span>
            <br />
            Deck needs a few things stored on your device to work at all. Everything beyond that —
            advertising and embedded video — is up to you, and Deck works fine without it.
          </p>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={deny}>
              Reject
            </Button>
            <Button size="sm" onClick={grant}>
              Accept
            </Button>
          </div>
        </div>

        {/*
         * The detail is a disclosure, not a second page.
         *
         * Somebody deciding whether to accept should be able to see exactly
         * what they are deciding about without leaving the page and losing
         * their place — and the honest version of that list is short enough to
         * fit here.
         */}
        <button
          type="button"
          onClick={() => setDetail(!detail)}
          aria-expanded={detail}
          className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted underline-offset-2 hover:text-body hover:underline"
        >
          {detail ? 'Hide detail' : 'What is stored?'}
        </button>

        {detail && (
          <dl className="mt-3 grid gap-3 border-t border-edge pt-3 text-xs leading-relaxed sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
                Always on
              </dt>
              <dd className="mt-1 text-muted text-pretty">
                Your sign-in, your theme and your cart. Kept on your device only, never sent
                anywhere else, and Deck cannot sign you in or remember dark mode without them.
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
                Only if you accept
              </dt>
              <dd className="mt-1 text-muted text-pretty">
                Google&apos;s advertising script, and embedded video players on launch pages. Both
                are third parties that would see your visit. Neither loads until you say yes.
              </dd>
            </div>
            {/* The summary above is the honest short version; the policy is the
                complete one, and a consent notice that does not link to it is
                asking for agreement to something the reader cannot go and read. */}
            <div className="sm:col-span-2">
              <Link
                to="/privacy"
                className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] underline underline-offset-4 transition-colors hover:text-accent"
              >
                Read the full privacy policy
              </Link>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
