import { z } from 'zod';
import { apiRequest, buildQueryString } from '../client.js';
import { HumanProfile } from '../types.js';

export const listHumansSchema = z.object({
  skills: z.string().optional().describe('Comma-separated list of skills to filter by (e.g. "writing,translation,research")'),
  location: z.string().optional().describe('City or country to filter by (e.g. "Bangkok", "Philippines")'),
  max_rate: z.number().optional().describe('Maximum hourly rate in USD'),
  min_rating: z.number().min(0).max(5).optional().describe('Minimum average rating (0-5)'),
  limit: z.number().min(1).max(100).default(20).describe('Number of results to return'),
  offset: z.number().min(0).default(0).describe('Pagination offset'),
});

export type ListHumansInput = z.infer<typeof listHumansSchema>;

interface ListHumansResponse {
  humans: HumanProfile[];
  total: number;
  limit: number;
  offset: number;
}

export async function listHumans(input: ListHumansInput): Promise<string> {
  const qs = buildQueryString({
    skills: input.skills,
    location: input.location,
    max_rate: input.max_rate,
    min_rating: input.min_rating,
    limit: input.limit,
    offset: input.offset,
  });

  const data = await apiRequest<ListHumansResponse>(`/humans${qs}`);

  if (data.humans.length === 0) {
    return JSON.stringify({ message: 'No humans found matching your criteria', total: 0, humans: [] });
  }

  const summary = data.humans.map(h => ({
    id: h.user_id,
    name: h.display_name,
    hourly_rate_usd: h.hourly_rate_usd,
    location: [h.location_city, h.location_country].filter(Boolean).join(', ') || 'Not specified',
    skills: h.skills,
    rating: h.avg_rating ? `${h.avg_rating.toFixed(1)}/5` : 'No ratings yet',
    tasks_completed: h.total_tasks,
    verification_level: h.verification_level,
    active: h.is_active,
    twitter: h.twitter_username ? `@${h.twitter_username}` : null,
  }));

  return JSON.stringify({
    total: data.total,
    showing: `${data.offset + 1}–${data.offset + data.humans.length}`,
    humans: summary,
  }, null, 2);
}
