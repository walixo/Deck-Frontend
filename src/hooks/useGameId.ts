import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
import type { GameIdApp, GameIdAuthorizeInfo, GameIdConnection, GameIdentity } from '@/types';

/** GameID from the browser: your identity, connected apps, and your apps. */

const keys = {
  me: ['gameid', 'me'] as const,
  connections: ['gameid', 'connections'] as const,
  apps: ['gameid', 'apps'] as const,
  app: (clientId: string) => ['gameid', 'apps', clientId] as const,
  authorize: (search: string) => ['gameid', 'authorize', search] as const,
};

export function useMyGameId(enabled = true) {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => request<GameIdentity>('get', '/gameid/me'),
    enabled,
  });
}

export function useUpdateHandle() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (handle: string) => request<GameIdentity>('patch', '/gameid/me', { handle }),
    onSuccess: (identity) => client.setQueryData(keys.me, identity),
  });
}

export function useConnections(enabled = true) {
  return useQuery({
    queryKey: keys.connections,
    queryFn: () => request<GameIdConnection[]>('get', '/gameid/connections'),
    enabled,
  });
}

export function useDisconnect() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      request<{ disconnected: boolean }>('delete', `/gameid/connections/${clientId}`),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.connections }),
  });
}

/** The consent page's read of the request. `search` is the raw query string. */
export function useAuthorizeInfo(search: string, signedIn: boolean) {
  return useQuery({
    queryKey: [...keys.authorize(search), signedIn],
    queryFn: () => request<GameIdAuthorizeInfo>('get', `/gameid/authorize${search}`),
    retry: false,
    staleTime: Infinity,
  });
}

export function useDecideAuthorize() {
  return useMutation({
    mutationFn: (body: Record<string, string>) =>
      request<{ redirectTo: string }>('post', '/gameid/authorize', body),
  });
}

export function useMyApps(enabled = true) {
  return useQuery({
    queryKey: keys.apps,
    queryFn: () => request<GameIdApp[]>('get', '/gameid/apps'),
    enabled,
  });
}

export function useMyApp(clientId: string) {
  return useQuery({
    queryKey: keys.app(clientId),
    queryFn: () => request<GameIdApp>('get', `/gameid/apps/${clientId}`),
    enabled: Boolean(clientId),
  });
}

export interface AppInput {
  name: string;
  description?: string;
  logoUrl?: string;
  homepageUrl?: string;
  privacyUrl?: string;
  type: 'confidential' | 'public';
  redirectUris: string[];
}

export function useCreateApp() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AppInput) => request<GameIdApp>('post', '/gameid/apps', input),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.apps }),
  });
}

export function useUpdateApp(clientId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Omit<AppInput, 'type'>> & { status?: 'active' | 'disabled' }) =>
      request<GameIdApp>('patch', `/gameid/apps/${clientId}`, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: keys.app(clientId) });
      await client.invalidateQueries({ queryKey: keys.apps });
    },
  });
}

export function useRotateSecret(clientId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request<{ clientSecret: string; secretHint: string }>(
        'post',
        `/gameid/apps/${clientId}/secret`,
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.app(clientId) }),
  });
}
