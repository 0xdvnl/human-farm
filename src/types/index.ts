// User Types
export type UserType = 'human' | 'agent';

export interface User {
  id: string;
  type: UserType;
  email: string;
  password_hash: string;
  wallet_address?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HumanProfile {
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url?: string | null;
  hourly_rate_usd: number;
  location_city: string;
  location_country: string;
  location_lat?: number | null;
  location_lng?: number | null;
  skills: string[];
  availability?: Record<string, any> | null;
  verification_level: number;
  total_tasks: number;
  avg_rating?: number | null;
  response_time_mins?: number | null;
  is_active: boolean;
  last_active_at?: string | null;
}

export interface AgentProfile {
  user_id: string;
  name: string;
  description?: string;
  api_key: string;
  total_tasks: number;
  total_spent_usd: number;
}

// Task Types
export type TaskStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'pending_review'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export type TaskCategory =
  | 'pickups_deliveries'
  | 'in_person_meetings'
  | 'document_signing'
  | 'verification'
  | 'photography'
  | 'product_testing'
  | 'event_attendance'
  | 'hardware_setup'
  | 'real_estate'
  | 'mystery_shopping'
  | 'sample_collection'
  | 'errands';

export interface Task {
  id: string;
  agent_id: string;
  human_id?: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  budget_usd: number;
  platform_fee_usd: number;
  location_required: boolean;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  deadline: string;
  proof_requirements?: string[];
  created_at: string;
  assigned_at?: string;
  completed_at?: string;
  // Smart Contract Integration Fields
  escrow_contract_address?: string;
  escrow_task_id?: string; // On-chain task ID
  payment_token?: string; // e.g., 'USDC', 'ETH'
  payment_amount_wei?: string; // Amount in wei/smallest unit
  payment_chain_id?: number; // e.g., 8453 for Base
  payment_status?: 'pending_deposit' | 'escrowed' | 'released' | 'refunded' | 'disputed';
  deposit_tx_hash?: string;
  release_tx_hash?: string;
}

// Payment/Escrow Types for Smart Contract Integration
export interface EscrowConfig {
  contractAddress: string;
  chainId: number;
  chainName: string;
  rpcUrl: string;
  explorerUrl: string;
  paymentTokens: PaymentToken[];
}

export interface PaymentToken {
  symbol: string;
  address: string; // Contract address, or '0x0' for native token
  decimals: number;
}

// Message Types
export interface Message {
  id: string;
  task_id: string;
  sender_id: string;
  content: string;
  attachments?: Record<string, any>[];
  created_at: string;
  read_at?: string;
}

// Review Types
export interface Review {
  id: string;
  task_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  content?: string;
  created_at: string;
}

// Task Application Types
export interface TaskApplication {
  id: string;
  task_id: string;
  human_id: string;
  message?: string;
  proposed_rate?: number;
  created_at: string;
  status: 'pending' | 'accepted' | 'rejected';
}

// Task Completion Types
export interface TaskCompletion {
  id: string;
  task_id: string;
  human_id: string;
  proof_data: Record<string, any>;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Search/Filter Types
export interface HumanSearchFilters {
  skills?: string[];
  location?: string;
  max_rate?: number;
  min_rating?: number;
  available_now?: boolean;
}

export interface TaskSearchFilters {
  category?: TaskCategory;
  status?: TaskStatus;
  min_budget?: number;
  max_budget?: number;
  location?: string;
}

// Combined Profile Types (for API responses)
export interface HumanWithProfile extends User {
  profile: HumanProfile;
}

export interface AgentWithProfile extends User {
  profile: AgentProfile;
}

export interface TaskWithDetails extends Task {
  agent?: AgentWithProfile;
  human?: HumanWithProfile;
  applications_count?: number;
  messages_count?: number;
}

// Skills list
export const SKILL_CATEGORIES = {
  physical: [
    'pickups',
    'deliveries',
    'errands',
    'heavy_lifting',
    'driving',
  ],
  professional: [
    'photography',
    'videography',
    'writing',
    'translation',
    'data_entry',
  ],
  technical: [
    'hardware_setup',
    'it_support',
    'testing',
    'debugging',
  ],
  social: [
    'event_attendance',
    'networking',
    'meetings',
    'presentations',
  ],
  verification: [
    'mystery_shopping',
    'site_inspection',
    'document_verification',
    'identity_verification',
  ],
  specialized: [
    'real_estate',
    'legal_witness',
    'notary',
    'sample_collection',
  ],
} as const;

export const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

// ============================================
// SocialFi / Earn Types
// ============================================

export interface TweetSubmission {
  id: string;
  user_id: string;
  tweet_id: string;
  tweet_url: string;
  tweet_content: string;
  tweet_author_username: string;
  tweet_author_verified: boolean;
  tweet_created_at: string;

  // Engagement metrics
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  views_count: number;

  // Scoring breakdown
  verification_score: number;      // 0 or 2 points
  content_alignment_score: number; // 0-10 points
  engagement_score: number;        // calculated based on engagements
  bot_penalty: number;             // negative points if bot activity detected

  // Total points awarded
  total_points: number;

  // AI scoring details
  ai_analysis: string;             // OpenAI's reasoning for the score

  // Metadata
  submitted_at: string;
  status: 'pending' | 'scored' | 'rejected';
}

export interface UserPoints {
  user_id: string;
  total_points: number;
  submissions_count: number;
  referral_points: number;
  referral_count: number;
  last_submission_at: string | null;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  points_awarded: number;
  created_at: string;
}

// Tweet scoring response
export interface TweetScoreResult {
  success: boolean;
  submission?: TweetSubmission;
  error?: string;
  already_submitted?: boolean;
}

// X/Twitter API types
export interface TwitterTweetData {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    impression_count: number;
  };
}

export interface TwitterUserData {
  id: string;
  username: string;
  verified: boolean;
  verified_type?: string;
}
