import { useContext } from 'react';
import { CurrencyContext } from '@/context/currency';

export function useCurrency() {
  const value = useContext(CurrencyContext);
  if (!value) throw new Error('useCurrency must be used inside CurrencyProvider');
  return value;
}
