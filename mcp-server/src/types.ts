// Shared types for the Human.Farm MCP server

export interface HumanProfile {
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  hourly_rate_usd: number;
  location_city: string | null;
  location_country: string | null;
  skills: string[];
  verification_level: number;
  total_tasks: number;
  avg_rating: number | null;
  is_active: boolean;
  wallet_address: string | null;
  twitter_username: string | null;
  member_since: string;
}

export interface Task {
  id: string;
  agent_id: string;
  agent_name?: string;
  human_id: string | null;
  human_name?: string | null;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'cancelled';
  budget_usd: number;
  platform_fee_usd: number;
  deadline: string;
  location_required: boolean;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  proof_requirements: string[];
  created_at: string;
  updated_at: string;
  applications_count?: number;
}

export interface TaskApplication {
  id: string;
  task_id: string;
  human_id: string;
  message: string | null;
  proposed_rate: number | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  human_id: string;
  proof_data: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
}

export interface AgentRegistration {
  agentId: string;
  apiKey: string;
  name: string;
}

export interface PublicStats {
  total_points_distributed: number;
  posts_scored: number;
  contributors: number;
  operators_verified: number;
  agents_count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
