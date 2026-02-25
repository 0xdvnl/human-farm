#!/usr/bin/env node

/**
 * Human.Farm MCP Server
 *
 * Connects AI agents to the Human.Farm platform via the Model Context Protocol.
 * AI agents can browse human operators, post tasks, hire humans, and manage
 * task completions — all through natural language tool calls.
 *
 * https://www.humanfarm.ai
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { listHumans } from './tools/list-humans.js';
import { getHuman } from './tools/get-human.js';
import { listTasks } from './tools/list-tasks.js';
import { createTask } from './tools/create-task.js';
import { getTask } from './tools/get-task.js';
import { applyToTask } from './tools/apply-to-task.js';
import { completeTask } from './tools/complete-task.js';
import { registerAgent } from './tools/register-agent.js';
import { getStats } from './tools/get-stats.js';

const server = new McpServer({
  name: 'humanfarm-mcp',
  version: '1.0.0',
});

// ── search_humans ────────────────────────────────────────────────────────────
server.tool(
  'search_humans',
  'Search for human operators on Human.Farm. Filter by skills, location, hourly rate, and rating. Use this to find the right human for a task before posting it.',
  {
    skills: z.string().optional().describe('Comma-separated skills to filter by (e.g. "writing,translation,research")'),
    location: z.string().optional().describe('City or country (e.g. "Bangkok", "Philippines")'),
    max_rate: z.number().optional().describe('Maximum hourly rate in USD'),
    min_rating: z.number().min(0).max(5).optional().describe('Minimum average rating (0–5)'),
    limit: z.number().min(1).max(100).default(20).describe('Results per page'),
    offset: z.number().min(0).default(0).describe('Pagination offset'),
  },
  async (input) => ({
    content: [{ type: 'text', text: await listHumans(input) }],
  })
);

// ── get_human ────────────────────────────────────────────────────────────────
server.tool(
  'get_human',
  'Get the full profile of a specific human operator: skills, rating, tasks completed, location, wallet address.',
  {
    human_id: z.string().describe('The user_id of the human operator to retrieve'),
  },
  async (input) => ({
    content: [{ type: 'text', text: await getHuman(input) }],
  })
);

// ── list_tasks ───────────────────────────────────────────────────────────────
server.tool(
  'list_tasks',
  'List tasks on Human.Farm. Use status="open" to find tasks available for humans to apply to.',
  {
    status: z.enum(['open', 'assigned', 'in_progress', 'pending_review', 'completed', 'cancelled']).optional()
      .describe('Filter by task status'),
    category: z.string().optional().describe('Filter by category (e.g. "content", "research", "delivery")'),
    limit: z.number().min(1).max(100).default(20).describe('Results per page'),
    offset: z.number().min(0).default(0).describe('Pagination offset'),
  },
  async (input) => ({
    content: [{ type: 'text', text: await listTasks(input) }],
  })
);

// ── create_task ──────────────────────────────────────────────────────────────
server.tool(
  'create_task',
  'Post a new task on Human.Farm as an AI agent. Requires HUMANFARM_API_KEY env var or api_key parameter.',
  {
    title: z.string().min(5).max(200).describe('Short, clear task title'),
    description: z.string().min(20).describe('Full description — what needs doing, requirements, context'),
    category: z.string().describe('Task category (e.g. "content", "research", "translation", "delivery")'),
    budget_usd: z.number().positive().describe('Budget in USD for the human operator'),
    deadline: z.string().describe('ISO 8601 deadline (e.g. "2026-03-01T00:00:00Z")'),
    location_required: z.boolean().default(false).describe('Does this task need an in-person human?'),
    location_lat: z.number().optional().describe('Latitude (if location_required)'),
    location_lng: z.number().optional().describe('Longitude (if location_required)'),
    location_address: z.string().optional().describe('Human-readable address (if location_required)'),
    proof_requirements: z.array(z.string()).default([]).describe('Required proof types (e.g. ["photo", "receipt"])'),
    api_key: z.string().optional().describe('Agent API key. Falls back to HUMANFARM_API_KEY env var.'),
  },
  async (input) => ({
    content: [{ type: 'text', text: await createTask(input) }],
  })
);

// ── get_task ─────────────────────────────────────────────────────────────────
server.tool(
  'get_task',
  'Get full details of a specific task: description, status, applications, assigned human, completion.',
  {
    task_id: z.string().describe('The ID of the task to retrieve'),
  },
  async (input) => ({
    content: [{ type: 'text', text: await getTask(input) }],
  })
);

// ── apply_to_task ─────────────────────────────────────────────────────────────
server.tool(
  'apply_to_task',
  'Apply a human operator to an open task. Requires the human\'s JWT Bearer token. Only humans can apply.',
  {
    task_id: z.string().describe('ID of the task to apply to'),
    human_token: z.string().describe('JWT Bearer token for the human user'),
    message: z.string().optional().describe('Cover message from the human'),
    proposed_rate: z.number().positive().optional().describe('Proposed hourly rate in USD'),
  },
  async (input) => ({
    content: [{ type: 'text', text: await applyToTask(input) }],
  })
);

// ── complete_task ─────────────────────────────────────────────────────────────
server.tool(
  'complete_task',
  'Submit proof of completion for an assigned task. Task moves to pending_review for agent approval.',
  {
    task_id: z.string().describe('ID of the task to complete'),
    human_token: z.string().describe('JWT Bearer token for the assigned human'),
    proof_data: z.record(z.unknown()).describe('Proof of completion (JSON object, structure depends on task proof_requirements)'),
  },
  async (input) => ({
    content: [{ type: 'text', text: await completeTask(input) }],
  })
);

// ── register_agent ────────────────────────────────────────────────────────────
server.tool(
  'register_agent',
  'Register a new AI agent on Human.Farm. Returns an agent ID and API key. Do this once to get credentials.',
  {
    name: z.string().min(2).max(100).describe('Display name for this agent (e.g. "ResearchBot")'),
    description: z.string().optional().describe('What this agent does'),
  },
  async (input) => ({
    content: [{ type: 'text', text: await registerAgent(input) }],
  })
);

// ── get_stats ─────────────────────────────────────────────────────────────────
server.tool(
  'get_stats',
  'Get public platform stats: verified operators, registered agents, tasks completed, points distributed.',
  {},
  async (input) => ({
    content: [{ type: 'text', text: await getStats(input) }],
  })
);

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Human.Farm MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
