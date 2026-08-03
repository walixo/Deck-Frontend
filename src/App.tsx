import { Route, Routes } from 'react-router-dom';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Layout } from '@/components/layout/Layout';
import { Discover } from '@/pages/Discover';
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
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/item/:slug" element={<ItemDetail />} />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireAuth />}>
          <Route path="/submit" element={<Submit />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
