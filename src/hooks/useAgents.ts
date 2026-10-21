import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
import type { AgentCapability, AgentClaimInfo, AgentProfile, OwnedAgent } from '@/types';

/** AgentID from the browser: the agents you operate, claiming one, and public cards. */

const keys = {
  mine: ['agents', 'mine'] as const,
  claim: (token: string) => ['agents', 'claim', token] as const,
  profile: (agentId: string) => ['agents', 'profile', agentId] as const,
};

export function useMyAgents(enabled = true) {
  return useQuery({
    queryKey: keys.mine,
    queryFn: () => request<{ agents: OwnedAgent[]; limit: number }>('get', '/agents/mine'),
    enabled,
  });
}

export function useAgentClaimInfo(token: string, signedIn: boolean) {
  return useQuery({
    queryKey: [...keys.claim(token), signedIn],
    queryFn: () => request<AgentClaimInfo>('get', `/agents/claim/${token}`),
    retry: false,
  });
}

export function useClaimAgent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => request<OwnedAgent>('post', '/agents/claim', { token }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.mine }),
  });
}

export interface AgentCardInput {
  name?: string;
  description?: string;
  model?: string;
  provider?: string;
  capabilities?: AgentCapability[];
  homepageUrl?: string;
}

export function useUpdateAgent(agentId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AgentCardInput) =>
      request<OwnedAgent>('patch', `/agents/mine/${agentId}`, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: keys.mine });
      await client.invalidateQueries({ queryKey: keys.profile(agentId) });
    },
  });
}

export function useRotateAgentKey(agentId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request<{ apiKey: string; keyHint: string }>('post', `/agents/mine/${agentId}/key`),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.mine }),
  });
}

export function useRetireAgent(agentId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => request<OwnedAgent>('delete', `/agents/mine/${agentId}`),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: keys.mine });
      await client.invalidateQueries({ queryKey: keys.profile(agentId) });
    },
  });
}

export function useAgentProfile(agentId: string) {
  return useQuery({
    queryKey: keys.profile(agentId),
    queryFn: () => request<AgentProfile>('get', `/agents/${agentId}`),
    enabled: Boolean(agentId),
    retry: false,
  });
}
