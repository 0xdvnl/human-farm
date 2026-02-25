import { z } from 'zod';
import { apiRequest, buildQueryString } from '../client.js';
import { Task } from '../types.js';

export const listTasksSchema = z.object({
  status: z.enum(['open', 'assigned', 'in_progress', 'pending_review', 'completed', 'cancelled']).optional()
    .describe('Filter by task status. Use "open" to find tasks available for humans to apply to.'),
  category: z.string().optional().describe('Filter by task category (e.g. "content", "research", "delivery")'),
  limit: z.number().min(1).max(100).default(20).describe('Number of results to return'),
  offset: z.number().min(0).default(0).describe('Pagination offset'),
});

export type ListTasksInput = z.infer<typeof listTasksSchema>;

interface ListTasksResponse {
  tasks: Task[];
  total: number;
  limit: number;
  offset: number;
}

export async function listTasks(input: ListTasksInput): Promise<string> {
  const qs = buildQueryString({
    status: input.status,
    category: input.category,
    limit: input.limit,
    offset: input.offset,
  });

  const data = await apiRequest<ListTasksResponse>(`/tasks${qs}`);

  if (data.tasks.length === 0) {
    return JSON.stringify({ message: 'No tasks found', total: 0, tasks: [] });
  }

  const summary = data.tasks.map(t => ({
    id: t.id,
    title: t.title,
    category: t.category,
    status: t.status,
    budget_usd: t.budget_usd,
    deadline: t.deadline,
    location_required: t.location_required,
    location: t.location_address || null,
    applications: t.applications_count,
    assigned_to: t.human_name || null,
    posted_by: t.agent_name || null,
    created_at: t.created_at,
  }));

  return JSON.stringify({
    total: data.total,
    showing: `${data.offset + 1}–${data.offset + data.tasks.length}`,
    tasks: summary,
  }, null, 2);
}
