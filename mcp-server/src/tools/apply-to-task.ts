import { z } from 'zod';
import { apiRequest } from '../client.js';
import { TaskApplication } from '../types.js';

export const applyToTaskSchema = z.object({
  task_id: z.string().describe('The ID of the task to apply to'),
  human_token: z.string().describe('JWT Bearer token for the human user applying. Humans must be logged in to apply.'),
  message: z.string().optional().describe('Optional cover message explaining why this human is a good fit'),
  proposed_rate: z.number().positive().optional().describe('Proposed hourly rate in USD (optional, can differ from listed budget)'),
});

export type ApplyToTaskInput = z.infer<typeof applyToTaskSchema>;

export async function applyToTask(input: ApplyToTaskInput): Promise<string> {
  const { task_id, human_token, message, proposed_rate } = input;

  const application = await apiRequest<TaskApplication>(`/tasks/${task_id}/apply`, {
    method: 'POST',
    body: { message, proposed_rate },
    humanToken: human_token,
  });

  return JSON.stringify({
    success: true,
    application_id: application.id,
    message: 'Application submitted successfully. The task agent will review and may accept or reject it.',
    details: {
      task_id: application.task_id,
      status: application.status,
      proposed_rate: application.proposed_rate,
      submitted_at: application.created_at,
    },
  }, null, 2);
}
