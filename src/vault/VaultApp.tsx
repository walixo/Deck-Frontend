import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { lazyNamed } from '@/lib/lazy';
import { VaultLayout } from './VaultLayout';
import { VaultLanding } from './pages/VaultLanding';

/*
 * Vault's routes.
 *
 * The landing page ships in this bundle because it is where nearly every visit
 * starts. Everything else is fetched on arrival — the two dashboards in
 * particular are forms nobody browsing the shop should have to download.
 */
const VaultShop = lazyNamed(() => import('./pages/VaultShop'), 'VaultShop');
const VaultStorefront = lazyNamed(() => import('./pages/VaultShop'), 'VaultStorefront');
const VaultCards = lazyNamed(() => import('./pages/VaultCards'), 'VaultCards');
const VaultDocs = lazyNamed(() => import('./pages/VaultDocs'), 'VaultDocs');
const IssuerDashboard = lazyNamed(() => import('./pages/IssuerDashboard'), 'IssuerDashboard');
const PartnerDashboard = lazyNamed(() => import('./pages/PartnerDashboard'), 'PartnerDashboard');

export function VaultApp() {
  return (
    <Routes>
      {/* The docs carry their own header, sidebar and footer — the same frame
          Deck's own docs are read in — so they sit outside the Vault shell
          rather than inside it under a second header. */}
      <Route
        path="/docs"
        element={
          <Suspense fallback={null}>
            <VaultDocs />
          </Suspense>
        }
      />
      <Route
        path="/docs/:page"
        element={
          <Suspense fallback={null}>
            <VaultDocs />
          </Suspense>
        }
      />

      <Route element={<VaultLayout />}>
        <Route path="/" element={<VaultLanding />} />
        <Route path="/shop" element={<VaultShop />} />
        <Route path="/shop/:slug" element={<VaultStorefront />} />
        <Route path="/cards" element={<VaultCards />} />
        <Route path="/issue" element={<IssuerDashboard />} />
        <Route path="/distribute" element={<PartnerDashboard />} />
        {/* Vault has no 404 of its own: anything unknown is the overview. */}
        <Route path="*" element={<VaultLanding />} />
      </Route>
    </Routes>
  );
}
