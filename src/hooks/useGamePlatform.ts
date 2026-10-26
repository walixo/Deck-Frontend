import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import type {
  GameDeveloperView,
  GameMode,
  GameMultiplayer,
  GameOrientation,
  GameProduct,
  GamePurchase,
  GameSale,
  GameSession,
  WebhookDelivery,
} from '@/types';

/**
 * The Deck Games platform, from the browser: what the player host asks for
 * on a game's behalf, and what the developer dashboard manages.
 */

const keys = {
  products: (slug: string) => ['games', slug, 'products'] as const,
  developer: (slug: string) => ['games', slug, 'developer'] as const,
  sales: (slug: string, mode: GameMode) => ['games', slug, 'sales', mode] as const,
};

/* ------------------------------------------------- player host calls --- */
/* Plain functions rather than hooks: the bridge calls them from a message
   handler, outside React's render cycle. */

export const gameApi = {
  /* `seat` is a sandbox seat: test mode, the game's developer only. */
  session: (slug: string, mode?: GameMode, seat?: number) =>
    request<GameSession>('post', `/games/${slug}/session`, {
      ...(mode ? { mode } : {}),
      ...(seat ? { seat } : {}),
    }),
  products: (slug: string) => request<GameProduct[]>('get', `/games/${slug}/products`),
  purchase: (slug: string, productId: string, mode?: GameMode) =>
    request<GamePurchase & { checkoutUrl: string | null }>('post', `/games/${slug}/purchases`, {
      productId,
      ...(mode ? { mode } : {}),
    }),
  purchaseStatus: (reference: string) =>
    request<GamePurchase & { game: string | null; gameTitle: string }>(
      'get',
      `/games/purchases/${reference}`,
    ),
  entitlements: (slug: string, mode?: GameMode) =>
    request<GamePurchase[]>('get', `/games/${slug}/entitlements${mode ? `?mode=${mode}` : ''}`),
};

export function useGameProducts(slug: string, enabled = true) {
  return useQuery({
    queryKey: keys.products(slug),
    queryFn: () => gameApi.products(slug),
    enabled: Boolean(slug) && enabled,
    staleTime: 60 * 1000,
  });
}

/* ------------------------------------------------------- developer --- */

export function useDeveloperView(slug: string, enabled = true) {
  return useQuery({
    queryKey: keys.developer(slug),
    queryFn: () => request<GameDeveloperView>('get', `/games/${slug}/developer`),
    enabled: Boolean(slug) && enabled,
  });
}

export interface DeveloperSettings {
  orientation?: GameOrientation;
  sdk?: boolean;
  studio?: string;
  testUrl?: string | null;
  webhookUrl?: string | null;
  multiplayer?: GameMultiplayer;
}

export function useUpdateDeveloperSettings(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (settings: DeveloperSettings) =>
      request<{ updated: string[] }>('patch', `/games/${slug}/developer`, settings),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.developer(slug) }),
  });
}

/** Returns the key once. The dashboard must show it then or never. */
export function useMintKey(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (mode: GameMode) =>
      request<{ mode: GameMode; key: string; hint: string }>('post', `/games/${slug}/keys`, {
        mode,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.developer(slug) }),
  });
}

export function useMintWebhookSecret(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => request<{ secret: string }>('post', `/games/${slug}/webhook-secret`),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.developer(slug) }),
  });
}

export function useTestWebhook(slug: string) {
  return useMutation({
    mutationFn: () => request<WebhookDelivery>('post', `/games/${slug}/webhook/test`),
  });
}

export interface ProductInput {
  productId: string;
  name: string;
  description?: string;
  price: number;
  type: 'one_off' | 'consumable';
}

export function useCreateProduct(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) =>
      request<GameProduct>('post', `/games/${slug}/products`, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: keys.developer(slug) });
      await client.invalidateQueries({ queryKey: keys.products(slug) });
    },
  });
}

export function useUpdateProduct(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      newProductId,
      ...input
    }: Partial<Omit<ProductInput, 'productId'>> & {
      productId: string;
      /** Renames it. Refused once the product has a live sale. */
      newProductId?: string;
      active?: boolean;
    }) =>
      request<GameProduct>('patch', `/games/${slug}/products/${productId}`, {
        ...input,
        ...(newProductId ? { productId: newProductId } : {}),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: keys.developer(slug) });
      await client.invalidateQueries({ queryKey: keys.products(slug) });
    },
  });
}

export function useGameSales(slug: string, mode: GameMode) {
  return useQuery({
    queryKey: keys.sales(slug, mode),
    queryFn: () =>
      requestWithMeta<GameSale[], { total: number; pages: number }>(
        `/games/${slug}/sales?mode=${mode}`,
      ),
    enabled: Boolean(slug),
  });
}

export function useResendWebhook(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) =>
      request<GameSale>('post', `/games/${slug}/sales/${reference}/resend`),
    onSuccess: async (sale) => {
      await client.invalidateQueries({ queryKey: keys.sales(slug, sale.mode) });
    },
  });
}
