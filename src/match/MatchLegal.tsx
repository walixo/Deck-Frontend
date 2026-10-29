import type { LegalBlock, LegalDocument } from '@/data/legal';
import { cn } from '@/lib/utils';
import { MATCH_PRIVACY, MATCH_TERMS } from './legal';
import { CARD, EYEBROW, LOVE, SOFT } from './styles';

/** The details still to be supplied: every `{{placeholder}}` in a document. */
function pending(document: LegalDocument): string[] {
  const text = document.sections.flatMap((section) =>
    section.blocks.flatMap((block) =>
      block.kind === 'list'
        ? block.items
        : block.kind === 'table'
          ? block.rows.flat()
          : [block.text],
    ),
  );
  return [...new Set(text.flatMap((t) => [...t.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1])))];
}

/** Text with `{{placeholders}}` called out, so an unfinished page looks unfinished. */
function Text({ children }: { children: string }) {
  return (
    <>
      {children.split(/(\{\{[^}]+\}\})/g).map((part, index) => {
        const name = part.match(/^\{\{([^}]+)\}\}$/)?.[1];
        return name ? (
          <mark
            key={index}
            className="mx-0.5 inline-block rounded-full bg-[#ff7a59]/20 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[#ffb39e]"
          >
            {name}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (block.kind === 'p') {
    return (
      <p className="mt-3 text-[15px] leading-relaxed text-white/75 first:mt-0">
        <Text>{block.text}</Text>
      </p>
    );
  }
  if (block.kind === 'list') {
    return (
      <ul className="mt-3 space-y-2 first:mt-0">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-white/75">
            <span
              aria-hidden="true"
              className={cn('mt-[0.6em] size-1.5 shrink-0 rounded-full', LOVE)}
            />
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
      <p className="mt-4 rounded-[18px] bg-white/[0.06] px-4 py-3 text-[14px] leading-relaxed text-white/70">
        <Text>{block.text}</Text>
      </p>
    );
  }
  return (
    <dl className="mt-3 divide-y divide-white/10 overflow-hidden rounded-[18px] bg-white/[0.04] first:mt-0">
      {block.rows.map(([what, why]) => (
        <div key={what} className="px-4 py-3.5">
          <dt className="text-[14px] font-semibold text-white">
            <Text>{what}</Text>
          </dt>
          <dd className="mt-1 text-[14px] leading-relaxed text-white/65">
            <Text>{why}</Text>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Match's terms or privacy policy, at match.onedeck.africa/terms or /privacy. */
export function MatchLegal({ page }: { page: 'terms' | 'privacy' }) {
  const document = page === 'terms' ? MATCH_TERMS : MATCH_PRIVACY;
  const missing = pending(document);
  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-[#0b0a09] text-[#f4f2ee]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 size-[44rem] -translate-x-1/2 rounded-full bg-[#ff5c8a]/12 blur-3xl" />
        <div className="absolute top-[60rem] -right-40 size-[34rem] rounded-full bg-[#9d6bff]/10 blur-3xl" />
      </div>
      <header className="mx-auto flex w-full max-w-[44rem] items-center justify-between px-5 py-5">
        <a href="/" className="flex items-baseline gap-2" aria-label="Back to Match">
          <span className="text-[26px] font-semibold tracking-[-0.06em]">match</span>
          <span
            className={cn('size-[7px] rounded-full shadow-[0_0_8px_rgb(255_92_138_/_0.8)]', LOVE)}
          />
        </a>
        <nav className="flex gap-1 rounded-full bg-white/[0.07] p-1 text-[13px] font-medium">
          {(['terms', 'privacy'] as const).map((slug) => (
            <a
              key={slug}
              href={`/${slug}`}
              aria-current={slug === page ? 'page' : undefined}
              className={cn(
                'rounded-full px-3.5 py-1.5',
                slug === page ? 'bg-[#f4f2ee] text-[#0b0a09]' : 'text-white/70 hover:text-white',
              )}
            >
              {slug === 'terms' ? 'Terms' : 'Privacy'}
            </a>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[44rem] px-5 pb-16">
        <p className={cn(EYEBROW, 'mt-6')}>{document.eyebrow}</p>
        <h1 className="mt-3 text-[clamp(2.5rem,10vw,4rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
          {document.title.split(' ')[0]}
          <span className={cn('block', SOFT)}>{document.title.split(' ').slice(1).join(' ')}</span>
        </h1>
        <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-white/65">
          {document.summary}
        </p>
        <p className="mt-3 font-mono text-[12px] text-white/45">Effective {document.effective}</p>
        {missing.length > 0 && (
          <p
            role="note"
            className="mt-6 rounded-[18px] bg-[#ff7a59]/[0.14] px-4 py-3 text-[14px] text-[#ffb39e]"
          >
            Draft — {missing.length} detail{missing.length === 1 ? '' : 's'} still to be filled in.
          </p>
        )}
        <div className="mt-8 space-y-4">
          {document.sections.map((section, index) => (
            <section key={section.title} className={CARD}>
              <h2 className="flex items-baseline gap-3 text-[19px] font-semibold tracking-[-0.03em]">
                <span className="font-mono text-[12px] font-medium text-[#ff8fab]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {section.title}
              </h2>
              <div className="mt-3">
                {section.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-10 text-center">
          <a
            href="/"
            className="text-[14px] font-medium text-[#ff8fab] underline-offset-4 hover:underline"
          >
            Back to Match
          </a>
        </p>
      </main>
    </div>
  );
}
