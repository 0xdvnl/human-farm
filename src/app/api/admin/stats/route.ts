import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple admin secret check - set ADMIN_SECRET in environment variables
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    console.warn('[Admin] ADMIN_SECRET not set');
    return false;
  }

  return authHeader === `Bearer ${adminSecret}`;
}

export async function GET(request: NextRequest) {
  // Check authorization
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Total user count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // 2. Get all user_points data for referral stats
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('referral_count, total_points');

    if (pointsError) throw pointsError;

    // Calculate referral statistics
    const usersWithReferrals = userPoints?.filter(u => u.referral_count > 0).length || 0;
    const totalReferrals = userPoints?.reduce((sum, u) => sum + (u.referral_count || 0), 0) || 0;
    const avgReferrals = totalUsers && totalUsers > 0 ? totalReferrals / totalUsers : 0;

    // Milestone counts (5, 10, 15, 20 referrals)
    const milestone5 = userPoints?.filter(u => u.referral_count >= 5).length || 0;
    const milestone10 = userPoints?.filter(u => u.referral_count >= 10).length || 0;
    const milestone15 = userPoints?.filter(u => u.referral_count >= 15).length || 0;
    const milestone20 = userPoints?.filter(u => u.referral_count >= 20).length || 0;

    // 3. Tweet submission stats
    const { data: tweetStats, error: tweetError } = await supabase
      .from('tweet_submissions')
      .select('total_points, views_count');

    if (tweetError) throw tweetError;

    const usersWhoSubmitted = new Set(tweetStats?.map(t => t.total_points)).size; // This is wrong, need user_id

    // Get unique users who submitted
    const { data: submitters, error: submittersError } = await supabase
      .from('tweet_submissions')
      .select('user_id');

    if (submittersError) throw submittersError;

    const uniqueSubmitters = new Set(submitters?.map(s => s.user_id)).size;

    const totalPointsDistributed = tweetStats?.reduce((sum, t) => sum + (Number(t.total_points) || 0), 0) || 0;
    const totalViews = tweetStats?.reduce((sum, t) => sum + (t.views_count || 0), 0) || 0;
    const totalSubmissions = tweetStats?.length || 0;

    // 4. Get user growth over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentUsers, error: recentError } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (recentError) throw recentError;

    // Group by date
    const usersByDate: Record<string, number> = {};
    recentUsers?.forEach(user => {
      const date = user.created_at.split('T')[0];
      usersByDate[date] = (usersByDate[date] || 0) + 1;
    });

    const stats = {
      // User stats
      totalUsers: totalUsers || 0,
      usersWithReferrals,
      totalReferrals,
      avgReferrals: Math.round(avgReferrals * 100) / 100,

      // Milestones
      milestones: {
        reached5: milestone5,
        reached10: milestone10,
        reached15: milestone15,
        reached20: milestone20,
      },

      // Amplify (Twitter) stats
      amplify: {
        usersWhoSubmitted: uniqueSubmitters,
        totalSubmissions,
        totalPointsDistributed: Math.round(totalPointsDistributed * 100) / 100,
        totalViews,
      },

      // Growth data
      userGrowth: usersByDate,

      // Metadata
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Admin] Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
