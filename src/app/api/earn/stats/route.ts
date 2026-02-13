import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering - required for API routes that use request data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header or cookie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    console.log('Fetching stats for user:', userId);

    // Create fresh Supabase client with NO CACHING for all queries
    const { createClient } = await import('@supabase/supabase-js');
    const freshSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: { schema: 'public' },
        global: {
          fetch: (url, options = {}) => {
            return fetch(url, {
              ...options,
              cache: 'no-store',  // Disable Next.js fetch caching
            });
          },
        },
      }
    );

    // Get user's Twitter connection status and email verification (using fresh client)
    let twitterConnected = false;
    let twitterUsername: string | null = null;
    let emailVerified = false;
    let userEmail: string | null = null;

    try {
      const { data: userData, error: userError } = await freshSupabase
        .from('users')
        .select('twitter_id, twitter_username, email_verified, email')
        .eq('id', userId)
        .single();

      if (!userError && userData) {
        twitterConnected = !!userData.twitter_username;
        twitterUsername = userData.twitter_username || null;
        emailVerified = !!userData.email_verified;
        userEmail = userData.email || null;
      }
      console.log('User status:', { twitterConnected, twitterUsername, emailVerified, userError: userError?.message });
    } catch (err) {
      // If columns don't exist yet, this will fail - that's OK
      console.log('User columns may not exist yet:', err);
    }

    let { data: userPoints, error: pointsError } = await freshSupabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('User points result:', { userPoints, pointsError });

    // Create user_points record if it doesn't exist (for users who registered before the points system)
    const referralCodeForUser = userId.replace(/-/g, '').substring(0, 8);
    if (!userPoints) {
      const { data: newPoints, error: createError } = await freshSupabase
        .from('user_points')
        .insert({
          user_id: userId,
          total_points: 0,
          submissions_count: 0,
          referral_points: 0,
          referral_count: 0,
          referral_code: referralCodeForUser,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!createError && newPoints) {
        userPoints = newPoints;
        console.log('Created user_points record for existing user:', userId);
      }
    }

    // Debug: First check total count in table
    const { count: totalCount } = await freshSupabase
      .from('tweet_submissions')
      .select('*', { count: 'exact', head: true });

    console.log('Total submissions in table:', totalCount);

    // Get user submissions (last 10) - use fresh client
    console.log('Querying with userId:', userId, 'type:', typeof userId);

    const { data: submissions, error: submissionsError } = await freshSupabase
      .from('tweet_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(10);

    console.log('Submissions result:', { count: submissions?.length, submissionsError });

    const submissionsList = submissions || [];

    // Get referrals made by this user
    const { data: referrals } = await freshSupabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);

    const referralsList = referrals || [];

    // Calculate stats
    const stats = {
      total_points: userPoints?.total_points || 0,
      submissions_count: userPoints?.submissions_count || 0,
      referral_points: userPoints?.referral_points || 0,
      referral_count: userPoints?.referral_count || 0,
      last_submission_at: userPoints?.last_submission_at || null,

      // Breakdown
      avg_content_score: submissionsList.length > 0
        ? submissionsList.reduce((sum: number, s: any) => sum + (s.content_alignment_score || 0), 0) / submissionsList.length
        : 0,
      avg_engagement_score: submissionsList.length > 0
        ? submissionsList.reduce((sum: number, s: any) => sum + (s.engagement_score || 0), 0) / submissionsList.length
        : 0,
      verified_tweets_count: submissionsList.filter((s: any) => s.tweet_author_verified).length,
    };

    // Get global leaderboard position
    const { data: allUserPoints } = await freshSupabase
      .from('user_points')
      .select('user_id, total_points')
      .order('total_points', { ascending: false });

    const leaderboardPosition = allUserPoints
      ? allUserPoints.findIndex((p: any) => p.user_id === userId) + 1
      : null;

    // Generate referral code from user ID (first 8 chars of UUID)
    const referralCode = userId.replace(/-/g, '').substring(0, 8);

    // Ensure referral_code is saved in user_points for lookups
    if (userPoints && !userPoints.referral_code) {
      await freshSupabase
        .from('user_points')
        .update({ referral_code: referralCode })
        .eq('user_id', userId);
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        referral_code: referralCode,
        twitter_connected: twitterConnected,
        twitter_username: twitterUsername,
        email_verified: emailVerified,
        email: userEmail,
        recent_submissions: submissionsList.map((s: any) => ({
          id: s.id,
          tweet_url: s.tweet_url,
          tweet_content: (s.tweet_content || '').substring(0, 100) + ((s.tweet_content || '').length > 100 ? '...' : ''),
          total_points: s.total_points,
          submitted_at: s.submitted_at,
          score_breakdown: {
            verification: s.verification_score,
            content: s.content_alignment_score,
            engagement: s.engagement_score,
            bot_penalty: s.bot_penalty,
          },
        })),
        referrals: referralsList.map((r: any) => ({
          id: r.id,
          points_awarded: r.points_awarded,
          created_at: r.created_at,
        })),
        leaderboard_position: leaderboardPosition || null,
        total_users: allUserPoints?.length || 0,
      },
    });

  } catch (error) {
    console.error('Get earn stats error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats: ' + errorMessage },
      { status: 500 }
    );
  }
}
