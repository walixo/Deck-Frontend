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
 * Each entry pairs a background with the ink that stays legible on it, since
 * acid green needs black type while cobalt needs white.
 */
export interface FlatColour {
  bg: string;
  ink: string;
}

const FLAT_COLOURS: FlatColour[] = [
  { bg: 'bg-cobalt', ink: 'text-white' },
  { bg: 'bg-acid', ink: 'text-ink' },
  { bg: 'bg-ink', ink: 'text-bone' },
  { bg: 'bg-grey', ink: 'text-ink' },
  { bg: 'bg-bone', ink: 'text-ink' },
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
  1: 'bg-acid text-ink',
  2: 'bg-cobalt text-white',
  3: 'bg-edge text-canvas',
};
