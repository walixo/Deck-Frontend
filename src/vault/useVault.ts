import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';

/**
 * Vault's data layer.
 *
 * Everything moves in minor units, exactly as the API sends it. Converting on
 * the way in and again on the way out is how a rounding error gets introduced
 * into a number that is somebody's money; the only place a major-unit figure
 * exists is inside a form field, and it is converted once at the boundary.
 */

export type VaultMode = 'test' | 'live';

export interface VaultProduct {
  id?: string;
  slug: string;
  name: string;
  artworkUrl: string;
  redeemInstructions?: string;
  denominationType: 'fixed' | 'range';
  denominationsMinor: number[];
  minMinor: number;
  maxMinor: number;
  discountPercent?: number | null;
  effectiveDiscountPercent?: number;
  distributorDiscountPercent?: number;
  expiryDays?: number | null;
  effectiveExpiryDays?: number;
  status?: 'active' | 'paused';
  currency?: string;
}

export interface VaultIssuer {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string;
  terms: string;
  supportEmail: string;
  website: string;
  currency: string;
  status: 'draft' | 'pending' | 'live' | 'paused' | 'rejected';
  reviewNote: string;
  fulfilment: 'deck' | 'merchant';
  fulfilUrl: string | null;
  discountPercent: number;
  defaultExpiryDays: number;
  keys: { test: KeyInfo | null; live: KeyInfo | null };
}

export interface KeyInfo {
  hint: string;
  createdAt: string;
}

export interface VaultPartner {
  id: string;
  slug: string;
  name: string;
  website: string;
  logoUrl: string;
  status: 'pending' | 'live' | 'suspended';
  webhookUrl: string | null;
  keys: { test: KeyInfo | null; live: KeyInfo | null };
  balances: { test: number; live: number };
  currency: string;
}

export interface ShopIssuer {
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string;
  currency: string;
  products: VaultProduct[];
}

export interface IssuerSummary {
  soldMinor: number;
  owedMinor: number;
  outstandingMinor: number;
  cardsIssued: number;
  ordersCount: number;
  currency: string;
}

export interface VaultStats {
  issuers: number;
  products: number;
  orders: number;
  currency: string;
}

const keys = {
  stats: ['vault', 'stats'] as const,
  shop: ['vault', 'shop'] as const,
  storefront: (slug: string) => ['vault', 'shop', slug] as const,
  issuer: ['vault', 'issuer'] as const,
  products: ['vault', 'issuer', 'products'] as const,
  summary: ['vault', 'issuer', 'summary'] as const,
  issuerOrders: (mode: VaultMode) => ['vault', 'issuer', 'orders', mode] as const,
  redemptions: ['vault', 'issuer', 'redemptions'] as const,
  partner: ['vault', 'partner'] as const,
  ledger: (mode: VaultMode) => ['vault', 'partner', 'ledger', mode] as const,
  cards: ['vault', 'cards'] as const,
};

/* -------------------------------------------------------------------- public */

export const useVaultStats = () =>
  useQuery({ queryKey: keys.stats, queryFn: () => request<VaultStats>('get', '/vault/stats') });

export const useShop = () =>
  useQuery({ queryKey: keys.shop, queryFn: () => request<ShopIssuer[]>('get', '/vault/shop') });

export const useStorefront = (slug: string) =>
  useQuery({
    queryKey: keys.storefront(slug),
    queryFn: () => request<ShopIssuer & { description: string; terms: string; supportEmail: string; website: string }>(
      'get',
      `/vault/shop/${slug}`,
    ),
    enabled: Boolean(slug),
  });

export function useBuyCard(slug: string) {
  return useMutation({
    mutationFn: (input: {
      product: string;
      amount: number;
      recipientName?: string;
      recipientEmail?: string;
      giftMessage?: string;
    }) =>
      request<{ reference: string; chargedMinor: number; currency: string; checkoutUrl: string }>(
        'post',
        `/vault/shop/${slug}/buy`,
        input,
      ),
  });
}

/* -------------------------------------------------------------------- issuer */

export const useMyIssuer = () =>
  useQuery({ queryKey: keys.issuer, queryFn: () => request<VaultIssuer | null>('get', '/vault/issuer') });

export function useCreateIssuer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      request<VaultIssuer>('post', '/vault/issuer', input),
    onSuccess: (issuer) => client.setQueryData(keys.issuer, issuer),
  });
}

export function useUpdateIssuer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      request<VaultIssuer>('patch', '/vault/issuer', input),
    onSuccess: (issuer) => client.setQueryData(keys.issuer, issuer),
  });
}

export function useSubmitIssuer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => request<VaultIssuer>('post', '/vault/issuer/submit'),
    onSuccess: (issuer) => client.setQueryData(keys.issuer, issuer),
  });
}

export const useMyProducts = () =>
  useQuery({ queryKey: keys.products, queryFn: () => request<VaultProduct[]>('get', '/vault/issuer/products') });

export function useSaveProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Record<string, unknown> & { id?: string }) =>
      id
        ? request('put', `/vault/issuer/products/${id}`, input)
        : request('post', '/vault/issuer/products', input),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.products }),
  });
}

export function usePauseProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request('post', `/vault/issuer/products/${id}/pause`),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.products }),
  });
}

export const useIssuerSummary = () =>
  useQuery({ queryKey: keys.summary, queryFn: () => request<IssuerSummary>('get', '/vault/issuer/summary') });

export interface IssuerOrderRow {
  reference: string;
  status: string;
  buyerKind: string;
  buyer: string;
  quantity: number;
  faceTotalMinor: number;
  discountMinor: number;
  issuerNetMinor: number;
  currency: string;
  createdAt: string;
}

export const useIssuerOrders = (mode: VaultMode) =>
  useQuery({
    queryKey: keys.issuerOrders(mode),
    queryFn: () => request<IssuerOrderRow[]>('get', '/vault/issuer/orders', undefined, { mode }),
  });

export interface RedemptionRow {
  reference: string;
  amountMinor: number;
  balanceAfterMinor: number;
  source: string;
  mode: VaultMode;
  note: string;
  createdAt: string;
}

export const useRedemptions = () =>
  useQuery({ queryKey: keys.redemptions, queryFn: () => request<RedemptionRow[]>('get', '/vault/issuer/redemptions') });

export function useConsoleRedeem(mode: VaultMode) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { code: string; pin?: string; amount?: number; note?: string }) =>
      request<{
        reference: string;
        redeemedMinor: number;
        balanceMinor: number;
        status: string;
        currency: string;
      }>('post', '/vault/issuer/redeem', input, { mode }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.redemptions });
      client.invalidateQueries({ queryKey: keys.summary });
    },
  });
}

/* ------------------------------------------------------------------- partner */

export const useMyPartner = () =>
  useQuery({ queryKey: keys.partner, queryFn: () => request<VaultPartner | null>('get', '/vault/partner') });

export function useCreatePartner() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => request<VaultPartner>('post', '/vault/partner', input),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.partner }),
  });
}

export function useUpdatePartner() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => request<VaultPartner>('patch', '/vault/partner', input),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.partner }),
  });
}

/**
 * Mints a key. The plaintext comes back exactly once, so the caller is
 * responsible for showing it before it is lost — see `KeyReveal`.
 */
export function useMintKey(side: 'issuer' | 'partner') {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (mode: VaultMode) =>
      request<{ mode: VaultMode; key: string; hint: string }>('post', `/vault/${side}/keys`, { mode }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: side === 'issuer' ? keys.issuer : keys.partner }),
  });
}

export interface LedgerRow {
  kind: string;
  amountMinor: number;
  reference: string;
  note: string;
  createdAt: string;
}

export const useLedger = (mode: VaultMode) =>
  useQuery({
    queryKey: keys.ledger(mode),
    queryFn: () =>
      request<{ balanceMinor: number; currency: string; entries: LedgerRow[] }>(
        'get',
        '/vault/partner/ledger',
        undefined,
        { mode },
      ),
  });

export function useTopUp() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { mode: VaultMode; amount: number }) =>
      request<{ mode: VaultMode; balanceMinor?: number; checkoutUrl?: string }>(
        'post',
        '/vault/partner/topup',
        input,
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.partner });
      client.invalidateQueries({ queryKey: ['vault', 'partner', 'ledger'] });
    },
  });
}

/* --------------------------------------------------------------- my cards */

export interface MyCard {
  id: string;
  issuer: { name: string; slug: string; logoUrl: string };
  last4: string;
  faceValueMinor: number;
  balanceMinor: number;
  currency: string;
  status: string;
  expiresAt: string | null;
  recipientName: string;
}

export const useMyCards = () =>
  useQuery({ queryKey: keys.cards, queryFn: () => request<MyCard[]>('get', '/vault/cards') });

export function useRevealCard() {
  return useMutation({
    mutationFn: (id: string) =>
      request<{ code: string; pin: string | null }>('get', `/vault/cards/${id}/reveal`),
  });
}
