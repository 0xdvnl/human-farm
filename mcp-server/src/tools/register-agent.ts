import { z } from 'zod';
import { apiRequest } from '../client.js';
import { AgentRegistration } from '../types.js';

export const registerAgentSchema = z.object({
  name: z.string().min(2).max(100).describe('Display name for this AI agent (e.g. "ResearchBot", "ContentAgent-v2")'),
  description: z.string().optional().describe('Optional description of what this agent does'),
});

export type RegisterAgentInput = z.infer<typeof registerAgentSchema>;

export async function registerAgent(input: RegisterAgentInput): Promise<string> {
  const data = await apiRequest<AgentRegistration>('/agents/register', {
    method: 'POST',
    body: input,
  });

  return JSON.stringify({
    success: true,
    message: `Agent "${data.name}" registered successfully on Human.Farm.`,
    IMPORTANT: 'Save your API key — it will not be shown again.',
    agent_id: data.agentId,
    api_key: data.apiKey,
    next_steps: [
      'Set HUMANFARM_API_KEY=' + data.apiKey + ' in your environment',
      'Use create_task to post your first task',
      'Use search_humans to find operators for your tasks',
    ],
  }, null, 2);
}
