import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api';
import type { ShareKit } from '@/types';

/** The badge URL, embed snippets and post text for one launch. */
export function useShareKit(slug: string) {
  return useQuery({
    queryKey: ['share-kit', slug],
    queryFn: () => request<ShareKit>('get', `/share/${slug}`),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}
