import type { ReactNode } from 'react';

/**
 * The building blocks of Deck's docs pages — Deck Games, GameID and Deck
 * Circuit all read the same way: a sticky contents column on wide screens, one
 * long read on a phone, prose and code in the arcade's type.
 *
 * These lived as copies inside each page and had already begun to drift; one
 * set, imported everywhere, keeps the three looking like one manual.
 */

/** The page frame: eyebrow, heading, intro, then contents beside the article. */
export function DocsPage({
  title,
  eyebrow,
  heading,
  intro,
  sections,
  children,
}: {
  /** The browser tab's title. */
  title: string;
  eyebrow: ReactNode;
  heading: string;
  intro: ReactNode;
  /** `[id, label]` for each section, in order, for the contents column. */
  sections: readonly (readonly [string, string])[];
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-28 pt-24 sm:px-6 sm:pt-28">
      <title>{title}</title>
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-g-ember-ink">
        {eyebrow}
      </p>
      <h1 className="mt-4 max-w-3xl text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[0.95] tracking-[-0.055em] text-balance">
        {heading}
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-g-mute">{intro}</p>

      <div className="mt-14 grid gap-14 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ol className="sticky top-24 space-y-2.5 border-l border-g-line pl-4 text-[13px]">
            {sections.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-g-mute transition-colors hover:text-g-ink">
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0 max-w-3xl space-y-20">{children}</article>
      </div>
    </div>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <h2
        id={`${id}-title`}
        className="text-[clamp(1.5rem,3vw,2.25rem)] font-medium tracking-[-0.045em]"
      >
        {title}
      </h2>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export const P = ({ children }: { children: ReactNode }) => (
  <p className="text-[15px] leading-[1.75] text-g-ink/85 text-pretty">{children}</p>
);

export const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded-md bg-g-paper-2 px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
);

export function Pre({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-g-night p-5 font-mono text-[12.5px] leading-[1.7] text-g-night-ink">
      <code>{children}</code>
    </pre>
  );
}

export function Steps({ items, start = 1 }: { items: ReactNode[]; start?: number }) {
  return (
    <ol start={start} className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-4 text-[15px] leading-[1.7]">
          <span className="grid size-6 shrink-0 translate-y-0.5 place-items-center rounded-full border border-g-line font-mono text-[11px] text-g-mute">
            {start + index}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3 text-[15px] leading-[1.7]">
          <span aria-hidden="true" className="mt-3 size-1 shrink-0 rounded-full bg-g-ember" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** A called function: its name, what it returns, and what it does. */
export function Api({
  name,
  returns,
  children,
}: {
  name: string;
  returns: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-g-line pt-5">
      <p className="font-mono text-[14px] font-medium">{name}</p>
      <p className="mt-1 font-mono text-[11px] text-g-mute">→ {returns}</p>
      <p className="mt-2 text-[14px] leading-[1.7] text-g-ink/85">{children}</p>
    </div>
  );
}

/** An HTTP endpoint: method, path, and what it does. */
export function Endpoint({
  method,
  path,
  children,
}: {
  method: string;
  path: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-g-line pt-5">
      <p className="break-all font-mono text-[13px]">
        <span className="mr-2 rounded-md bg-g-ink px-1.5 py-0.5 text-[10px] text-g-paper">
          {method}
        </span>
        {path}
      </p>
      <div className="mt-2 text-[14px] leading-[1.7] text-g-ink/85">{children}</div>
    </div>
  );
}

/**
 * A table. `keyColumn` sets how the first column reads: `code` for names a
 * reader will type (fields, scopes, errors), `label` for plain headings.
 */
export function Table({
  head,
  rows,
  keyColumn = 'code',
}: {
  head: string[];
  rows: string[][];
  keyColumn?: 'code' | 'label';
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-g-line">
      <table className="w-full min-w-[540px] text-left text-[13px]">
        <thead className="bg-g-paper-2 font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
          <tr>
            {head.map((cell) => (
              <th key={cell} className="px-4 py-3 font-normal">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-g-line">
          {rows.map((row) => (
            <tr key={row.join('|')}>
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={
                    index !== 0
                      ? 'px-4 py-3 align-top text-g-mute'
                      : keyColumn === 'code'
                        ? 'px-4 py-3 align-top font-mono text-[12px]'
                        : 'px-4 py-3 align-top font-medium'
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-g-paper-2 p-4 text-[14px] leading-[1.7]">{children}</div>;
}
