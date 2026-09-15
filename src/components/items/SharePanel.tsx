import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useShareKit } from '@/hooks/useShare';
import {
  drawShareCard,
  SHARE_CARD_CUTS,
  SHARE_CARD_VARIANTS,
  type ShareCardVariant,
} from '@/lib/shareCard';
import { cn } from '@/lib/utils';
import type { Item } from '@/types';

type Copied = 'markdown' | 'html' | 'post' | 'link' | null;

/**
 * Everything a maker needs to tell people their launch is up.
 *
 * Three different jobs, which is why it is three different artefacts rather
 * than one "share" button: an image to post, a badge to embed on their own
 * site, and text to paste. Each is copyable in one action, because a share
 * panel that makes you select text has failed at the only thing it does.
 */
export function SharePanel({ item }: { item: Item }) {
  const { data: kit } = useShareKit(item.slug);
  const [copied, setCopied] = useState<Copied>(null);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* The landscape announcement is the default because it is the one that fits
     everywhere; the other two are better in one place each. */
  const [cut, setCut] = useState<ShareCardVariant>('launch');

  const copy = async (what: Exclude<Copied, null>, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied((current) => (current === what ? null : current)), 1800);
    } catch {
      setError('Your browser would not let us copy that');
    }
  };

  const download = async () => {
    setError(null);
    setDrawing(true);
    try {
      const blob = await drawShareCard({
        name: item.name,
        tagline: item.tagline,
        voteCount: item.voteCount,
        logoUrl: item.logoUrl,
        launchDate: item.launchDate,
        variant: cut,
        /* Host plus path, no scheme — the card is read, not clicked, so the
           https:// is noise that costs width the slug could use. */
        shareUrl: `${window.location.host.replace(/^www\./, '')}/item/${item.slug}`,
      });
      if (!blob) throw new Error('The card could not be drawn');

      /* Object URL revoked straight after the click: leaving it alive holds the
         whole PNG in memory for as long as the tab is open. */
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.slug}-on-deck-${cut}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not make that image');
    } finally {
      setDrawing(false);
    }
  };

  if (!kit) return null;

  return (
    <Card className="p-5">
      <h2 className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
        Share this launch
      </h2>

      <div className="mt-4 space-y-5">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
            An image to post
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Your name, tagline and vote count, drawn in Deck&apos;s type. Three shapes, because a
            landscape card is a letterbox on Instagram and a poster is a column in Slack.
          </p>

          {/* A radiogroup rather than three buttons: these are one choice with
              three answers, and nothing happens until Download. */}
          <div
            role="radiogroup"
            aria-label="Card shape"
            className="mt-2.5 grid grid-cols-3 gap-1.5"
          >
            {SHARE_CARD_VARIANTS.map((variant) => (
              <button
                key={variant}
                type="button"
                role="radio"
                aria-checked={cut === variant}
                onClick={() => setCut(variant)}
                className={cn(
                  'rounded-slab border border-edge px-1.5 py-1.5',
                  'font-mono text-[10px] font-bold uppercase tracking-[0.04em]',
                  'transition-colors duration-[120ms]',
                  cut === variant
                    ? 'bg-pop text-on-pop shadow-hard-sm'
                    : 'bg-surface text-body hover:bg-surface-2',
                )}
              >
                {SHARE_CARD_CUTS[variant].label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
            {SHARE_CARD_CUTS[cut].blurb}
          </p>

          <Button
            size="sm"
            className="mt-2.5 w-full"
            onClick={() => void download()}
            loading={drawing}
          >
            Download the card
          </Button>
        </div>

        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
            A badge for your site
          </p>
          {/* Shown as the real thing, served from the same URL the snippet
              uses — so what you copy is provably what you saw. */}
          <img
            src={kit.badgeUrl}
            alt="Featured on Deck"
            height={28}
            className="mt-2 block"
            loading="lazy"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void copy('markdown', kit.embed.markdown)}
            >
              {copied === 'markdown' ? 'Copied' : 'Copy Markdown'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void copy('html', kit.embed.html)}>
              {copied === 'html' ? 'Copied' : 'Copy HTML'}
            </Button>
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
            Something to say
          </p>
          <p className="mt-2 whitespace-pre-line border border-edge bg-surface-2 p-3 text-xs leading-relaxed">
            {kit.post}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void copy('post', kit.post)}>
              {copied === 'post' ? 'Copied' : 'Copy post'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void copy('link', kit.pageUrl)}>
              {copied === 'link' ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 border border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
        >
          {error}
        </p>
      )}
    </Card>
  );
}
