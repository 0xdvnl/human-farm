import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our database
export interface DbUser {
  id: string;
  type: 'human' | 'agent';
  email: string | null;
  password_hash: string | null;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbHumanProfile {
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  hourly_rate_usd: number;
  location_city: string | null;
  location_country: string | null;
  location_lat: number | null;
  location_lng: number | null;
  skills: string[];
  availability: any | null;
  verification_level: number;
  total_tasks: number;
  avg_rating: number | null;
  response_time_mins: number | null;
  is_active: boolean;
  last_active_at: string | null;
}

export interface DbAgentProfile {
  user_id: string;
  name: string;
  description: string | null;
  api_key: string;
  total_tasks: number;
  total_spent_usd: number;
  wallet_address: string | null;
  created_at: string;
}

export interface DbTask {
  id: string;
  agent_id: string;
  human_id: string | null;
  title: string;
  description: string;
  category: string;
  status: string;
  budget_usd: number;
  platform_fee_usd: number;
  location_required: boolean;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  deadline: string;
  proof_requirements: string[] | null;
  created_at: string;
  assigned_at: string | null;
  completed_at: string | null;
  escrow_contract_address: string | null;
  escrow_task_id: string | null;
  payment_token: string | null;
  payment_amount_wei: string | null;
  payment_chain_id: number | null;
  payment_status: string | null;
  deposit_tx_hash: string | null;
  release_tx_hash: string | null;
}

export interface DbTaskApplication {
  id: string;
  task_id: string;
  human_id: string;
  message: string | null;
  proposed_rate: number | null;
  created_at: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface DbMessage {
  id: string;
  task_id: string;
  sender_id: string;
  content: string;
  attachments: any | null;
  created_at: string;
  read_at: string | null;
}

export interface DbTaskCompletion {
  id: string;
  task_id: string;
  human_id: string;
  proof_data: any;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DbReview {
  id: string;
  task_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  content: string | null;
  created_at: string;
}
