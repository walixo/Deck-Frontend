import { useEffect } from 'react';
import { useSite } from '@/hooks/useSite';
import { lazyNamed } from '@/lib/lazy';
import { ProductsHome } from '@/pages/ProductsHome';

/* The launch board's landing page, fetched only when it is the one in use. */
const Home = lazyNamed(() => import('@/pages/Home'), 'Home');

/**
 * The home page staff picked under Admin → Site: Deck's products (Match, Deck
 * Games and Vault), or the launch board's own. The launch one shows only while
 * launches are on.
 */
export function Landing() {
  const site = useSite();
  const launchLanding = site.launches && site.landing === 'launches';
  useEffect(() => {
    document.title = launchLanding
      ? 'Deck — launch, share and discover new tech'
      : 'Deck — Match, Deck Games and Vault';
  }, [launchLanding]);
  return launchLanding ? <Home /> : <ProductsHome />;
}
