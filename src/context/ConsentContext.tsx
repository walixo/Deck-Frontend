import { useCallback, useState, type ReactNode } from 'react';
import { ConsentContext, type ConsentChoice } from './consent';

const STORAGE_KEY = 'deck-ads-consent';

function read(): ConsentChoice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'granted' || stored === 'denied' ? stored : 'unset';
  } catch {
    /* Private browsing. Treated as no answer, which means no third-party ads —
       failing closed is the only safe direction for a consent check. */
    return 'unset';
  }
}

/**
 * Whether the reader has agreed to third-party advertising.
 *
 * Deck's own paid placements are not covered by this and never ask: they are
 * served from Deck's own API, set no cookies and tell Google nothing. Consent
 * is only about Google's script, which sees every visitor to any page it loads
 * on — so it does not load at all until somebody says yes.
 *
 * `unset` is treated exactly like `denied` everywhere it is read. Defaulting
 * the other way would mean the tracker runs for everyone who has not yet
 * noticed the banner, which is the behaviour consent is supposed to prevent.
 */
export function ConsentProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ConsentChoice>(read);

  const persist = useCallback((next: ConsentChoice) => {
    setChoice(next);
    try {
      if (next === 'unset') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* The choice still holds for this session. */
    }
  }, []);

  return (
    <ConsentContext.Provider
      value={{
        choice,
        grant: () => persist('granted'),
        deny: () => persist('denied'),
        reset: () => persist('unset'),
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}
