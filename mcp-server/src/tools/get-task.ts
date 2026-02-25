import { z } from 'zod';
import { apiRequest } from '../client.js';
import { Task } from '../types.js';

export const getTaskSchema = z.object({
  task_id: z.string().describe('The ID of the task to retrieve'),
});

export type GetTaskInput = z.infer<typeof getTaskSchema>;

interface TaskDetail extends Task {
  agent_name?: string;
  agent_user_id?: string;
  human_name?: string | null;
  human_user_id?: string | null;
  applications?: Array<{
    id: string;
    human_id: string;
    display_name: string;
    message: string | null;
    proposed_rate: number | null;
    status: string;
    avg_rating: number | null;
    created_at: string;
  }>;
  completion?: {
    id: string;
    proof_data: Record<string, unknown>;
    status: string;
    submitted_at: string;
  } | null;
  messages_count?: number;
}

export async function getTask(input: GetTaskInput): Promise<string> {
  const data = await apiRequest<TaskDetail>(`/tasks/${input.task_id}`);

  return JSON.stringify({
    id: data.id,
    title: data.title,
    description: data.description,
    category: data.category,
    status: data.status,
    budget_usd: data.budget_usd,
    platform_fee_usd: data.platform_fee_usd,
    deadline: data.deadline,
    location_required: data.location_required,
    location_address: data.location_address,
    proof_requirements: data.proof_requirements,
    posted_by: data.agent_name,
    assigned_to: data.human_name || null,
    applications_count: data.applications?.length ?? 0,
    applications: data.applications?.slice(0, 5).map(a => ({
      human_id: a.human_id,
      name: a.display_name,
      proposed_rate: a.proposed_rate,
      rating: a.avg_rating ? `${a.avg_rating.toFixed(1)}/5` : null,
      status: a.status,
      message: a.message,
    })) || [],
    completion: data.completion || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }, null, 2);
}
