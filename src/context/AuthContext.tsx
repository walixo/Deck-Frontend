import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getStoredToken, request, setStoredToken } from '@/lib/api';
import type { AuthUser } from '@/types';

interface Credentials {
  email: string;
  password: string;
}

interface RegisterPayload extends Credentials {
  name: string;
  username: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(getStoredToken()));
  const queryClient = useQueryClient();

  // Restore the session on first load when a token is already stored.
  useEffect(() => {
    if (!getStoredToken()) return;

    let cancelled = false;
    request<AuthUser>('get', '/auth/me')
      .then((current) => {
        if (!cancelled) setUser(current);
      })
      .catch(() => {
        setStoredToken(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const authenticate = useCallback(
    async (path: '/auth/login' | '/auth/register', payload: unknown) => {
      const result = await request<{ token: string; user: AuthUser }>('post', path, payload);
      setStoredToken(result.token);
      setUser(result.user);
      // Vote state is per-viewer, so anything cached as "anonymous" is now stale.
      await queryClient.invalidateQueries();
      return result.user;
    },
    [queryClient],
  );

  const login = useCallback(
    (credentials: Credentials) => authenticate('/auth/login', credentials),
    [authenticate],
  );

  const register = useCallback(
    (payload: RegisterPayload) => authenticate('/auth/register', payload),
    [authenticate],
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateUser: setUser,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
