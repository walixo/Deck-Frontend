import { useEffect, useState } from 'react';
import { PageBanner } from '@/components/ui/Ambient';
import {
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  pendingPlaceholders,
  type LegalBlock,
  type LegalDocument,
} from '@/data/legal';
import { cn } from '@/lib/utils';

/** Stable anchor for a heading — what the contents rail links to. */
function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Renders text with `{{placeholders}}` called out.
 *
 * A half-finished legal document that looks finished is the failure mode worth
 * designing against — "Deck is operated by" followed by nothing reads as a
 * typo, while a red marker reading LEGAL ENTITY NAME reads as a job. They are
 * counted in a banner at the top of the page as well, so the page is unusable
 * as a published document until every one is gone.
 */
function Text({ children }: { children: string }) {
  const parts = children.split(/(\{\{[^}]+\}\})/g);

  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\{\{([^}]+)\}\}$/);
        if (!match) return <span key={index}>{part}</span>;

        return (
          <mark
            key={index}
            className="mx-0.5 inline-block border border-danger bg-danger/15 px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-danger"
          >
            {match[1]}
          </mark>
        );
      })}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (block.kind === 'p') {
    return (
      <p className="mt-4 text-[15px] leading-relaxed text-pretty first:mt-0">
        <Text>{block.text}</Text>
      </p>
    );
  }

  if (block.kind === 'list') {
    return (
      <ul className="mt-4 space-y-2">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-pretty">
            {/* A dash rather than a bullet — the rest of Deck sets lists this
                way, and a disc in a column of prose reads as a different font. */}
            <span aria-hidden="true" className="select-none text-muted">
              —
            </span>
            <span>
              <Text>{item}</Text>
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.kind === 'note') {
    return (
      <aside className="mt-5 border-l-2 border-accent bg-surface-2/50 py-3 pl-4 pr-3">
        <p className="text-sm leading-relaxed text-pretty">
          <Text>{block.text}</Text>
        </p>
      </aside>
    );
  }

  return (
    /* Scrolls inside itself rather than taking the page sideways — these tables
       have a long second column and the page is read on phones. */
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <thead>
          <tr>
            {block.head.map((heading) => (
              <th
                key={heading}
                scope="col"
                className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map(([term, detail]) => (
            <tr key={term} className="align-top">
              <th
                scope="row"
                className="w-1/3 border-b border-edge py-3 pr-6 text-sm font-bold text-pretty"
              >
                <Text>{term}</Text>
              </th>
              <td className="border-b border-edge py-3 text-sm leading-relaxed text-muted text-pretty">
                <Text>{detail}</Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Highlights whichever section the reader is currently level with. */
function useActiveSection(document: LegalDocument): string {
  const [active, setActive] = useState('');

  useEffect(() => {
    const headings = document.sections
      .map((section) => window.document.getElementById(slug(section.title)))
      .filter((element): element is HTMLElement => element !== null);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      /* A band across the upper third: a section counts as "the one you are
         reading" once its heading has cleared the sticky header, and stops
         counting well before it leaves the screen. */
      { rootMargin: '-96px 0px -66% 0px', threshold: 0 },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [document]);

  return active;
}

function LegalPage({ document }: { document: LegalDocument }) {
  const active = useActiveSection(document);
  const pending = pendingPlaceholders(document);

  useEffect(() => {
    window.document.title = `${document.title} — Deck`;
  }, [document]);

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="max-w-3xl">
        <p className="mb-3 inline-block border border-edge bg-deep px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-deep">
          {document.eyebrow}
        </p>
        <h1 className="display-tight text-3xl uppercase text-balance sm:text-4xl">
          {document.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted text-pretty">{document.summary}</p>
        <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
          In effect from {document.effective}
        </p>
      </header>

      {pending.length > 0 && (
        <div
          role="status"
          className="mt-8 max-w-3xl border-2 border-danger bg-danger/10 p-4 sm:p-5"
        >
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-danger">
            Draft — {pending.length} {pending.length === 1 ? 'detail' : 'details'} still to fill in
          </p>
          <p className="mt-2 text-sm leading-relaxed text-pretty">
            This document is not ready to publish. Every marker below appears in the text and has to
            be replaced in <code className="font-mono text-[13px]">src/data/legal.ts</code>, and the
            whole thing needs review by a qualified lawyer in your jurisdiction before you rely on
            it.
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {pending.map((item) => (
              <li
                key={item}
                className="border border-danger px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-danger"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prose left, contents right — the same arrangement the handbook uses,
          because the rail is navigation for the page you are already on. */}
      <div className="mt-10 gap-10 lg:flex lg:items-start">
        <div className="min-w-0 flex-1 lg:max-w-3xl">
          {document.sections.map((section, index) => (
            <section
              key={section.title}
              id={slug(section.title)}
              className="scroll-mt-24 border-t border-edge pt-8 first:border-t-0 first:pt-0"
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h2 className="display-tight mt-1.5 text-xl uppercase text-balance">
                {section.title}
              </h2>

              <div className="mt-4 pb-8">
                {section.blocks.map((block, blockIndex) => (
                  <Block key={blockIndex} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <nav aria-label="Contents" className="hidden w-60 shrink-0 lg:sticky lg:top-24 lg:block">
          <p className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
            Contents
          </p>
          <ul className="mt-3 space-y-1.5">
            {document.sections.map((section) => (
              <li key={section.title}>
                <a
                  href={`#${slug(section.title)}`}
                  aria-current={active === slug(section.title) ? 'true' : undefined}
                  className={cn(
                    'block text-[13px] leading-snug underline-offset-4 transition-colors hover:text-accent hover:underline',
                    active === slug(section.title) ? 'font-bold text-accent' : 'text-muted',
                  )}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function Privacy() {
  return <LegalPage document={PRIVACY_POLICY} />;
}

export function Terms() {
  return <LegalPage document={TERMS_OF_SERVICE} />;
}
