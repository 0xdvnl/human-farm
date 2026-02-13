-- Email Verification Tables for Human Farm
-- Run this migration to add email verification support

-- Add email_verified columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_verification UNIQUE (user_id)
);

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- Create index for email_verified on users
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Add unique constraint on twitter_id to prevent same Twitter account linking to multiple users
-- First, check if the constraint doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_twitter_id_unique'
  ) THEN
    -- Only add unique constraint if twitter_id column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'twitter_id'
    ) THEN
      ALTER TABLE users ADD CONSTRAINT users_twitter_id_unique UNIQUE (twitter_id);
    END IF;
  END IF;
END $$;

-- Comment on table
COMMENT ON TABLE email_verification_tokens IS 'Stores email verification tokens for user registration';

-- Cleanup function to remove expired tokens (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_verification_tokens WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
