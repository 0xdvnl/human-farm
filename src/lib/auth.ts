import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { supabase } from './supabase';
import { syncContactToAC, updateReferralCount } from './activecampaign';
import type { User, HumanProfile, AgentProfile } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'human-farm-secret-key-change-in-production';

export interface JWTPayload {
  userId: string;
  type: 'human' | 'agent';
  email: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function generateApiKey(): string {
  return `hf_${uuidv4().replace(/-/g, '')}`;
}

/**
 * Create a human user using Supabase Auth for email verification
 * Flow:
 * 1. Create Supabase Auth user (sends verification email automatically)
 * 2. Create our users table record linked to Supabase Auth
 * 3. Create profile and other records
 */
export async function createHumanUser(data: {
  email: string;
  password: string;
  display_name: string;
  bio?: string;
  hourly_rate_usd: number;
  location_city: string;
  location_country: string;
  skills: string[];
  referral_code?: string;
}): Promise<{ user: User; profile: HumanProfile; token: string; emailVerificationSent: boolean }> {

  // Step 1: Create Supabase Auth user - this sends verification email automatically
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://human.farm'}/auth/callback`,
      data: {
        display_name: data.display_name,
        type: 'human',
      },
    },
  });

  if (authError) {
    console.error('[Auth] Supabase Auth signup error:', authError);
    if (authError.message.includes('already registered')) {
      throw new Error('UNIQUE constraint failed: users.email');
    }
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Failed to create user account');
  }

  const userId = authData.user.id; // Use Supabase Auth user ID

  // Step 2: Create our users table record (linked to Supabase Auth)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      id: userId,
      type: 'human',
      email: data.email,
      password_hash: null, // No need to store password - Supabase Auth handles it
      email_verified: false, // Will be updated when user confirms email
    })
    .select()
    .single();

  if (userError) {
    console.error('[Auth] Users table insert error:', userError);
    if (userError.code === '23505') {
      throw new Error('UNIQUE constraint failed: users.email');
    }
    throw userError;
  }

  // Step 3: Create profile
  const { data: profileData, error: profileError } = await supabase
    .from('human_profiles')
    .insert({
      user_id: userId,
      display_name: data.display_name,
      bio: data.bio || '',
      hourly_rate_usd: data.hourly_rate_usd,
      location_city: data.location_city,
      location_country: data.location_country,
      skills: data.skills,
    })
    .select()
    .single();

  if (profileError) throw profileError;

  // Generate referral code from user ID
  const newUserReferralCode = userId.replace(/-/g, '').substring(0, 8);

  // Handle referral chain if referral code provided
  let referredById: string | null = null;

  if (data.referral_code) {
    try {
      let referrerPoints = null;

      const { data: byCode } = await supabase
        .from('user_points')
        .select('user_id, referral_count')
        .eq('referral_code', data.referral_code)
        .single();

      if (byCode) {
        referrerPoints = byCode;
      } else {
        const { data: allPoints } = await supabase
          .from('user_points')
          .select('user_id, referral_count');

        if (allPoints) {
          const match = allPoints.find((p: any) =>
            p.user_id.replace(/-/g, '').substring(0, 8) === data.referral_code
          );
          if (match) {
            referrerPoints = match;
          }
        }
      }

      if (referrerPoints) {
        referredById = referrerPoints.user_id;

        await supabase.from('referrals').insert({
          id: uuidv4(),
          referrer_id: referrerPoints.user_id,
          referred_id: userId,
          referral_code: data.referral_code,
          created_at: new Date().toISOString(),
        });

        await supabase
          .from('user_points')
          .update({
            referral_count: (referrerPoints.referral_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', referrerPoints.user_id);

        console.log(`Referral recorded: ${referrerPoints.user_id} referred ${userId}`);
      }
    } catch (refError) {
      console.error('Referral processing error:', refError);
    }
  }

  // Create user_points record
  try {
    await supabase.from('user_points').insert({
      user_id: userId,
      total_points: 0,
      submissions_count: 0,
      referral_points: 0,
      referral_count: 0,
      referred_by: referredById,
      referral_code: newUserReferralCode,
      updated_at: new Date().toISOString(),
    });
    console.log(`Created user_points for ${userId} with referral_code ${newUserReferralCode}, referred_by: ${referredById}`);
  } catch (pointsError) {
    console.error('Error creating user_points:', pointsError);
  }

  // Sync to ActiveCampaign for marketing automation
  console.log(`[Auth] ====== SYNCING TO ACTIVECAMPAIGN ======`);
  try {
    const acResult = await syncContactToAC({
      email: data.email,
      firstName: data.display_name.split(' ')[0],
      lastName: data.display_name.split(' ').slice(1).join(' ') || undefined,
      userId: userId,
      referralCode: newUserReferralCode,
    });
    console.log(`[Auth] AC sync result:`, JSON.stringify(acResult));

    if (referredById) {
      const { data: referrerUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', referredById)
        .single();

      const { data: referrerPoints } = await supabase
        .from('user_points')
        .select('referral_count')
        .eq('user_id', referredById)
        .single();

      if (referrerUser && referrerPoints) {
        await updateReferralCount(referrerUser.email, referrerPoints.referral_count || 0);
      }
    }
  } catch (acError) {
    console.error('ActiveCampaign sync error:', acError);
  }

  // Generate our app token for API access
  const token = generateToken({
    userId: userData.id,
    type: 'human',
    email: userData.email,
  });

  console.log(`[Auth] User created successfully. Verification email sent via Supabase to ${data.email}`);

  return {
    user: userData as User,
    profile: profileData as HumanProfile,
    token,
    emailVerificationSent: true, // Supabase Auth always sends verification email
  };
}

/**
 * Create an agent user (agents don't need email verification)
 */
export async function createAgentUser(data: {
  email: string;
  password: string;
  name: string;
  description?: string;
}): Promise<{ user: User; profile: AgentProfile; token: string; apiKey: string }> {

  // For agents, we use Supabase Auth but email verification is optional
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        type: 'agent',
      },
    },
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      throw new Error('UNIQUE constraint failed: users.email');
    }
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Failed to create agent account');
  }

  const userId = authData.user.id;
  const apiKey = generateApiKey();

  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      id: userId,
      type: 'agent',
      email: data.email,
      password_hash: null,
      email_verified: true, // Agents are auto-verified
    })
    .select()
    .single();

  if (userError) {
    if (userError.code === '23505') {
      throw new Error('UNIQUE constraint failed: users.email');
    }
    throw userError;
  }

  const { data: profileData, error: profileError } = await supabase
    .from('agent_profiles')
    .insert({
      user_id: userId,
      name: data.name,
      description: data.description || '',
      api_key: apiKey,
    })
    .select()
    .single();

  if (profileError) throw profileError;

  const token = generateToken({
    userId: userData.id,
    type: 'agent',
    email: userData.email,
  });

  return { user: userData as User, profile: profileData as AgentProfile, token, apiKey };
}

/**
 * Login user using Supabase Auth
 */
export async function loginUser(email: string, password: string): Promise<{ user: User; profile: any; token: string; emailVerified: boolean } | null> {
  // Use Supabase Auth for login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('[Auth] Supabase Auth login error:', authError.message);
    return null;
  }

  if (!authData.user) {
    return null;
  }

  // Check if email is verified via Supabase Auth
  const emailVerified = !!authData.user.email_confirmed_at;

  // Get our user record
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (userError || !user) {
    console.error('[Auth] User not found in users table:', userError);
    return null;
  }

  // Sync email_verified status to our users table
  if (emailVerified && !user.email_verified) {
    await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verified_at: authData.user.email_confirmed_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    user.email_verified = true;
  }

  // Get profile
  let profile = null;
  if (user.type === 'human') {
    const { data } = await supabase
      .from('human_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    profile = data;
  } else {
    const { data } = await supabase
      .from('agent_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    profile = data;
  }

  const token = generateToken({
    userId: user.id,
    type: user.type,
    email: user.email,
  });

  return { user: user as User, profile, token, emailVerified };
}

/**
 * Get user from our custom JWT token
 */
export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = verifyToken(token);
  if (!payload) return null;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', payload.userId)
    .single();

  return user as User | null;
}

/**
 * Get agent by API key
 */
export async function getAgentByApiKey(apiKey: string): Promise<{ user: User; profile: AgentProfile } | null> {
  const { data: profile } = await supabase
    .from('agent_profiles')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (!profile) return null;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', profile.user_id)
    .single();

  if (!user) return null;

  return { user: user as User, profile: profile as AgentProfile };
}

/**
 * Resend verification email via Supabase Auth
 */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://human.farm'}/auth/callback`,
    },
  });

  if (error) {
    console.error('[Auth] Failed to resend verification email:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if a user's email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('email_verified')
    .eq('id', userId)
    .single();

  return !!user?.email_verified;
}
