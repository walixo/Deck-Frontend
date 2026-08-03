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

/** Deterministic gradient per name — every item gets its own identity without an image. */
const GRADIENTS = [
  'from-emerald-400 to-teal-600',
  'from-zinc-700 to-zinc-900',
  'from-green-400 to-emerald-700',
  'from-slate-500 to-zinc-800',
  'from-teal-300 to-emerald-600',
  'from-neutral-600 to-stone-900',
  'from-lime-400 to-emerald-600',
  'from-stone-400 to-zinc-700',
];

export function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100_000;
  }
  return GRADIENTS[hash % GRADIENTS.length];
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

export const MEDAL_STYLES: Record<number, string> = {
  1: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 ring-amber-400/40',
  2: 'bg-gradient-to-br from-zinc-200 to-zinc-400 text-zinc-800 ring-zinc-400/40',
  3: 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950 ring-orange-400/40',
};
