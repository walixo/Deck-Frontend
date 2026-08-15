import { useContext } from 'react';
import { ConsentContext } from '@/context/consent';

export function useConsent() {
  const value = useContext(ConsentContext);
  if (!value) throw new Error('useConsent must be used inside ConsentProvider');
  return value;
}
