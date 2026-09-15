import { useEffect, useState } from 'react';
import { PageBanner } from '@/components/ui/Ambient';
import { handbookDownloads, handbookMeta, handbookSections } from '@/data/handbook.generated';
import { cn } from '@/lib/utils';

/**
 * The build handbook, as a page.
 *
 * It existed as a PDF and a DOCX at the repository root, and nothing linked to
 * either — no route, no footer entry, and no `Frontend/public` for Vite to
 * serve them out of. Seventeen sections of documentation that could only be
 * found by listing the repository, which is the same as not having it.
 *
 * The content is generated from `scripts/handbook/content.js`, the same source
 * the two documents are rendered from, so this cannot drift from them. The
 * downloads stay: a page is the right way to read one section, a document is
 * the right way to hand the whole thing to somebody.
 */
export function Handbook() {
  const active = useActiveSection();

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="max-w-3xl">
        <p className="mb-3 inline-block border border-edge bg-deep px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-deep">
          Build handbook
        </p>
        <h1 className="display-tight text-3xl uppercase text-balance sm:text-4xl">
          How Deck is built
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted text-pretty">
          {handbookMeta.subtitle}
        </p>
      </header>

      {/* The cover's fact table, kept — it is the fastest answer to "what is
          this thing made of" and belongs above the contents, not inside them. */}
      <dl className="mt-8 max-w-3xl border-t border-edge">
        {handbookMeta.facts.map(([label, detail]) => (
          <div
            key={label}
            className="flex flex-col gap-x-6 gap-y-1 border-b border-edge py-2.5 sm:flex-row"
          >
            <dt className="w-40 shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
              {label}
            </dt>
            <dd className="text-sm leading-relaxed text-pretty">{detail}</dd>
          </div>
        ))}
      </dl>

      <Downloads />

      {/*
       * Prose left, contents right — the same arrangement as Discover's launch
       * archive, and for the same reason: the rail is navigation for the page
       * you are already on, so it takes the secondary side.
       */}
      <div className="mt-10 gap-10 lg:flex lg:items-start">
        <div className="min-w-0 flex-1">
          {handbookSections.map((section) => (
            <section
              key={section.n}
              id={slug(section.title)}
              /* Cleared by the sticky header when jumped to from the rail. */
              className="scroll-mt-24 border-t border-edge pt-8 first:border-t-0 first:pt-0"
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                {String(section.n).padStart(2, '0')}
              </p>
              <h2 className="display-tight mt-1 text-2xl uppercase text-balance sm:text-3xl">
                {section.title}
              </h2>

              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="mt-4 max-w-2xl text-[15px] leading-[1.75] text-body text-pretty"
                >
                  <Prose text={paragraph} />
                </p>
              ))}

              {section.bullets.length > 0 && (
                <dl className="mt-6 max-w-2xl border-t border-edge">
                  {section.bullets.map(([label, detail]) => (
                    <div
                      key={label}
                      className="flex flex-col gap-x-6 gap-y-1 border-b border-edge py-3 sm:flex-row"
                    >
                      <dt className="w-44 shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.08em]">
                        {label}
                      </dt>
                      <dd className="text-sm leading-relaxed text-muted text-pretty">
                        <Prose text={detail} />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="pb-8" />
            </section>
          ))}

          <p className="border-t border-edge pt-5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
            Generated {handbookMeta.generated} from the repository
          </p>
        </div>

        <nav
          aria-label="Handbook contents"
          className="order-last mb-10 shrink-0 lg:sticky lg:top-20 lg:mb-0 lg:w-56"
        >
          <p className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
            Contents
          </p>
          <ol className="mt-2 max-h-[70vh] space-y-px overflow-y-auto">
            {handbookSections.map((section) => {
              const id = slug(section.title);
              const on = active === id;
              return (
                <li key={section.n}>
                  <a
                    href={`#${id}`}
                    aria-current={on ? 'true' : undefined}
                    className={cn(
                      'flex gap-2 rounded-slab px-2 py-1.5 text-[13px] leading-snug transition-colors duration-[140ms]',
                      on
                        ? 'bg-surface-2 font-bold text-body'
                        : 'text-muted hover:bg-surface-2/45 hover:text-body',
                    )}
                  >
                    <span
                      className={cn(
                        'font-mono text-[11px] font-bold tabular-nums',
                        on ? 'text-accent' : 'text-muted/70',
                      )}
                    >
                      {String(section.n).padStart(2, '0')}
                    </span>
                    <span className="text-pretty">{section.title}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}

/**
 * The whole thing, to keep or to send on.
 *
 * Both formats, because they answer different questions: the PDF is what it
 * looks like, the DOCX is what somebody can paste into their own document.
 * They are the identical content — the page, the PDF and the DOCX are three
 * renderings of one file.
 */
function Downloads() {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {handbookDownloads.map(({ file, kind, size }) => (
        <a
          key={file}
          href={`/${file}`}
          download
          className="inline-flex items-center gap-2 rounded-slab border border-edge bg-surface px-3 py-2 shadow-hard transition-[transform,box-shadow] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg"
        >
          <span className="border border-edge bg-pop px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-on-pop">
            {kind}
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
            Download
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
            {size}
          </span>
        </a>
      ))}
    </div>
  );
}

/**
 * Backticks in the source become code.
 *
 * The handbook is written with Markdown-style inline code — `tokens.json`,
 * `npm run tokens` — because the PDF renderer wants a marker it can restyle.
 * Rendering the backticks literally on the page would be the one place the
 * three outputs visibly disagreed.
 */
function Prose({ text }: { text: string }) {
  return (
    <>
      {/* Keyed by position: the split is deterministic and the fragments never
          reorder, so the index is a stable identity here. */}
      {text.split(/`([^`]+)`/g).map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="rounded-[3px] border border-edge bg-surface-2 px-1 py-px font-mono text-[0.85em]"
          >
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Stable, readable anchors — `#the-design-system` rather than `#3`. */
function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Which section the reader is in, for the rail.
 *
 * A measurement against a reading line rather than an IntersectionObserver.
 * The observer version was tidier and wrong at both ends: it highlighted a
 * section only while that section crossed a thin band near the middle of the
 * viewport, so at the top of the page — where the header and the fact table
 * occupy the middle — and at the bottom, where the last section is too short
 * to reach it, nothing was highlighted at all. A contents rail that goes blank
 * exactly when you arrive is worse than a slightly cruder one.
 *
 * "The last section that has passed the line" always yields exactly one answer,
 * and the two ends are pinned explicitly: the first section before you have
 * scrolled, the last once you are against the bottom, which is the only way a
 * short closing section is ever reachable.
 */
function useActiveSection(): string {
  const [active, setActive] = useState(() => slug(handbookSections[0].title));

  useEffect(() => {
    const ids = handbookSections.map((section) => slug(section.title));
    let frame = 0;

    const measure = () => {
      frame = 0;

      /* Just under the sticky header — the first line of text you can actually
         read, not the top of the viewport, which is behind the header. */
      const line = 140;
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      if (atBottom) {
        setActive(ids[ids.length - 1]);
        return;
      }

      let current = ids[0];
      for (const id of ids) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };

    /*
     * Coalesced to one measurement per frame. Seventeen `getBoundingClientRect`
     * calls is cheap, but a scroll event can fire several times per frame and
     * each call forces layout — unthrottled, a flick down the page turns into
     * hundreds of synchronous layouts.
     */
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return active;
}
