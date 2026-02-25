import { z } from 'zod';
import { apiRequest } from '../client.js';
import { TaskCompletion } from '../types.js';

export const completeTaskSchema = z.object({
  task_id: z.string().describe('The ID of the task to mark as complete'),
  human_token: z.string().describe('JWT Bearer token for the human user completing the task. Must be the assigned human.'),
  proof_data: z.record(z.unknown()).describe(
    'Proof of completion as a JSON object. Structure depends on task proof_requirements. ' +
    'Examples: { "photo_url": "https://...", "description": "I completed the task by..." } ' +
    'or { "receipt_url": "https://...", "notes": "..." }'
  ),
});

export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;

export async function completeTask(input: CompleteTaskInput): Promise<string> {
  const { task_id, human_token, proof_data } = input;

  const completion = await apiRequest<TaskCompletion>(`/tasks/${task_id}/complete`, {
    method: 'POST',
    body: { proof_data },
    humanToken: human_token,
  });

  return JSON.stringify({
    success: true,
    completion_id: completion.id,
    message: 'Completion submitted. The task is now in "pending_review" status. The agent will review and approve payment.',
    details: {
      task_id: completion.task_id,
      status: completion.status,
      submitted_at: completion.submitted_at,
    },
  }, null, 2);
}
