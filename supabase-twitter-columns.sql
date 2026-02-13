-- Add Twitter OAuth columns to users table
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Add twitter_id column (Twitter's user ID)
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_id TEXT;

-- Add twitter_username column (Twitter handle without @)
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_username TEXT;

-- Create index for faster lookups by twitter_id
CREATE INDEX IF NOT EXISTS idx_users_twitter_id ON users(twitter_id);

-- Create index for faster lookups by twitter_username
CREATE INDEX IF NOT EXISTS idx_users_twitter_username ON users(twitter_username);

-- Optional: Add unique constraint if you want to prevent multiple accounts linking to same Twitter
-- ALTER TABLE users ADD CONSTRAINT unique_twitter_id UNIQUE (twitter_id);
