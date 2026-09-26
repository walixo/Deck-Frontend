import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Layout } from '@/components/layout/Layout';
import { lazyNamed } from '@/lib/lazy';
import { profilePath } from '@/lib/utils';
import { Home } from '@/pages/Home';
import { ItemDetail } from '@/pages/ItemDetail';
import { NotFound } from '@/pages/NotFound';

/*
 * Route-level code splitting.
 *
 * Three pages ship in the entry bundle: the landing page and a launch's detail
 * page, because between them they are where nearly every visit starts, and the
 * 404, because it is small and is also what `/:handle` answers with for any
 * unknown one-segment URL. Everything else is fetched the first time somebody
 * goes there — the staff area, checkout, the forum, the handbook and, heaviest
 * of all, the four canvas games, none of which a first-time visitor to `/`
 * should have to download before the page can paint.
 *
 * The Suspense boundary for these lives in `Layout`, around the outlet, so the
 * navbar and footer stay put while a route's code arrives. The staff and
 * account shells carry their own boundary too, so their sidebars do the same.
 *
 * A page added later should be lazy by default. Import one statically only if
 * it is a genuine entry point — and note that a static import *anywhere*
 * (another page, a component) pulls the module back into the entry bundle and
 * makes every lazy import of it a no-op; the build warns with
 * INEFFECTIVE_DYNAMIC_IMPORT when that happens.
 */

/* Browsing and reading. */
const Discover = lazyNamed(() => import('@/pages/Discover'), 'Discover');
const Spotlight = lazyNamed(() => import('@/pages/Spotlight'), 'Spotlight');
const Leaderboard = lazyNamed(() => import('@/pages/Leaderboard'), 'Leaderboard');
const FutureGen = lazyNamed(() => import('@/pages/FutureGen'), 'FutureGen');
const Acquisitions = lazyNamed(() => import('@/pages/Acquisitions'), 'Acquisitions');
const AcquisitionDetail = lazyNamed(() => import('@/pages/AcquisitionDetail'), 'AcquisitionDetail');
const Forum = lazyNamed(() => import('@/pages/Forum'), 'Forum');
const TopicDetail = lazyNamed(() => import('@/pages/TopicDetail'), 'TopicDetail');
const Blog = lazyNamed(() => import('@/pages/Blog'), 'Blog');
const BlogPost = lazyNamed(() => import('@/pages/BlogPost'), 'BlogPost');
const Handbook = lazyNamed(() => import('@/pages/Handbook'), 'Handbook');
const Privacy = lazyNamed(() => import('@/pages/Legal'), 'Privacy');
const Terms = lazyNamed(() => import('@/pages/Legal'), 'Terms');
const Profile = lazyNamed(() => import('@/pages/Profile'), 'Profile');

/* The arcade. The heaviest pages in the app: each game is a canvas engine. */
const Games = lazyNamed(() => import('@/pages/Games'), 'Games');
const GameDetail = lazyNamed(() => import('@/pages/GameDetail'), 'GameDetail');

/* Signing in. */
const Login = lazyNamed(() => import('@/pages/Login'), 'Login');
const Register = lazyNamed(() => import('@/pages/Register'), 'Register');
const AuthCallback = lazyNamed(() => import('@/pages/AuthCallback'), 'AuthCallback');

/* Launching. */
const Submit = lazyNamed(() => import('@/pages/Submit'), 'Submit');
const ReleaseVersion = lazyNamed(() => import('@/pages/ReleaseVersion'), 'ReleaseVersion');
const EditLaunch = lazyNamed(() => import('@/pages/EditLaunch'), 'EditLaunch');
const Customise = lazyNamed(() => import('@/pages/Customise'), 'Customise');

/* The shop, checkout and selling. */
const Shop = lazyNamed(() => import('@/pages/Shop'), 'Shop');
const MerchDetail = lazyNamed(() => import('@/pages/MerchDetail'), 'MerchDetail');
const Cart = lazyNamed(() => import('@/pages/Cart'), 'Cart');
const Checkout = lazyNamed(() => import('@/pages/Checkout'), 'Checkout');
const Orders = lazyNamed(() => import('@/pages/Orders'), 'Orders');
const OrderDetail = lazyNamed(() => import('@/pages/OrderDetail'), 'OrderDetail');
const PaymentCallback = lazyNamed(() => import('@/pages/OrderDetail'), 'PaymentCallback');
const SellerDashboard = lazyNamed(() => import('@/pages/SellerDashboard'), 'SellerDashboard');
const ListingForm = lazyNamed(() => import('@/pages/ListingForm'), 'ListingForm');
const Advertise = lazyNamed(() => import('@/pages/Advertise'), 'Advertise');

/* Your account. */
const AccountShell = lazyNamed(() => import('@/components/account/AccountShell'), 'AccountShell');
const AccountOverview = lazyNamed(
  () => import('@/pages/account/AccountOverview'),
  'AccountOverview',
);
const AccountProfile = lazyNamed(() => import('@/pages/account/AccountProfile'), 'AccountProfile');
const AccountPassword = lazyNamed(
  () => import('@/pages/account/AccountPassword'),
  'AccountPassword',
);
const AccountLaunches = lazyNamed(
  () => import('@/pages/account/AccountLaunches'),
  'AccountLaunches',
);
const AccountWriting = lazyNamed(() => import('@/pages/account/AccountWriting'), 'AccountWriting');
const AccountGames = lazyNamed(() => import('@/pages/account/AccountGames'), 'AccountGames');
const AccountPrints = lazyNamed(() => import('@/pages/account/AccountPrints'), 'AccountPrints');

/* The staff area. */
const AdminShell = lazyNamed(() => import('@/components/admin/AdminShell'), 'AdminShell');
const AdminOverview = lazyNamed(() => import('@/pages/admin/AdminOverview'), 'AdminOverview');
const AdminListings = lazyNamed(() => import('@/pages/admin/AdminListings'), 'AdminListings');
const AdminCategories = lazyNamed(() => import('@/pages/admin/AdminCategories'), 'AdminCategories');
const AdminFundraises = lazyNamed(() => import('@/pages/admin/AdminFundraises'), 'AdminFundraises');
const AdminOrders = lazyNamed(() => import('@/pages/admin/AdminOrders'), 'AdminOrders');
const Disbursements = lazyNamed(() => import('@/pages/Disbursements'), 'Disbursements');
const AdminUsers = lazyNamed(() => import('@/pages/admin/AdminUsers'), 'AdminUsers');
const AdminAcquisitions = lazyNamed(
  () => import('@/pages/admin/AdminAcquisitions'),
  'AdminAcquisitions',
);
const AdminCustom = lazyNamed(() => import('@/pages/admin/AdminCustom'), 'AdminCustom');
const AdminGames = lazyNamed(() => import('@/pages/admin/AdminGames'), 'AdminGames');
const AdminAds = lazyNamed(() => import('@/pages/admin/AdminAds'), 'AdminAds');
const AdminAudit = lazyNamed(() => import('@/pages/admin/AdminAudit'), 'AdminAudit');

/* Tools. */
const Styleguide = lazyNamed(() => import('@/pages/Styleguide'), 'Styleguide');

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

        {/* Public and unauthenticated by design: a privacy policy nobody can
            read without an account is not a privacy policy. */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/shop/:slug" element={<MerchDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Where a provider sign-in returns. Not linked from anywhere — the
            API redirects here with the token in the fragment. */}
        <Route path="/auth/callback" element={<AuthCallback />} />
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
