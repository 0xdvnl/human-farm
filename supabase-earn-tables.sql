-- Supabase tables for the Earn/SocialFi feature
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Tweet Submissions table
CREATE TABLE IF NOT EXISTS tweet_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id TEXT NOT NULL,
  tweet_url TEXT NOT NULL,
  tweet_content TEXT NOT NULL,
  tweet_author_username TEXT NOT NULL,
  tweet_author_verified BOOLEAN DEFAULT FALSE,
  tweet_created_at TIMESTAMPTZ,

  -- Engagement metrics
  likes_count INTEGER DEFAULT 0,
  retweets_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,

  -- Scoring breakdown
  verification_score DECIMAL(5,2) DEFAULT 0,
  content_alignment_score DECIMAL(5,2) DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 0,
  bot_penalty DECIMAL(5,2) DEFAULT 0,

  -- Total points awarded
  total_points DECIMAL(10,2) DEFAULT 0,

  -- AI scoring details
  ai_analysis TEXT,

  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'scored' CHECK (status IN ('pending', 'scored', 'rejected')),

  -- Prevent duplicate submissions
  UNIQUE(tweet_id, user_id)
);

-- User Points table
CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points DECIMAL(10,2) DEFAULT 0,
  submissions_count INTEGER DEFAULT 0,
  referral_points DECIMAL(10,2) DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  referred_by UUID REFERENCES users(id) ON DELETE SET NULL,  -- Who referred this user (for chain tracking)
  referral_code TEXT UNIQUE,  -- User's own referral code
  last_submission_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for referral chain lookups
CREATE INDEX IF NOT EXISTS idx_user_points_referred_by ON user_points(referred_by);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_awarded DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate referrals
  UNIQUE(referrer_id, referred_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tweet_submissions_user_id ON tweet_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_tweet_submissions_tweet_id ON tweet_submissions(tweet_id);
CREATE INDEX IF NOT EXISTS idx_tweet_submissions_submitted_at ON tweet_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_total ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE tweet_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tweet_submissions
CREATE POLICY "Users can view their own submissions" ON tweet_submissions
  FOR SELECT USING (auth.uid()::text = user_id::text OR true);

CREATE POLICY "Users can insert their own submissions" ON tweet_submissions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for user_points
CREATE POLICY "Users can view all points (for leaderboard)" ON user_points
  FOR SELECT USING (true);

CREATE POLICY "Service can insert/update points" ON user_points
  FOR ALL USING (true);

-- RLS Policies for referrals
CREATE POLICY "Users can view their referrals" ON referrals
  FOR SELECT USING (auth.uid()::text = referrer_id::text OR auth.uid()::text = referred_id::text OR true);

CREATE POLICY "Service can insert referrals" ON referrals
  FOR INSERT WITH CHECK (true);

-- Grant permissions for anon users (since we use JWT auth, not Supabase auth)
GRANT ALL ON tweet_submissions TO anon;
GRANT ALL ON user_points TO anon;
GRANT ALL ON referrals TO anon;
