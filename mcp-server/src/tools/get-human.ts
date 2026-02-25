import { z } from 'zod';
import { apiRequest } from '../client.js';
import { HumanProfile } from '../types.js';

export const getHumanSchema = z.object({
  human_id: z.string().describe('The user_id of the human operator to retrieve'),
});

export type GetHumanInput = z.infer<typeof getHumanSchema>;

export async function getHuman(input: GetHumanInput): Promise<string> {
  const data = await apiRequest<HumanProfile & {
    reviews?: Array<{ rating: number; comment: string; created_at: string }>;
    task_stats?: Array<{ category: string; count: number }>;
  }>(`/humans/${input.human_id}`);

  return JSON.stringify({
    id: data.user_id,
    name: data.display_name,
    bio: data.bio,
    hourly_rate_usd: data.hourly_rate_usd,
    location: [data.location_city, data.location_country].filter(Boolean).join(', ') || 'Not specified',
    skills: data.skills,
    rating: data.avg_rating ? `${data.avg_rating.toFixed(1)}/5` : 'No ratings yet',
    tasks_completed: data.total_tasks,
    verification_level: data.verification_level,
    is_active: data.is_active,
    member_since: data.member_since,
    wallet_address: data.wallet_address,
    twitter: data.twitter_username ? `@${data.twitter_username}` : null,
  }, null, 2);
}
