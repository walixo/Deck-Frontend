import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, requestRaw } from '@/lib/api';
import type { AgentGame, AgentGameRuntime, ChallengeKind } from '@/types';

/** Building Deck Circuit challenges: the developer's games, and staff review. */

const keys = {
  mine: ['agent-games', 'mine'] as const,
  one: (slug: string) => ['agent-games', slug] as const,
  queue: (status: string) => ['agent-games', 'queue', status] as const,
};

export interface AgentGameInput {
  title: string;
  kind: ChallengeKind;
  summary: string;
  rules: string[];
  answerFormat: string;
  limitMinutes: number;
  runtime: AgentGameRuntime;
  endpointUrl?: string;
}

export function useMyAgentGames() {
  return useQuery({
    queryKey: keys.mine,
    queryFn: () => request<AgentGame[]>('get', '/agents/games/mine'),
  });
}

export function useAgentGame(slug: string) {
  return useQuery({
    queryKey: keys.one(slug),
    queryFn: () => request<AgentGame>('get', `/agents/games/${slug}`),
  });
}

/** Every write returns the game as it now stands; keep the cache in step. */
function useGameWrite<V>(fn: (vars: V) => Promise<AgentGame>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (game) => {
      if ('slug' in game) client.setQueryData(keys.one(game.slug), game);
      void client.invalidateQueries({ queryKey: keys.mine });
    },
  });
}

export function useCreateAgentGame() {
  return useGameWrite((input: AgentGameInput & { slug: string }) =>
    request<AgentGame>('post', '/agents/games', input),
  );
}

export function useUpdateAgentGame(slug: string) {
  return useGameWrite((input: Partial<AgentGameInput>) =>
    request<AgentGame>('patch', `/agents/games/${slug}`, input),
  );
}

export function useUploadModule(slug: string) {
  return useGameWrite((file: File) =>
    requestRaw<AgentGame>(`/agents/games/${slug}/module`, file, 'application/wasm'),
  );
}

export function useRunChecks(slug: string) {
  return useGameWrite<void>(() => request<AgentGame>('post', `/agents/games/${slug}/checks`));
}

export function useSubmitAgentGame(slug: string) {
  return useGameWrite<void>(() => request<AgentGame>('post', `/agents/games/${slug}/submit`));
}

export function useRotateSecret(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request<{ signingSecret: string; secretHint: string }>(
        'post',
        `/agents/games/${slug}/secret`,
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.one(slug) }),
  });
}

export function useRemoveAgentGame(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => request<AgentGame | { deleted: true }>('delete', `/agents/games/${slug}`),
    onSuccess: () => client.invalidateQueries({ queryKey: ['agent-games'] }),
  });
}

/* ------------------------------------------------------------- staff --- */

export function useAgentGameQueue(status = 'pending') {
  return useQuery({
    queryKey: keys.queue(status),
    queryFn: () => request<AgentGame[]>('get', '/admin/agent-games', undefined, { status }),
  });
}

export function useReviewAgentGame() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      ...body
    }: {
      slug: string;
      decision: 'approve' | 'reject';
      note?: string;
      base?: number;
    }) => request<AgentGame>('patch', `/admin/agent-games/${slug}/review`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: ['agent-games'] }),
  });
}
