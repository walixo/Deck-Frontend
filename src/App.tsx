import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Layout } from '@/components/layout/Layout';
import { Advertise } from '@/pages/Advertise';
import { Cart } from '@/pages/Cart';
import { Checkout } from '@/pages/Checkout';
import { Blog } from '@/pages/Blog';
import { BlogPost } from '@/pages/BlogPost';
import { Discover } from '@/pages/Discover';
import { AcquisitionDetail } from '@/pages/AcquisitionDetail';
import { Acquisitions } from '@/pages/Acquisitions';
import { Customise } from '@/pages/Customise';
import { Forum } from '@/pages/Forum';
import { FutureGen } from '@/pages/FutureGen';
import { TopicDetail } from '@/pages/TopicDetail';
import { EditLaunch } from '@/pages/EditLaunch';
import { MerchDetail } from '@/pages/MerchDetail';
import { OrderDetail, PaymentCallback } from '@/pages/OrderDetail';
import { Orders } from '@/pages/Orders';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminAcquisitions } from '@/pages/admin/AdminAcquisitions';
import { AdminCustom } from '@/pages/admin/AdminCustom';
import { AdminGames } from '@/pages/admin/AdminGames';
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
import { AccountShell } from '@/components/account/AccountShell';
import { AccountGames } from '@/pages/account/AccountGames';
import { AccountLaunches } from '@/pages/account/AccountLaunches';
import { AccountOverview } from '@/pages/account/AccountOverview';
import { AccountPassword } from '@/pages/account/AccountPassword';
import { AccountPrints } from '@/pages/account/AccountPrints';
import { AccountProfile } from '@/pages/account/AccountProfile';
import { AccountWriting } from '@/pages/account/AccountWriting';
import { Shop } from '@/pages/Shop';
import { Spotlight } from '@/pages/Spotlight';
import { GameDetail } from '@/pages/GameDetail';
import { Games } from '@/pages/Games';
import { Handbook } from '@/pages/Handbook';
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
import { profilePath } from '@/lib/utils';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/spotlight" element={<Spotlight />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/item/:slug" element={<ItemDetail />} />
        <Route path="/future-gen" element={<FutureGen />} />
        <Route path="/acquisitions" element={<Acquisitions />} />
        <Route path="/acquisitions/:slug" element={<AcquisitionDetail />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/forum/:slug" element={<TopicDetail />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/:slug" element={<GameDetail />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/handbook" element={<Handbook />} />
        <Route path="/shop/:slug" element={<MerchDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* A workbench, not a page: deliberately unlinked from the nav. */}
        <Route path="/styleguide" element={<Styleguide />} />

        <Route element={<RequireAuth />}>
          <Route path="/customise" element={<Customise />} />
          {/* Your account, shaped like the staff area. The shell is the gate,
              so every section nested under it is protected by existing here. */}
          <Route path="/settings" element={<AccountShell />}>
            <Route index element={<AccountOverview />} />
            <Route path="profile" element={<AccountProfile />} />
            <Route path="password" element={<AccountPassword />} />
            <Route path="launches" element={<AccountLaunches />} />
            <Route path="writing" element={<AccountWriting />} />
            <Route path="games" element={<AccountGames />} />
            <Route path="prints" element={<AccountPrints />} />
            {/* Orders already had a page; this points the sidebar at it rather
                than growing a second list of the same rows. */}
            <Route path="orders" element={<Orders />} />
          </Route>
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
          <Route path="acquisitions" element={<AdminAcquisitions />} />
          <Route path="custom" element={<AdminCustom />} />
          <Route path="games" element={<AdminGames />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="audit" element={<AdminAudit />} />
        </Route>

        {/*
          * People live at `/@name`.
          *
          * Not `/@:username`: React Router's matcher only recognises a
          * parameter that directly follows a slash — `\/:([\w-]+)` — so an `@`
          * glued to the front of one is compiled as a literal and the route
          * matches nothing but the string `/@:username`. The segment therefore
          * has to be claimed whole, and the sigil checked in JavaScript.
          *
          * Claiming a whole top-level segment is safe because route ranking
          * scores a static segment above a dynamic one: `/discover` still wins
          * over `/:handle`, and always will, whatever gets added later. What it
          * does mean is that this route now sees every unmatched one-segment
          * URL, which is why it answers with the same 404 as the catch-all
          * whenever the handle is not a handle.
          */}
        <Route path="/:handle" element={<ProfileRoute />} />

        {/* The shape profile links had until now. Kept as a redirect rather
            than deleted: these URLs are in comment threads and inboxes, and a
            dead link is a worse answer than an extra hop. */}
        <Route path="/u/:username" element={<LegacyProfile />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

/** Guards the sigil, so `/anything-else` is still a 404 and not a lookup. */
function ProfileRoute() {
  const { handle = '' } = useParams();
  return handle.startsWith('@') ? <Profile /> : <NotFound />;
}

/** `/u/lin` -> `/@lin`, replacing the entry so Back does not bounce. */
function LegacyProfile() {
  const { username = '' } = useParams();
  return <Navigate to={profilePath(username)} replace />;
}
