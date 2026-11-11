/**
 * Minor units as naira.
 *
 * Vault is settlement-currency only, so unlike Deck's `Money` component there
 * is no converted second figure — a distributor's balance and a merchant's
 * settlement are both in the currency Deck actually pays in, and showing an
 * approximate dollar figure beside a number somebody reconciles would be
 * actively unhelpful.
 *
 * Its own module rather than living beside the components, so the file that
 * exports components exports only components and fast refresh keeps working.
 */
export function naira(minor: number): string {
  return `₦${(minor / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}
