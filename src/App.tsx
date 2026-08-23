import { Route, Routes } from 'react-router-dom';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Layout } from '@/components/layout/Layout';
import { Advertise } from '@/pages/Advertise';
import { Cart } from '@/pages/Cart';
import { Checkout } from '@/pages/Checkout';
import { Blog } from '@/pages/Blog';
import { BlogPost } from '@/pages/BlogPost';
import { Discover } from '@/pages/Discover';
import { Forum } from '@/pages/Forum';
import { FutureGen } from '@/pages/FutureGen';
import { TopicDetail } from '@/pages/TopicDetail';
import { EditLaunch } from '@/pages/EditLaunch';
import { MerchDetail } from '@/pages/MerchDetail';
import { OrderDetail, PaymentCallback } from '@/pages/OrderDetail';
import { Orders } from '@/pages/Orders';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminAds } from '@/pages/admin/AdminAds';
import { AdminAudit } from '@/pages/admin/AdminAudit';
import { AdminCategories } from '@/pages/admin/AdminCategories';
import { AdminFundraises } from '@/pages/admin/AdminFundraises';
import { AdminListings } from '@/pages/admin/AdminListings';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminOverview } from '@/pages/admin/AdminOverview';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { Disbursements } from '@/pages/Disbursements';
import { SellerDashboard } from '@/pages/SellerDashboard';
import { ListingForm } from '@/pages/ListingForm';
import { Settings } from '@/pages/Settings';
import { Shop } from '@/pages/Shop';
import { Spotlight } from '@/pages/Spotlight';
import { Home } from '@/pages/Home';
import { ItemDetail } from '@/pages/ItemDetail';
import { Leaderboard } from '@/pages/Leaderboard';
import { Login } from '@/pages/Login';
import { NotFound } from '@/pages/NotFound';
import { Profile } from '@/pages/Profile';
import { Register } from '@/pages/Register';
import { ReleaseVersion } from '@/pages/ReleaseVersion';
import { Styleguide } from '@/pages/Styleguide';
import { Submit } from '@/pages/Submit';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/spotlight" element={<Spotlight />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/item/:slug" element={<ItemDetail />} />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="/future-gen" element={<FutureGen />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/forum/:slug" element={<TopicDetail />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/shop/:slug" element={<MerchDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* A workbench, not a page: deliberately unlinked from the nav. */}
        <Route path="/styleguide" element={<Styleguide />} />

        <Route element={<RequireAuth />}>
          <Route path="/settings" element={<Settings />} />
          <Route path="/submit" element={<Submit />} />
          {/* Shipping a new version is owner-gated, so it sits behind the same
              auth boundary as posting one. */}
          <Route path="/item/:slug/release" element={<ReleaseVersion />} />
          <Route path="/item/:slug/edit" element={<EditLaunch />} />
          {/* Checkout and order history need an account. */}
          <Route path="/checkout" element={<Checkout />} />
          {/* Selling: everything here needs an account, and all but the payout
              page needs a payout account, which each page checks for itself. */}
          <Route path="/sell" element={<SellerDashboard />} />
          <Route path="/advertise" element={<Advertise />} />

          <Route path="/sell/new" element={<ListingForm />} />
          <Route path="/sell/:id" element={<ListingForm />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/callback" element={<PaymentCallback />} />
          <Route path="/orders/:reference" element={<OrderDetail />} />
        </Route>

        {/* Staff area. The shell is the gate, so every route nested under it
            is protected by existing here — nothing to remember per page. */}
        <Route path="/admin" element={<AdminShell />}>
          <Route index element={<AdminOverview />} />
          <Route path="listings" element={<AdminListings />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="fundraises" element={<AdminFundraises />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="disbursements" element={<Disbursements />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="audit" element={<AdminAudit />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
