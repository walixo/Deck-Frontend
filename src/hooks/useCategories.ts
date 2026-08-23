import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { CategoryCount } from '@/types';

/**
 * The category list, cached once for the whole app.
 *
 * Categories used to be a TypeScript union with a local label map, so any
 * component could write `CATEGORY_LABELS[slug]` synchronously. They live in the
 * database now, which means labels and icons arrive over the wire — and every
 * component that renders a category chip needs them.
 *
 * Rather than thread them through props or add a provider, each consumer calls
 * one of the small hooks below. TanStack Query dedupes to a single request and
 * holds the result for the session, so twenty callers cost one fetch.
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => request<CategoryCount[]>('get', '/categories'),
    /* Categories change when an admin adds one, which is rare and never
       urgent — an hour-old list is fine and saves a request per navigation. */
    staleTime: 60 * 60 * 1000,
  });
}

/** Only the ones open to new launches, in display order. */
export function useActiveCategories() {
  const { data, ...rest } = useCategories();
  return { ...rest, data: data?.filter((category) => category.active) ?? [] };
}

/**
 * Turns a slug into something readable when the list has not arrived, or when
 * the category behind it no longer exists.
 *
 * A launch keeps its slug forever, including after its category is retired and
 * dropped, so this has to degrade to something a person can read rather than to
 * an empty chip. `security-privacy` becomes `Security privacy` — not the
 * authored label, but never blank.
 */
function humanise(slug: string): string {
  const words = slug.replace(/-/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The display label for a category slug. Never empty. */
export function useCategoryLabel(slug: string | undefined): string {
  const { data } = useCategories();
  if (!slug) return '';
  return data?.find((category) => category.slug === slug)?.label ?? humanise(slug);
}

/** The icon key for a category slug, or undefined while the list loads. */
export function useCategoryIcon(slug: string | undefined): string | undefined {
  const { data } = useCategories();
  if (!slug) return undefined;
  return data?.find((category) => category.slug === slug)?.icon;
}

/* ------------------------------------------------------------------ admin --- */

/**
 * Staff writes. All three invalidate the shared category list rather than a
 * narrower key, because a category's label and icon are rendered on practically
 * every page — a stale list would show the old name on half the site.
 */
export interface CategoryDraft {
  label: string;
  slug?: string;
  icon: string;
  blurb?: string;
  order?: number;
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: CategoryDraft) =>
      request<CategoryCount>('post', '/admin/categories', draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories() }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<CategoryDraft> & { id: string; active?: boolean }) =>
      request<CategoryCount>('patch', `/admin/categories/${id}`, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories() }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<{ id: string }>('delete', `/admin/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories() }),
  });
}
