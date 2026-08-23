import { useCallback, useState, type ReactNode } from 'react';
import { ConsentContext, type ConsentChoice } from './consent';

const STORAGE_KEY = 'deck-cookie-consent';

/* The key this used to live under, back when the question was only about
   Google's ad script. Read once so anybody who already answered is not asked
   again — being re-prompted after you have decided is the most annoying failure
   mode a consent banner has. */
const LEGACY_KEY = 'deck-ads-consent';

function read(): ConsentChoice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    return stored === 'granted' || stored === 'denied' ? stored : 'unset';
  } catch {
    /* Private browsing. Treated as no answer, which means nothing non-essential
       loads — failing closed is the only safe direction for a consent check. */
    return 'unset';
  }
}

/**
 * Whether the reader has agreed to non-essential cookies and storage.
 *
 * **What this does not cover.** Deck keeps three things in `localStorage`
 * regardless: the sign-in token, the theme, and the cart. All three are
 * strictly necessary — they exist only because the reader asked for the thing
 * they enable, none of them is readable by anyone but Deck, and none of them
 * follows anybody anywhere. Asking permission to remember that somebody chose
 * dark mode, and then breaking dark mode when they say no, is consent theatre.
 *
 * **What it does cover.** Anything that reaches a third party or could outlive
 * the visit as a profile: Google's advertising script, and embedded players on
 * launch pages. Both are inert until this says `granted`.
 *
 * `unset` is treated exactly like `denied` everywhere it is read. Defaulting the
 * other way would mean trackers run for everyone who has not yet noticed the
 * banner, which is the behaviour consent is supposed to prevent.
 *
 * `reset` exists so the footer can offer "Cookie choices" — a decision you
 * cannot revisit is not really a decision.
 */
export function ConsentProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ConsentChoice>(read);

  const persist = useCallback((next: ConsentChoice) => {
    setChoice(next);
    try {
      if (next === 'unset') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, next);
        /* Cleared rather than left behind, so the migration read above cannot
           resurrect a stale answer after somebody changes their mind. */
        localStorage.removeItem(LEGACY_KEY);
      }
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
