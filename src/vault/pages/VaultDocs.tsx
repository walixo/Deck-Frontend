import { Link, useParams } from 'react-router-dom';
import { DocsSite } from '@/components/docs/DocsSite';
import { VaultMark } from '../VaultMark';
import { vault } from '../docs/content';

/**
 * `vault.onedeck.africa/docs` — Vault's documentation.
 *
 * The same frame Deck's own docs are read in, with one product instead of
 * three, so there is no product switcher and search says Vault rather than
 * naming three things that are not here. Everything that makes it a
 * documentation site rather than a page lives in `DocsSite`; everything that
 * makes it Vault's lives in `../docs/content`.
 */
export function VaultDocs() {
  const { page } = useParams();
  return (
    <DocsSite
      products={[vault]}
      pageSlug={page ?? 'overview'}
      hrefFor={(_product, slug) => `/docs/${slug}`}
      home="/docs"
      brand={
        <>
          <VaultMark className="size-[18px]" />
          <span className="text-[18px] font-semibold tracking-[-0.04em]">Vault</span>
          <span className="text-[18px] font-normal tracking-[-0.04em] text-g-mute">docs</span>
        </>
      }
      actions={
        <Link
          to="/distribute"
          className="hidden rounded-lg bg-g-ink px-3 py-2 text-[14px] font-medium text-g-paper sm:inline-flex"
        >
          Your keys
        </Link>
      }
      searchPlaceholder="Search the Vault docs"
      titleSuffix="Vault docs · Deck"
      /* Same origin: Vault's own front page is one router hop away. */
      parent={() => ({ label: 'Vault', href: '/' })}
    />
  );
}
