import type { Category, PricingModel } from '@/types';

/** Tiny className joiner — keeps conditional Tailwind classes readable. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const CATEGORY_LABELS: Record<Category, string> = {
  'ai-model': 'AI Model',
  'ai-tool': 'AI Tool',
  'claude-skill': 'Claude Skill',
  'developer-tool': 'Developer Tool',
  'mobile-app': 'Mobile App',
  website: 'Website',
  hardware: 'Hardware',
};

export const CATEGORY_PLURAL: Record<Category, string> = {
  'ai-model': 'AI Models',
  'ai-tool': 'AI Tools',
  'claude-skill': 'Claude Skills',
  'developer-tool': 'Developer Tools',
  'mobile-app': 'Mobile Apps',
  website: 'Websites',
  hardware: 'Hardware',
};

export const PRICING_LABELS: Record<PricingModel, string> = {
  free: 'Free',
  freemium: 'Freemium',
  paid: 'Paid',
  'open-source': 'Open source',
};

/**
 * Deterministic flat colour per name — every item gets its own identity without
 * needing an image. Flat fills, never gradients: the style has no depth cues
 * other than the hard shadow.
 *
 * Every entry is a NEUTRAL. That is the whole point of the list now, and it is
 * worth stating plainly because it used to be the opposite.
 *
 * These fills sit on the content layer — behind a launch's monogram, under a
 * merch card, along the edge of a profile. Deck's pages are mostly other
 * people's logos, in whatever colours those people chose. A saturated tile
 * assigned by hashing a slug has no relationship to the product sitting on it,
 * so at best it is arbitrary and at worst it clashes with the very thing the
 * page exists to show.
 *
 * So the content layer is greyscale and the accents live in the chrome —
 * buttons, focus, active states — where they mean something. The colour a
 * visitor sees on a launch page should be the maker's, not Deck's.
 *
 * Four steps rather than five, and ordered light-to-dark so adjacent items in a
 * list stay distinguishable while none of them shouts.
 */
export interface FlatColour {
  bg: string;
  ink: string;
}

const FLAT_COLOURS: FlatColour[] = [
  { bg: 'bg-surface-2', ink: 'text-body' },
  { bg: 'bg-grey-soft', ink: 'text-ink' },
  { bg: 'bg-grey', ink: 'text-ink' },
  { bg: 'bg-ink', ink: 'text-bone' },
];

function hashOf(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100_000;
  }
  return hash;
}

export function colourFor(seed: string): FlatColour {
  return FLAT_COLOURS[hashOf(seed) % FLAT_COLOURS.length];
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Where a person lives on Deck: `/@username`.
 *
 * A function rather than a template literal at two dozen call sites, because
 * this is the second shape the URL has had — it was `/u/:username` — and the
 * first move cost a search-and-replace across twenty-three files. The next one
 * is this line.
 *
 * The `@` is part of the path, not decoration: React Router cannot express a
 * partial dynamic segment (its matcher only recognises `:param` directly after
 * a slash), so the route is `/:handle` and the sigil is checked by the page.
 * See `App.tsx`.
 */
export function profilePath(username: string): string {
  return `/@${username}`;
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(value);
}

export function relativeTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function formatDay(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Reads a launch day as a phrase: "today" and "yesterday" work as adverbs, but a
 * real date needs a preposition — "3 launches today" vs "3 launches on Fri 10 Jul".
 */
export function dayPhrase(dateKey: string): string {
  const label = formatDay(dateKey);
  return label === 'Today' || label === 'Yesterday' ? label.toLowerCase() : `on ${label}`;
}

export function formatFullDate(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Hostname only, for showing a link without the noise. */
export function prettyUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Flat medal fills for the top three. Rank badges are solid blocks, not metal. */
export const MEDAL_STYLES: Record<number, string> = {
  /* First place takes the bright half of the pair, not the dark one — the
     accent it replaced was a bright orange, and a podium that gets duller as
     you climb it reads backwards. */
  1: 'bg-pop text-on-pop',
  2: 'bg-deep text-on-deep',
  3: 'bg-edge text-canvas',
};

/* ---------------------------------------------------------------- money --- */

export const MERCH_CATEGORY_LABELS: Record<string, string> = {
  apparel: 'Apparel',
  stickers: 'Stickers',
  print: 'Print',
  accessories: 'Accessories',
};

/**
 * Formats integer minor units for display. The value stays an integer right up
 * to this boundary — this is the only place a price becomes a decimal, and it
 * never feeds back into arithmetic.
 */
export function formatMoney(minor: number, currency = 'NGN'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      // narrowSymbol gives ₦ rather than "NGN " regardless of the viewer's locale.
      currencyDisplay: 'narrowSymbol',
      // Whole units read better for merch pricing than trailing zeros.
      minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(minor / 100);
  } catch {
    // Unknown currency code — fall back to a plain number plus the code.
    return `${currency} ${(minor / 100).toLocaleString()}`;
  }
}

export function orderStatusLabel(status: string): string {
  switch (status) {
    case 'awaiting_payment':
      return 'Awaiting payment';
    case 'paid':
      return 'Paid';
    case 'shipped':
      return 'Shipped';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

/** Flat block styling per order status, in the two-accent palette. */
export const ORDER_STATUS_TONE: Record<string, string> = {
  awaiting_payment: 'bg-surface-2 text-body',
  paid: 'bg-deep text-on-deep',
  shipped: 'bg-pop text-on-pop',
  delivered: 'bg-pop text-on-pop',
  cancelled: 'bg-edge text-canvas',
};

/**
 * How much of a launch's edit window is left.
 *
 * Derived from the server's `editableUntil` rather than recomputed from the
 * launch date and a duplicated constant — the window length lives in the
 * backend's env, and a second copy here would disagree the moment it changed.
 */
export function editWindow(editableUntil: string | undefined): {
  open: boolean;
  label: string;
} {
  if (!editableUntil) return { open: false, label: '' };

  const remaining = new Date(editableUntil).getTime() - Date.now();
  if (remaining <= 0) return { open: false, label: '' };

  const minutes = Math.ceil(remaining / 60_000);
  if (minutes < 60) return { open: true, label: `${minutes} min` };

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return { open: true, label: rest ? `${hours}h ${rest}m` : `${hours}h` };
}
