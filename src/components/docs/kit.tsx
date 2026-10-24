import { createContext, useContext, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * The parts Deck's docs are written in — one topic per page, read in three
 * columns: the product's pages on the left, the article in the middle, and
 * "On this page" on the right.
 *
 * API pages follow the shape that makes Paystack's reference easy to work
 * from: every endpoint is a row with its description and parameters on the
 * left and a dark code panel on the right — the request in cURL, Node or
 * Python, and the response it returns. The samples are generated from one
 * spec per endpoint, so the three languages can never disagree.
 */

/* ------------------------------------------------------------- manifest --- */

export interface DocPage {
  slug: string;
  title: string;
  /** One line under the title, and what search matches against. */
  lead: string;
  body: () => ReactNode;
}

export interface DocGroup {
  title: string;
  pages: DocPage[];
}

export interface DocProduct {
  id: 'developers' | 'circuit' | 'gameid';
  name: string;
  /** Where its API lives, for the endpoint panels. */
  apiBase: string;
  groups: DocGroup[];
}

export const ORIGIN = 'https://onedeck.africa';
export const API = `${ORIGIN}/api`;

/* --------------------------------------------------------------- prose --- */

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** A section heading. Its id feeds "On this page" and deep links. */
export function H2({ children, id }: { children: string; id?: string }) {
  const anchor = id ?? slugify(children);
  return (
    <h2
      id={anchor}
      data-toc={children}
      className="group mt-14 scroll-mt-24 text-[26px] font-semibold tracking-[-0.035em] first:mt-0"
    >
      <a href={`#${anchor}`} className="no-underline">
        {children}
        <span aria-hidden="true" className="ml-2 text-g-mute opacity-0 group-hover:opacity-100">
          #
        </span>
      </a>
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-8 text-[18px] font-semibold tracking-[-0.025em]">{children}</h3>;
}

export const P = ({ children }: { children: ReactNode }) => (
  <p className="mt-4 text-[16px] leading-[1.75] text-g-ink/85 text-pretty">{children}</p>
);

export const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded-md border border-g-line bg-g-paper-2 px-1.5 py-0.5 font-mono text-[0.84em]">
    {children}
  </code>
);

export const A = ({ to, children }: { to: string; children: ReactNode }) =>
  to.startsWith('http') || to.startsWith('#') ? (
    <a
      href={to}
      className="font-medium underline decoration-g-line underline-offset-4 hover:decoration-g-ink"
    >
      {children}
    </a>
  ) : (
    <Link
      to={to}
      className="font-medium underline decoration-g-line underline-offset-4 hover:decoration-g-ink"
    >
      {children}
    </Link>
  );

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        })
      }
      className={cn(
        'rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/60 transition-colors hover:bg-white/10 hover:text-white',
        className,
      )}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/** A code block with a label and a copy button. */
export function Pre({ children, label }: { children: string; label?: string }) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
          {label ?? ''}
        </span>
        <CopyButton text={children} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.7] text-[#ecebe7]">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function Steps({ items, start = 1 }: { items: ReactNode[]; start?: number }) {
  return (
    <ol start={start} className="mt-5 space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-4 text-[16px] leading-[1.7]">
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
    <ul className="mt-5 space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3 text-[16px] leading-[1.7]">
          <span
            aria-hidden="true"
            className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-g-ink/70"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
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
  rows: ReactNode[][];
  keyColumn?: 'code' | 'label';
}) {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-g-line">
      <table className="w-full min-w-[520px] text-left text-[14px]">
        <thead className="bg-g-paper-2 text-[12px] font-semibold text-g-mute">
          <tr>
            {head.map((cell) => (
              <th key={cell} className="px-4 py-2.5 font-semibold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-g-line">
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={
                    index !== 0
                      ? 'px-4 py-3 align-top leading-relaxed text-g-ink/75'
                      : keyColumn === 'code'
                        ? 'whitespace-nowrap px-4 py-3 align-top font-mono text-[12.5px]'
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

export function Callout({
  children,
  tone = 'note',
}: {
  children: ReactNode;
  tone?: 'note' | 'warning';
}) {
  return (
    <div
      className={cn(
        'mt-5 rounded-xl border px-4 py-3 text-[15px] leading-[1.7]',
        tone === 'warning' ? 'border-g-ember/30 bg-g-ember/[0.06]' : 'border-g-line bg-g-paper-2',
      )}
    >
      {children}
    </div>
  );
}

/** Cards that send the reader somewhere — the docs' front-page shortcuts. */
export function Cards({
  items,
}: {
  items: { title: string; body: string; to: string; mark?: string }[];
}) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="group rounded-2xl border border-g-line p-5 transition-colors hover:border-g-ink"
        >
          {item.mark && (
            <span className="grid size-9 place-items-center rounded-xl border border-g-line font-mono text-[12px] font-semibold">
              {item.mark}
            </span>
          )}
          <p className="mt-4 text-[15px] font-semibold tracking-[-0.02em]">{item.title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-g-mute">{item.body}</p>
        </Link>
      ))}
    </div>
  );
}

/** A function in the SDK: its call, what it returns, and what it does. */
export function Fn({
  name,
  returns,
  children,
}: {
  name: string;
  returns: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-6 rounded-xl border border-g-line p-4">
      <p className="font-mono text-[14px] font-semibold">{name}</p>
      <p className="mt-1 font-mono text-[11.5px] text-g-mute">returns {returns}</p>
      <div className="mt-2 text-[15px] leading-[1.7] text-g-ink/85">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------ endpoints --- */

type Lang = 'curl' | 'node' | 'python';
const LANGS: [Lang, string][] = [
  ['curl', 'cURL'],
  ['node', 'Node'],
  ['python', 'Python'],
];

/* The chosen language holds across every endpoint on the page. */
const LangContext = createContext<[Lang, (lang: Lang) => void]>(['curl', () => undefined]);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('deck-docs-lang') as Lang) || 'curl';
    } catch {
      return 'curl';
    }
  });
  const choose = (next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem('deck-docs-lang', next);
    } catch {
      /* Private mode: the choice lasts the visit. */
    }
  };
  return <LangContext.Provider value={[lang, choose]}>{children}</LangContext.Provider>;
}

export interface Param {
  name: string;
  type: string;
  required?: boolean;
  description: ReactNode;
}

export interface EndpointSpec {
  title: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** From the product's API base, e.g. `/games/v1/session/verify`. */
  path: string;
  /** The key a caller sends, as shown in samples; null for open endpoints. */
  auth?: string | null;
  description: ReactNode;
  pathParams?: Param[];
  query?: Param[];
  body?: Param[];
  /** A sample request body. */
  example?: Record<string, unknown>;
  /** Send the example form-encoded instead of as JSON (OAuth endpoints). */
  form?: boolean;
  /** A sample `?query`, appended to the URL in the samples. */
  exampleQuery?: string;
  response: unknown;
  status?: number;
}

const pyLiteral = (json: string) =>
  json.replace(/"(?:[^"\\]|\\.)*"|\btrue\b|\bfalse\b|\bnull\b/g, (m) =>
    m === 'true' ? 'True' : m === 'false' ? 'False' : m === 'null' ? 'None' : m,
  );

const indent = (text: string, by: string) =>
  text
    .split('\n')
    .map((line, i) => (i ? by + line : line))
    .join('\n');

function formSamples(url: string, spec: EndpointSpec): Record<Lang, string> {
  const fields = Object.entries(spec.example ?? {}).map(([k, v]) => [k, String(v)]);
  const curl = [`curl -X ${spec.method} ${url}`, ...fields.map(([k, v]) => `  -d ${k}=${v}`)].join(
    ' \\\n',
  );
  const node = [
    `const res = await fetch('${url}', {`,
    `  method: '${spec.method}',`,
    `  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },`,
    `  body: new URLSearchParams({`,
    ...fields.map(([k, v]) => `    ${/^[a-z_]+$/i.test(k) ? k : `'${k}'`}: '${v}',`),
    `  }),`,
    `});`,
    `const tokens = await res.json();`,
  ].join('\n');
  const python = [
    'import requests',
    '',
    `res = requests.${spec.method.toLowerCase()}(`,
    `    "${url}",`,
    `    data={`,
    ...fields.map(([k, v]) => `        "${k}": "${v}",`),
    `    },`,
    ')',
    'tokens = res.json()',
  ].join('\n');
  return { curl, node, python };
}

function samples(base: string, spec: EndpointSpec): Record<Lang, string> {
  const url = `${base}${spec.path}${spec.exampleQuery ? `?${spec.exampleQuery}` : ''}`;
  if (spec.form) return formSamples(url, spec);
  const body = spec.example ? JSON.stringify(spec.example, null, 2) : null;
  const method = spec.method;

  const curl = [
    `curl ${method === 'GET' ? '' : `-X ${method} `}${url}`,
    spec.auth ? `  -H "Authorization: Bearer ${spec.auth}"` : null,
    body ? `  -H "Content-Type: application/json"` : null,
    body ? `  -d '${body}'` : null,
  ]
    .filter(Boolean)
    .join(' \\\n');

  const headers = [
    spec.auth ? `    Authorization: 'Bearer ${spec.auth}',` : null,
    body ? `    'Content-Type': 'application/json',` : null,
  ].filter(Boolean);
  const node = [
    `const res = await fetch('${url}', {`,
    `  method: '${method}',`,
    headers.length ? `  headers: {\n${headers.join('\n')}\n  },` : null,
    body ? `  body: JSON.stringify(${indent(body, '  ')}),` : null,
    `});`,
    `const { data } = await res.json();`,
  ]
    .filter(Boolean)
    .join('\n');

  const pyArgs = [
    `    "${url}",`,
    spec.auth ? `    headers={"Authorization": "Bearer ${spec.auth}"},` : null,
    body ? `    json=${indent(pyLiteral(body), '    ')},` : null,
  ].filter(Boolean);
  const python = [
    'import requests',
    '',
    `res = requests.${method.toLowerCase()}(`,
    ...pyArgs,
    ')',
    'data = res.json()["data"]',
  ].join('\n');

  return { curl, node, python };
}

const METHOD_TONE: Record<EndpointSpec['method'], string> = {
  GET: 'bg-[#e7f5ef] text-[#0f6e56] dark:bg-[#0f6e56]/25 dark:text-[#5dcaa5]',
  POST: 'bg-[#e8effd] text-[#1d4fc4] dark:bg-[#1d4fc4]/25 dark:text-[#85a8f5]',
  PATCH: 'bg-[#fdf1df] text-[#8a560b] dark:bg-[#8a560b]/25 dark:text-[#efb357]',
  DELETE: 'bg-[#fce9e9] text-[#a32d2d] dark:bg-[#a32d2d]/25 dark:text-[#f09595]',
};

export function MethodBadge({ method }: { method: EndpointSpec['method'] }) {
  return (
    <span
      className={cn(
        'inline-block rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold',
        METHOD_TONE[method],
      )}
    >
      {method}
    </span>
  );
}

function ParamTable({ title, params }: { title: string; params: Param[] }) {
  return (
    <div className="mt-6">
      <p className="border-b border-g-line pb-2 text-[13px] font-semibold">{title}</p>
      <dl className="divide-y divide-g-line">
        {params.map((param) => (
          <div key={param.name} className="py-3">
            <dt className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-[13px] font-semibold">{param.name}</span>
              <span className="font-mono text-[11.5px] text-g-mute">{param.type}</span>
              {param.required && (
                <span className="rounded bg-g-ember/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-g-ember-ink">
                  required
                </span>
              )}
            </dt>
            <dd className="mt-1 text-[14px] leading-relaxed text-g-ink/75">{param.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * One endpoint, Paystack style: what it does and what it takes on the left;
 * the request and response on the right, in the reader's language.
 */
export function Endpoint({ base, spec, id }: { base: string; spec: EndpointSpec; id?: string }) {
  const [lang, setLang] = useContext(LangContext);
  const code = samples(base, spec);
  const anchor = id ?? slugify(spec.title);
  return (
    <section
      id={anchor}
      data-toc={spec.title}
      className="mt-12 grid scroll-mt-24 gap-6 border-t border-g-line pt-10 first:mt-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-10"
    >
      <div className="min-w-0">
        <h2 className="text-[22px] font-semibold tracking-[-0.03em]">
          <a href={`#${anchor}`}>{spec.title}</a>
        </h2>
        <p className="mt-3 flex flex-wrap items-center gap-2 break-all font-mono text-[13px]">
          <MethodBadge method={spec.method} />
          {spec.path}
        </p>
        <div className="mt-4 text-[15px] leading-[1.75] text-g-ink/85">{spec.description}</div>
        {spec.auth !== undefined && (
          <ParamTable
            title="Headers"
            params={[
              spec.auth
                ? {
                    name: 'Authorization',
                    type: 'string',
                    required: true,
                    description: (
                      <>
                        <Code>{`Bearer ${spec.auth}`}</Code>
                      </>
                    ),
                  }
                : {
                    name: 'Authorization',
                    type: '—',
                    description: 'Not needed — this endpoint is open.',
                  },
            ]}
          />
        )}
        {spec.pathParams && <ParamTable title="Path parameters" params={spec.pathParams} />}
        {spec.query && <ParamTable title="Query parameters" params={spec.query} />}
        {spec.body && <ParamTable title="Body parameters" params={spec.body} />}
      </div>

      <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]">
          <div className="flex items-center justify-between border-b border-white/10 px-2 py-1.5">
            <div role="tablist" aria-label="Language" className="flex">
              {LANGS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={lang === value}
                  onClick={() => setLang(value)}
                  className={cn(
                    'rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors',
                    lang === value ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <CopyButton text={code[lang]} />
          </div>
          <pre className="max-h-[22rem] overflow-auto p-4 font-mono text-[12px] leading-[1.7] text-[#ecebe7]">
            <code>{code[lang]}</code>
          </pre>
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
              Response · {spec.status ?? 200}
            </span>
            <CopyButton text={JSON.stringify(spec.response, null, 2)} />
          </div>
          <pre className="max-h-[22rem] overflow-auto p-4 font-mono text-[12px] leading-[1.7] text-[#ecebe7]">
            <code>{JSON.stringify(spec.response, null, 2)}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
