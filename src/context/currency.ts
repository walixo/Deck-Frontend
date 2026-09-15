import { createContext } from 'react';

export interface RateTable {
  base: string;
  rates: Record<string, number>;
  fetchedAt: string;
  /** False when the server is serving its hardcoded fallback table. */
  live: boolean;
  currencies: string[];
}

export interface CurrencyValue {
  /** What the reader wants to see. Equal to `base` means "naira only". */
  display: string;
  /** Deck's settlement currency. Never converted away from for a charge. */
  base: string;
  setDisplay: (code: string) => void;
  /** Null until the table loads. Callers show base-only until then. */
  table: RateTable | null;
  /**
   * Converts a base-minor amount into display-minor, or null when there is no
   * usable rate. Null rather than a guess: a wrong price is worse than no
   * second price beside an exact one.
   */
  convert: (baseMinor: number) => number | null;
}

export const CurrencyContext = createContext<CurrencyValue | null>(null);
