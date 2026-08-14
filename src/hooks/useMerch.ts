import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import type {
  MerchFilters,
  MerchProduct,
  MerchProductDetail,
  Order,
  Paginated,
  ShippingQuote,
} from '@/types';

export const merchKeys = {
  list: (filters: MerchFilters) => ['merch', filters] as const,
  product: (slug: string) => ['merch-product', slug] as const,
  categories: () => ['merch-categories'] as const,
  shipping: (subtotalMinor: number) => ['shipping-quote', subtotalMinor] as const,
  orders: () => ['orders'] as const,
  order: (reference: string) => ['order', reference] as const,
};

export function useMerchList(filters: MerchFilters = {}) {
  return useQuery({
    queryKey: merchKeys.list(filters),
    queryFn: () =>
      requestWithMeta<MerchProduct[], Paginated<MerchProduct>['meta']>('/merch', {
        ...filters,
        search: filters.search || undefined,
      }),
  });
}

export function useMerchProduct(slug: string) {
  return useQuery({
    queryKey: merchKeys.product(slug),
    queryFn: () => request<MerchProductDetail>('get', `/merch/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useMerchCategories() {
  return useQuery({
    queryKey: merchKeys.categories(),
    queryFn: () => request<{ slug: string; count: number }[]>('get', '/merch/categories'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Shipping is quoted by the server so the cart never guesses the rule. */
export function useShippingQuote(subtotalMinor: number) {
  return useQuery({
    queryKey: merchKeys.shipping(subtotalMinor),
    queryFn: () =>
      request<ShippingQuote>('get', '/orders/shipping-quote', undefined, { subtotalMinor }),
    enabled: subtotalMinor > 0,
  });
}

interface PlaceOrderInput {
  lines: { sku: string; quantity: number }[];
  email: string;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
}

/** The payload deliberately carries no prices — the server reprices every line. */
export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PlaceOrderInput) =>
      request<Order & { authorizationUrl: string | null }>('post', '/orders', input),
    onSuccess: async () => {
      // Stock changed, so any cached product or listing is now stale.
      await queryClient.invalidateQueries({ queryKey: ['merch'] });
      await queryClient.invalidateQueries({ queryKey: ['merch-product'] });
      await queryClient.invalidateQueries({ queryKey: merchKeys.orders() });
    },
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: merchKeys.orders(),
    queryFn: () => request<Order[]>('get', '/orders'),
  });
}

export function useOrder(reference: string) {
  return useQuery({
    queryKey: merchKeys.order(reference),
    queryFn: () => request<Order>('get', `/orders/${reference}`),
    enabled: Boolean(reference),
  });
}

/** Confirms payment with the server, which asks Paystack directly. */
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reference: string) => request<Order>('post', `/orders/${reference}/verify`),
    onSuccess: async (order) => {
      queryClient.setQueryData(merchKeys.order(order.reference), order);
      await queryClient.invalidateQueries({ queryKey: merchKeys.orders() });
    },
  });
}
