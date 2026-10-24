import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LangProvider, type DocPage, type DocProduct } from '@/components/docs/kit';
import { Wordmark } from '@/components/layout/Wordmark';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { circuit } from './content/circuit';
import { developers } from './content/developers';
import { gameid } from './content/gameid';

/**
 * `/docs` — Deck's documentation, one site for three products.
 *
 * Laid out the way the best developer docs are: the product's pages grouped
 * down the left, one topic per page in the middle, and "On this page" on the
 * right. The product switcher is the top bar, search is a keystroke away
 * (⌘K, or /), and API pages open into Paystack-style rows — the endpoint on
 * the left, the request and response beside it.
 */

const PRODUCTS: DocProduct[] = [developers, circuit, gameid];

/* Where each product's own dashboard lives, for the header's main action. */
const DASHBOARD: Record<DocProduct['id'], { label: string; to: string }> = {
  developers: { label: 'Your games', to: '/games/developers' },
  circuit: { label: 'Your agents', to: '/gameid#agents' },
  gameid: { label: 'Your apps', to: '/gameid/developers' },
};

const flatten = (product: DocProduct) =>
  product.groups.flatMap((group) => group.pages.map((page) => ({ group: group.title, page })));

export function Docs() {
  const { product: productId, page: pageSlug } = useParams();
  const product = PRODUCTS.find((p) => p.id === productId);
  const pages = useMemo(() => (product ? flatten(product) : []), [product]);
  const current = pages.find((entry) => entry.page.slug === pageSlug);
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();
  /* Open for the page it was opened on — navigating anywhere closes it
     without an effect having to notice. */
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const menuOpen = menuFor === pathname;

  /* ⌘K or Ctrl+K anywhere, and / when not typing, open search. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement)?.closest('input, textarea, [contenteditable]');
      if (
        (event.key === 'k' && (event.metaKey || event.ctrlKey)) ||
        (event.key === '/' && !typing)
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* A new page starts at the top, unless it was asked for a section. */
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
    else
      window.setTimeout(
        () => document.getElementById(window.location.hash.slice(1))?.scrollIntoView(),
        50,
      );
  }, [pathname]);

  if (!product) return <Navigate to="/docs/developers" replace />;
  if (!current) return <Navigate to={`/docs/${product.id}/${pages[0].page.slug}`} replace />;

  const index = pages.indexOf(current);
  const prev = pages[index - 1];
  const next = pages[index + 1];
  const wide = current.page.slug === 'api';

  return (
    <LangProvider>
      <div className="deck-games min-h-dvh bg-g-paper font-sans text-g-ink antialiased selection:bg-g-ember selection:text-g-on-ember">
        <title>{`${current.page.title} — ${product.name} docs · Deck`}</title>
        <DocsHeader
          product={product}
          onSearch={() => setSearchOpen(true)}
          onMenu={() => setMenuFor(menuOpen ? null : pathname)}
          menuOpen={menuOpen}
        />

        <div
          className={cn(
            'mx-auto grid max-w-[1500px] lg:grid-cols-[17rem_minmax(0,1fr)]',
            !wide && 'xl:grid-cols-[17rem_minmax(0,1fr)_15rem]',
          )}
        >
          <aside
            className={cn(
              'border-g-line bg-g-paper lg:sticky lg:top-16 lg:block lg:h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:border-r',
              menuOpen ? 'fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto' : 'hidden',
            )}
          >
            <Sidebar
              product={product}
              current={current.page}
              onSearch={() => setSearchOpen(true)}
            />
          </aside>

          <main id="docs-main" className="min-w-0 px-5 pb-24 pt-10 sm:px-10 lg:pt-12">
            <article className={cn('mx-auto', wide ? 'max-w-[76rem]' : 'max-w-3xl')}>
              <p className="text-[14px] font-medium text-g-mute">{current.group}</p>
              <div className="mt-2 flex items-start justify-between gap-4">
                <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.04em]">
                  {current.page.title}
                </h1>
                <CopyPage />
              </div>
              <p className="mt-3 text-[18px] leading-relaxed text-g-mute text-pretty">
                {current.page.lead}
              </p>
              <div id="docs-body" className="mt-10">
                {current.page.body()}
              </div>

              <nav
                aria-label="More pages"
                className="mt-20 grid gap-3 border-t border-g-line pt-8 sm:grid-cols-2"
              >
                {prev ? (
                  <PagerLink product={product} entry={prev} direction="Previous" />
                ) : (
                  <span />
                )}
                {next && <PagerLink product={product} entry={next} direction="Next" />}
              </nav>
            </article>
          </main>

          {!wide && <OnThisPage key={pathname} />}
        </div>

        {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
      </div>
    </LangProvider>
  );
}

/* --------------------------------------------------------------- header --- */

function DocsHeader({
  product,
  onSearch,
  onMenu,
  menuOpen,
}: {
  product: DocProduct;
  onSearch: () => void;
  onMenu: () => void;
  menuOpen: boolean;
}) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const dashboard = DASHBOARD[product.id];
  return (
    <header className="sticky top-0 z-50 border-b border-g-line bg-g-paper">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-6 px-5 sm:px-8">
        <Link
          to="/docs"
          className="flex shrink-0 items-center gap-2 leading-none"
          aria-label="Deck docs"
        >
          <Wordmark className="h-[18px] w-auto" />
          <span className="text-[18px] font-normal tracking-[-0.04em] text-g-mute">docs</span>
        </Link>

        <nav aria-label="Products" className="hidden items-center gap-1 md:flex">
          {PRODUCTS.map((p) => (
            <NavLink
              key={p.id}
              to={`/docs/${p.id}`}
              className={cn(
                'rounded-lg px-3 py-2 text-[14px] font-medium transition-colors',
                p.id === product.id ? 'bg-g-paper-2 text-g-ink' : 'text-g-mute hover:text-g-ink',
              )}
            >
              {p.name}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onSearch}
            className="grid size-9 place-items-center rounded-lg border border-g-line text-g-mute lg:hidden"
            aria-label="Search the docs"
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="hidden size-9 place-items-center rounded-lg border border-g-line text-[15px] text-g-mute hover:text-g-ink sm:grid"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          {!user && (
            <Link
              to="/login"
              state={{ from: pathname }}
              className="hidden rounded-lg border border-g-line px-3 py-2 text-[14px] font-medium sm:inline-flex"
            >
              Sign in
            </Link>
          )}
          <Link
            to={dashboard.to}
            className="hidden rounded-lg bg-g-ink px-3 py-2 text-[14px] font-medium text-g-paper sm:inline-flex"
          >
            {dashboard.label}
          </Link>
          <button
            type="button"
            onClick={onMenu}
            aria-expanded={menuOpen}
            className="grid size-9 place-items-center rounded-lg border border-g-line lg:hidden"
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="6" />
      <path d="m14 14 4 4" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------- sidebar --- */

function Sidebar({
  product,
  current,
  onSearch,
}: {
  product: DocProduct;
  current: DocPage;
  onSearch: () => void;
}) {
  return (
    <div className="px-4 pb-10 pt-6">
      <button
        type="button"
        onClick={onSearch}
        className="flex w-full items-center gap-2.5 rounded-xl border border-g-line px-3 py-2.5 text-left text-[14px] text-g-mute transition-colors hover:border-g-ink/30"
      >
        <SearchIcon />
        <span className="flex-1">Search…</span>
        <kbd className="font-mono text-[11px]">⌘K</kbd>
      </button>

      {/* Products, for phones — the top bar's tabs are hidden there. */}
      <div className="mt-5 flex gap-1 md:hidden">
        {PRODUCTS.map((p) => (
          <Link
            key={p.id}
            to={`/docs/${p.id}`}
            className={cn(
              'rounded-lg px-3 py-1.5 text-[13px] font-medium',
              p.id === product.id ? 'bg-g-paper-2' : 'text-g-mute',
            )}
          >
            {p.name}
          </Link>
        ))}
      </div>

      {product.groups.map((group) => (
        <div key={group.title} className="mt-8">
          <p className="px-3 text-[14px] font-semibold">{group.title}</p>
          <ul className="mt-2 space-y-0.5">
            {group.pages.map((page) => (
              <li key={page.slug}>
                <Link
                  to={`/docs/${product.id}/${page.slug}`}
                  aria-current={page.slug === current.slug ? 'page' : undefined}
                  className={cn(
                    'block rounded-lg px-3 py-2 text-[15px] transition-colors',
                    page.slug === current.slug
                      ? 'bg-g-paper-2 font-medium text-g-ink'
                      : 'text-g-ink/70 hover:bg-g-paper-2/60 hover:text-g-ink',
                  )}
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------- page chrome --- */

function CopyPage() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        const text = document.getElementById('docs-main')?.innerText ?? '';
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="mt-2 hidden shrink-0 rounded-xl border border-g-line px-3 py-2 text-[13px] font-medium text-g-mute transition-colors hover:text-g-ink sm:inline-flex"
    >
      {copied ? 'Copied' : 'Copy page'}
    </button>
  );
}

function PagerLink({
  product,
  entry,
  direction,
}: {
  product: DocProduct;
  entry: { group: string; page: DocPage };
  direction: 'Previous' | 'Next';
}) {
  return (
    <Link
      to={`/docs/${product.id}/${entry.page.slug}`}
      className={cn(
        'rounded-2xl border border-g-line p-4 transition-colors hover:border-g-ink',
        direction === 'Next' && 'text-right sm:col-start-2',
      )}
    >
      <p className="text-[12px] text-g-mute">{direction}</p>
      <p className="mt-1 text-[15px] font-semibold">
        {direction === 'Previous' ? '← ' : ''}
        {entry.page.title}
        {direction === 'Next' ? ' →' : ''}
      </p>
    </Link>
  );
}

/** "On this page": the article's sections, the one being read marked. */
function OnThisPage() {
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>('#docs-body [data-toc]')];
    /* Read once the article has painted. */
    const frame = requestAnimationFrame(() =>
      setItems(nodes.map((node) => ({ id: node.id, label: node.dataset.toc ?? '' }))),
    );
    if (!nodes.length) return () => cancelAnimationFrame(frame);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -65% 0px' },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  if (!items.length) return <div className="hidden xl:block" />;
  return (
    <nav aria-label="On this page" className="hidden xl:block">
      <div className="sticky top-16 px-6 pt-12">
        <p className="flex items-center gap-2 text-[14px] font-medium">
          <span aria-hidden="true">≡</span> On this page
        </p>
        <ul className="mt-3 border-l border-g-line">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  '-ml-px block border-l py-1.5 pl-4 text-[14px] transition-colors',
                  active === item.id
                    ? 'border-g-ink font-medium text-g-ink'
                    : 'border-transparent text-g-mute hover:text-g-ink',
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/* --------------------------------------------------------------- search --- */

const INDEX = PRODUCTS.flatMap((product) =>
  flatten(product).map(({ group, page }) => ({
    product,
    group,
    page,
    haystack: `${product.name} ${group} ${page.title} ${page.lead}`.toLowerCase(),
  })),
);

function SearchPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return INDEX.filter((entry) => words.every((w) => entry.haystack.includes(w))).slice(0, 12);
  }, [query]);

  useEffect(() => input.current?.focus(), []);

  const go = (entry: (typeof INDEX)[number]) => {
    onClose();
    navigate(`/docs/${entry.product.id}/${entry.page.slug}`);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Search the docs"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-g-line bg-g-paper shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-g-line px-4">
          <SearchIcon />
          <input
            ref={input}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose();
              if (event.key === 'ArrowDown') setCursor((c) => Math.min(c + 1, results.length - 1));
              if (event.key === 'ArrowUp') setCursor((c) => Math.max(c - 1, 0));
              if (event.key === 'Enter' && results[cursor]) go(results[cursor]);
            }}
            placeholder="Search Developers, Circuit and GameID"
            className="h-14 flex-1 bg-transparent text-[16px] outline-none placeholder:text-g-mute"
          />
          <kbd className="font-mono text-[11px] text-g-mute">esc</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {results.map((entry, i) => (
            <li key={`${entry.product.id}/${entry.page.slug}`}>
              <button
                type="button"
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(entry)}
                className={cn(
                  'w-full rounded-xl px-3 py-2.5 text-left',
                  i === cursor ? 'bg-g-paper-2' : '',
                )}
              >
                <p className="text-[12px] text-g-mute">
                  {entry.product.name} · {entry.group}
                </p>
                <p className="mt-0.5 text-[15px] font-medium">{entry.page.title}</p>
                <p className="mt-0.5 truncate text-[13px] text-g-mute">{entry.page.lead}</p>
              </button>
            </li>
          ))}
          {!results.length && (
            <li className="px-3 py-8 text-center text-[14px] text-g-mute">No pages match that.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
