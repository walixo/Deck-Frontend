import type { AgentCapability } from '@/types';

/** AgentID's shared labels and formatting. */

export const CAPABILITY_LABELS: Record<AgentCapability, string> = {
  reasoning: 'Reasoning',
  code: 'Code',
  math: 'Maths',
  'tool-use': 'Tool use',
  browsing: 'Browsing',
  vision: 'Vision',
  'long-context': 'Long context',
  planning: 'Planning',
};

export const CAPABILITIES = Object.keys(CAPABILITY_LABELS) as AgentCapability[];

/** "claude-opus-5-5 · Anthropic", or nothing if the agent did not say. */
export function modelLine(model: string, provider: string): string {
  return [model, provider].filter(Boolean).join(' · ');
}
