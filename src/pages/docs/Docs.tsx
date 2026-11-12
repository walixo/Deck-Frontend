import { Link, useLocation, useParams } from 'react-router-dom';
import { DocsSite } from '@/components/docs/DocsSite';
import type { DocProduct } from '@/components/docs/kit';
import { Wordmark } from '@/components/layout/Wordmark';
import { useAuth } from '@/hooks/useAuth';
import { gamesHref, isExternal } from '@/lib/siblings';
import { circuit } from './content/circuit';
import { developers } from './content/developers';
import { gameid } from './content/gameid';

/**
 * `/docs` — Deck's documentation, one site for three products.
 *
 * Everything about how it reads lives in `DocsSite`, which Vault's docs use
 * too. What is here is only what is Deck's: which products there are, where
 * their pages live, and what the header's main action should be.
 */

const PRODUCTS: DocProduct[] = [developers, circuit, gameid];

/*
 * The product each set of pages documents, for the way back out of the docs.
 *
 * All three live on the Games subdomain now, so these are URLs from Deck and
 * plain paths from the subdomain — `gamesHref` decides which, so a reader who
 * came from Deck Games is handed back to it without a page load.
 */
const PARENT: Record<DocProduct['id'], { label: string; href: string }> = {
  developers: { label: 'Deck Games developers', href: gamesHref('/games/developers') },
  circuit: { label: 'Deck Circuit', href: gamesHref('/games/agents') },
  gameid: { label: 'GameID', href: gamesHref('/gameid') },
  vault: { label: 'Vault', href: '/' },
};

/* Where each product's own dashboard lives, for the header's main action. On
   the Games subdomain too, for the same reason `PARENT` is. */
const DASHBOARD: Partial<Record<DocProduct['id'], { label: string; href: string }>> = {
  developers: { label: 'Your games', href: gamesHref('/games/developers') },
  circuit: { label: 'Your agents', href: gamesHref('/gameid#agents') },
  gameid: { label: 'Your apps', href: gamesHref('/gameid/developers') },
};

export function Docs() {
  const { product: productId, page: pageSlug } = useParams();
  const product = PRODUCTS.find((p) => p.id === productId) ?? PRODUCTS[0];

  return (
    <DocsSite
      products={PRODUCTS}
      productId={productId}
      pageSlug={pageSlug}
      hrefFor={(id, slug) => `/docs/${id}/${slug}`}
      home="/docs"
      brand={
        <>
          <Wordmark className="h-[18px] w-auto" />
          <span className="text-[18px] font-normal tracking-[-0.04em] text-g-mute">docs</span>
        </>
      }
      actions={<HeaderActions dashboard={DASHBOARD[product.id] ?? DASHBOARD.developers!} />}
      searchPlaceholder="Search Developers, Circuit and GameID"
      titleSuffix={`${product.name} docs · Deck`}
      parent={(current) => PARENT[current.id]}
    />
  );
}

function HeaderActions({ dashboard }: { dashboard: { label: string; href: string } }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const dashboardClass =
    'hidden rounded-lg bg-g-ink px-3 py-2 text-[14px] font-medium text-g-paper sm:inline-flex';
  return (
    <>
      {!user && (
        <Link
          to="/login"
          state={{ from: pathname }}
          className="hidden rounded-lg border border-g-line px-3 py-2 text-[14px] font-medium sm:inline-flex"
        >
          Sign in
        </Link>
      )}
      {isExternal(dashboard.href) ? (
        <a href={dashboard.href} className={dashboardClass}>
          {dashboard.label}
        </a>
      ) : (
        <Link to={dashboard.href} className={dashboardClass}>
          {dashboard.label}
        </Link>
      )}
    </>
  );
}
