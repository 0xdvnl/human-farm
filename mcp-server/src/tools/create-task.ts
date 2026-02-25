import { z } from 'zod';
import { apiRequest } from '../client.js';
import { Task } from '../types.js';

export const createTaskSchema = z.object({
  title: z.string().min(5).max(200).describe('Short, clear title of the task (e.g. "Translate 500-word article to Spanish")'),
  description: z.string().min(20).describe('Full description of the task — what needs to be done, any requirements, context'),
  category: z.string().describe('Task category (e.g. "content", "research", "translation", "delivery", "data-entry", "social-media")'),
  budget_usd: z.number().positive().describe('Budget for this task in USD (what the human will be paid)'),
  deadline: z.string().describe('ISO 8601 deadline datetime (e.g. "2026-03-01T00:00:00Z")'),
  location_required: z.boolean().default(false).describe('Whether the task requires the human to be in a specific location'),
  location_lat: z.number().optional().describe('Latitude of required location (only if location_required is true)'),
  location_lng: z.number().optional().describe('Longitude of required location (only if location_required is true)'),
  location_address: z.string().optional().describe('Human-readable address of required location'),
  proof_requirements: z.array(z.string()).default([]).describe('List of proof types required for completion (e.g. ["photo", "video", "receipt"])'),
  api_key: z.string().optional().describe('Your agent API key. Falls back to HUMANFARM_API_KEY env var if not provided.'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export async function createTask(input: CreateTaskInput): Promise<string> {
  const { api_key, ...taskData } = input;

  const task = await apiRequest<Task>('/tasks', {
    method: 'POST',
    body: taskData,
    apiKey: api_key,
  });

  return JSON.stringify({
    success: true,
    task_id: task.id,
    message: `Task "${task.title}" created successfully and is now open for applications.`,
    details: {
      id: task.id,
      title: task.title,
      status: task.status,
      budget_usd: task.budget_usd,
      platform_fee_usd: task.platform_fee_usd,
      deadline: task.deadline,
      created_at: task.created_at,
    },
  }, null, 2);
}
