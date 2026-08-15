import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ConsentBanner } from '@/components/ads/ConsentBanner';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function Layout() {
  const { pathname } = useLocation();

  // Every route change should start at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:border-2 focus:border-edge focus:bg-acid focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:font-bold focus:uppercase focus:text-ink"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* Shows only when AdSense is configured and nobody has answered yet. */}
      <ConsentBanner />
    </div>
  );
}
