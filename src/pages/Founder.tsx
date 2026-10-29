import { Link, useParams } from 'react-router-dom';
import { ItemCard } from '@/components/items/ItemCard';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { useFounder } from '@/hooks/useImports';
import { countryName } from '@/lib/africa';
import { prettyUrl } from '@/lib/utils';

/**
 * A founder Deck lists, and the products it lists for them.
 *
 * Not a profile. A profile is somebody who joined; this is a page Deck wrote
 * about a person from public sources, and it says so in the first line rather
 * than in small print — the label, the "not an account" note and the sources
 * are the whole difference between listing someone and impersonating them.
 *
 * Public and unauthenticated, so the person it is about can read exactly what
 * Deck says without signing up to find out.
 */
export function Founder() {
  const { slug = '' } = useParams();
  const { data, isLoading, isError, error, refetch } = useFounder(slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-5 h-12 w-2/3" />
        <Skeleton className="mt-4 h-4 w-1/2" />
        <Skeleton className="mt-10 h-40 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState message={error?.message} onRetry={() => void refetch()} />
      </div>
    );
  }

  const { founder, items } = data;
  const country = founder.country ? countryName(founder.country) : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="border-b border-line pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="outline">Founder</Badge>
          {!founder.claimed && <Badge tone="outline">Listed by Deck · not claimed</Badge>}
        </div>

        <h1 className="display-tight mt-5 text-[clamp(2.25rem,6vw,3.5rem)] text-balance">
          {founder.name}
        </h1>

        {(founder.headline || country) && (
          <p className="mt-3 text-base text-muted">
            {[founder.headline, country].filter(Boolean).join(' · ')}
          </p>
        )}

        {founder.links.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
            {founder.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-mono text-[12px] font-medium uppercase tracking-[0.06em] underline underline-offset-2 hover:text-accent"
                >
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
        )}

        {!founder.claimed && (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
            This is not an account. Deck lists {founder.name} as the founder of the products below,
            using public sources. If this is you, claim one of them from its page and this profile
            becomes yours.
          </p>
        )}
      </header>

      <section aria-labelledby="products-heading" className="mt-10">
        <h2 id="products-heading" className="text-xl">
          {items.length === 1 ? 'Product' : 'Products'}
        </h2>
        {items.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Nothing listed right now.{' '}
            <Link to="/discover" className="underline underline-offset-2">
              Browse Discover
            </Link>
          </p>
        )}
      </section>

      {founder.sourceUrls.length > 0 && (
        <section aria-labelledby="sources-heading" className="mt-12 border-t border-line pt-6">
          <h2
            id="sources-heading"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted"
          >
            Where this comes from
          </h2>
          <ul className="mt-2 space-y-1">
            {founder.sourceUrls.map((url) => (
              <li key={url} className="truncate text-sm">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="underline underline-offset-2 hover:text-accent"
                >
                  {prettyUrl(url)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
