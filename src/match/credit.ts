import { RequestError } from '@/lib/api';
import type { MatchGift } from './matchApi';

/** Match credit's small helpers: money as text, gifts, payment refusals, photos. */

export const naira = (minor: number) => `₦${(minor / 100).toLocaleString('en-NG')}`;

export const GIFTS: Record<MatchGift, { name: string; emoji: string }> = {
  rose: { name: 'rose', emoji: '🌹' },
  drink: { name: 'drink', emoji: '🍹' },
};

/**
 * Why a request was refused for money: `credit` (top up) or `entry` (tonight's
 * themed night). The server sends the code with a 402.
 */
export function paymentCode(error: unknown): 'credit' | 'entry' | null {
  if (!(error instanceof RequestError) || error.status !== 402) return null;
  const code = (error.fields as unknown as { code?: string } | undefined)?.code;
  return code === 'MATCH_ENTRY' ? 'entry' : 'credit';
}

/** A phone photo, shrunk to a JPEG of at most 900px a side before it is sent. */
export async function shrinkPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}

const REDEEM_KEY = 'match-redeem';

/** A gift card link's code, kept through sign-in and setup until it is claimed. */
export function rememberRedeemCode(code: string): void {
  try {
    localStorage.setItem(REDEEM_KEY, code);
  } catch {
    /* Private windows: the code is still in the link they were sent. */
  }
}

export function pendingRedeemCode(): string {
  try {
    return localStorage.getItem(REDEEM_KEY) ?? '';
  } catch {
    return '';
  }
}

export function forgetRedeemCode(): void {
  try {
    localStorage.removeItem(REDEEM_KEY);
  } catch {
    /* Nothing stored. */
  }
}
