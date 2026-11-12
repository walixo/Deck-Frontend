import { Link, useLocation, useParams } from 'react-router-dom';
import { DocsSite } from '@/components/docs/DocsSite';
import type { DocProduct } from '@/components/docs/kit';
import { Wordmark } from '@/components/layout/Wordmark';
import { useAuth } from '@/hooks/useAuth';
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

/* Where each product's own dashboard lives, for the header's main action. */
const DASHBOARD: Partial<Record<DocProduct['id'], { label: string; to: string }>> = {
  developers: { label: 'Your games', to: '/games/developers' },
  circuit: { label: 'Your agents', to: '/gameid#agents' },
  gameid: { label: 'Your apps', to: '/gameid/developers' },
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
    />
  );
}

function HeaderActions({ dashboard }: { dashboard: { label: string; to: string } }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
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
      <Link
        to={dashboard.to}
        className="hidden rounded-lg bg-g-ink px-3 py-2 text-[14px] font-medium text-g-paper sm:inline-flex"
      >
        {dashboard.label}
      </Link>
    </>
  );
}
