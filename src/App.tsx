import { Route, Routes } from 'react-router-dom';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Layout } from '@/components/layout/Layout';
import { Cart } from '@/pages/Cart';
import { Checkout } from '@/pages/Checkout';
import { Discover } from '@/pages/Discover';
import { MerchDetail } from '@/pages/MerchDetail';
import { OrderDetail, PaymentCallback } from '@/pages/OrderDetail';
import { Orders } from '@/pages/Orders';
import { Shop } from '@/pages/Shop';
import { Spotlight } from '@/pages/Spotlight';
import { Home } from '@/pages/Home';
import { ItemDetail } from '@/pages/ItemDetail';
import { Leaderboard } from '@/pages/Leaderboard';
import { Login } from '@/pages/Login';
import { NotFound } from '@/pages/NotFound';
import { Profile } from '@/pages/Profile';
import { Register } from '@/pages/Register';
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
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:slug" element={<MerchDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireAuth />}>
          <Route path="/submit" element={<Submit />} />
          {/* Checkout and order history need an account. */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/callback" element={<PaymentCallback />} />
          <Route path="/orders/:reference" element={<OrderDetail />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
