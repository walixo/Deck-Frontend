import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { request } from '@/lib/api';
import { CurrencyContext, type RateTable } from './currency';

const STORAGE_KEY = 'deck-display-currency';

/**
 * A first guess at what somebody wants to see, from their own browser.
 *
 * `Intl.NumberFormat().resolvedOptions()` does not give a currency, and there is
 * no reliable country in the browser — so this reads the locale's region and
 * maps the handful Deck supports. Anything unrecognised falls through to naira,
 * which is both the settlement currency and the correct answer for most of
 * Deck's readers.
 *
 * Deliberately not IP geolocation. That needs a third-party lookup on every
 * first page view, which is a request to somebody else's server before the
 * reader has agreed to anything — see the cookie notice. The locale is already
 * in the browser and costs nothing.
 */
const REGION_CURRENCY: Record<string, string> = {
  NG: 'NGN',
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  GH: 'GHS',
  KE: 'KES',
  ZA: 'ZAR',
  IE: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  NL: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  PT: 'EUR',
};

function guessCurrency(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    /* Private mode. Fall through to the locale guess. */
  }

  try {
    const locale = new Intl.Locale(navigator.language);
    /* `maximize` turns "en" into "en-Latn-US", so a bare language tag still
       yields a region rather than nothing. */
    const region = locale.maximize().region;
    return (region && REGION_CURRENCY[region]) || 'NGN';
  } catch {
    return 'NGN';
  }
}

/**
 * What currency to *show* prices in. Not what Deck charges in.
 *
 * The distinction is the entire point and is enforced by shape: `base` is what
 * the server priced everything in and is the only figure a charge is ever
 * derived from; `display` is a reader preference that produces a second,
 * approximate number shown beside it. Nothing here can change what somebody
 * pays.
 *
 * The rate table is a normal query with a long stale time — the server already
 * caches for a day, so refetching on every mount would be asking a question
 * whose answer cannot have changed.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [display, setDisplayState] = useState<string>(guessCurrency);

  const { data: table } = useQuery({
    queryKey: ['rates'],
    queryFn: () => request<RateTable>('get', '/rates'),
    staleTime: 60 * 60 * 1000,
    /* A failed rate fetch must not retry in a loop behind every page: prices
       still render in naira, which is the number that matters. */
    retry: 1,
  });

  const setDisplay = useCallback((code: string) => {
    setDisplayState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* Holds for this session only. */
    }
  }, []);

  const base = table?.base ?? 'NGN';

  const convert = useCallback(
    (baseMinor: number): number | null => {
      if (!table || display === base) return null;
      const rate = table.rates[display];
      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null;
      return Math.round(baseMinor * rate);
    },
    [table, display, base],
  );

  const value = useMemo(
    () => ({ display, base, setDisplay, table: table ?? null, convert }),
    [display, base, setDisplay, table, convert],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
