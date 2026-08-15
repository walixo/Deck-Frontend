import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestWithMeta } from '@/lib/api';
import type {
  AdminOrder,
  AdminOverview,
  AdminUser,
  AuditEvent,
  OrderStatus,
  Paginated,
} from '@/types';

export const adminKeys = {
  overview: () => ['admin-overview'] as const,
  users: (search: string, role: string) => ['admin-users', search, role] as const,
  orders: (status: string) => ['admin-orders', status] as const,
  audit: (action: string, actor: string) => ['admin-audit', action, actor] as const,
};

export function useAdminOverview(enabled = true) {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn: () => request<AdminOverview>('get', '/admin/overview'),
    enabled,
  });
}

export function useAdminUsers(search: string, role: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.users(search, role),
    queryFn: () =>
      requestWithMeta<AdminUser[], Paginated<AdminUser>['meta']>('/admin/users', {
        search: search || undefined,
        role: role || undefined,
      }),
    enabled,
  });
}

/**
 * Promotes or demotes a user.
 *
 * The server refuses self-demotion and refuses to remove the last admin, so
 * the UI can offer the button freely and surface the reason if it comes back.
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'user' | 'admin' }) =>
      request<AdminUser>('patch', `/admin/users/${id}/role`, { role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      await queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
    },
  });
}

export function useAdminOrders(status: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.orders(status),
    queryFn: () =>
      requestWithMeta<AdminOrder[], Paginated<AdminOrder>['meta']>('/admin/orders', {
        status: status || undefined,
      }),
    enabled,
  });
}

/** Moves an order forward: paid → shipped → delivered. Forwards only. */
export function useAdvanceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reference, status }: { reference: string; status: OrderStatus }) =>
      request<AdminOrder>('patch', `/admin/orders/${reference}/status`, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      await queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
    },
  });
}

/**
 * The audit trail.
 *
 * No mutation hook to pair with this one, and that is the point: the trail is
 * append-only, written as a side effect of the actions it records, and there is
 * no API for changing it.
 */
export function useAuditTrail(action: string, actor: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.audit(action, actor),
    queryFn: () =>
      requestWithMeta<AuditEvent[], Paginated<AuditEvent>['meta']>('/admin/audit', {
        action: action || undefined,
        actor: actor || undefined,
      }),
    enabled,
  });
}
