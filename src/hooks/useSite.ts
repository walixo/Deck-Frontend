import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';

/**
 * What onedeck.africa shows, as staff set it: whether the launch product
 * (board, Discover, launch pages, submitting, acquisitions, their ads) is on,
 * and which landing page the home page uses.
 *
 * The last answer is kept on the device and used until the fresh one
 * arrives, so a visitor never sees one landing page flash into another. A
 * first-ever visit starts from the same defaults the server uses.
 */
export interface SiteSettings {
  launches: boolean;
  landing: 'products' | 'launches';
}

const KEY = ['site'] as const;
const STORE = 'deck-site';
const DEFAULTS: SiteSettings = { launches: false, landing: 'products' };

function remembered(): SiteSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) ?? 'null') as SiteSettings | null;
    return saved && typeof saved.launches === 'boolean' ? saved : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function remember(settings: SiteSettings): SiteSettings {
  try {
    localStorage.setItem(STORE, JSON.stringify(settings));
  } catch {
    /* Private windows: the next visit asks again. */
  }
  return settings;
}

export function useSite(): SiteSettings {
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: async () => remember(await request<SiteSettings>('get', '/site')),
    placeholderData: remembered,
    staleTime: 60_000,
  });
  return data ?? DEFAULTS;
}

/** True when the launch product is on for everyone. */
export const useLaunches = () => useSite().launches;

/** Staff: flip launches, or change the landing page. */
export function useSaveSite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (change: Partial<SiteSettings>) =>
      request<SiteSettings>('put', '/admin/site', change),
    onSuccess: (settings) => client.setQueryData(KEY, remember(settings)),
  });
}
