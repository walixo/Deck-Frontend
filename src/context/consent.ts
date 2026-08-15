import { createContext } from 'react';

export type ConsentChoice = 'granted' | 'denied' | 'unset';

export interface ConsentValue {
  choice: ConsentChoice;
  grant: () => void;
  deny: () => void;
  reset: () => void;
}

export const ConsentContext = createContext<ConsentValue | null>(null);
