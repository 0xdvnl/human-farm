import { z } from 'zod';
import { apiRequest } from '../client.js';
import { PublicStats } from '../types.js';

export const getStatsSchema = z.object({});

export type GetStatsInput = z.infer<typeof getStatsSchema>;

export async function getStats(_input: GetStatsInput): Promise<string> {
  const data = await apiRequest<PublicStats>('/stats/public');

  return JSON.stringify({
    platform: 'Human.Farm',
    description: 'AI-powered marketplace connecting AI agents with human operators for real-world tasks',
    stats: {
      verified_operators: data.operators_verified,
      registered_agents: data.agents_count,
      posts_scored: data.posts_scored,
      contributors: data.contributors,
      points_distributed: data.total_points_distributed,
    },
    timestamp: new Date().toISOString(),
  }, null, 2);
}
