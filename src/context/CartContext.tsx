import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartLine } from '@/types';

const STORAGE_KEY = 'deck-cart';
const MAX_PER_LINE = 10;

interface CartContextValue {
  lines: CartLine[];
  /** Display-only subtotal. The server reprices everything at checkout. */
  subtotalMinor: number;
  count: number;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  setQuantity: (sku: string, quantity: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext<CartContextValue | null>(null);

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Tolerate an older or hand-edited shape rather than crashing the app.
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        typeof line?.sku === 'string' &&
        typeof line?.quantity === 'number' &&
        typeof line?.unitPriceMinor === 'number',
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* Private browsing — the cart just will not survive a reload. */
    }
  }, [lines]);

  const clampFor = (line: Pick<CartLine, 'maxStock'>) =>
    Math.max(1, Math.min(MAX_PER_LINE, line.maxStock || MAX_PER_LINE));

  const add = useCallback((line: Omit<CartLine, 'quantity'>, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((entry) => entry.sku === line.sku);
      const ceiling = Math.max(1, Math.min(MAX_PER_LINE, line.maxStock || MAX_PER_LINE));

      if (!existing) {
        return [...current, { ...line, quantity: Math.min(quantity, ceiling) }];
      }
      return current.map((entry) =>
        entry.sku === line.sku
          ? { ...entry, ...line, quantity: Math.min(entry.quantity + quantity, ceiling) }
          : entry,
      );
    });
  }, []);

  const setQuantity = useCallback((sku: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((entry) => entry.sku !== sku)
        : current.map((entry) =>
            entry.sku === sku ? { ...entry, quantity: Math.min(quantity, clampFor(entry)) } : entry,
          ),
    );
  }, []);

  const remove = useCallback((sku: string) => {
    setLines((current) => current.filter((entry) => entry.sku !== sku));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    // Integer arithmetic only — minor units in, minor units out.
    const subtotalMinor = lines.reduce(
      (total, line) => total + line.unitPriceMinor * line.quantity,
      0,
    );
    const count = lines.reduce((total, line) => total + line.quantity, 0);
    return { lines, subtotalMinor, count, add, setQuantity, remove, clear };
  }, [lines, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
