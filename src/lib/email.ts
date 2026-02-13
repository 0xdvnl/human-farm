/**
 * Email Verification System for Human Farm
 *
 * NOTE: Email verification is now handled by Supabase Auth.
 * This file is kept for backwards compatibility but the functions
 * delegate to Supabase Auth methods in auth.ts.
 *
 * See: resendVerificationEmail() in auth.ts
 */

// This file is deprecated - email verification is handled by Supabase Auth
// Keeping minimal exports for backwards compatibility

export function isEmailConfigured(): boolean {
  // Supabase Auth handles email verification
  return true;
}
