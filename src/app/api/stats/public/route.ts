import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/stats/public
 * Returns public statistics for the homepage and earn page (no auth required)
 */
export async function GET() {
  try {
    // Get total points distributed (sum of all user points)
    const { data: pointsData } = await supabase
      .from('user_points')
      .select('total_points');

    const totalPointsDistributed = (pointsData || []).reduce(
      (sum: number, row: any) => sum + (row.total_points || 0),
      0
    );

    // Get total posts scored (count of tweet submissions)
    const { count: postsScored } = await supabase
      .from('tweet_submissions')
      .select('*', { count: 'exact', head: true });

    // Get total contributors (users who have submitted at least one tweet)
    const { data: contributorsData } = await supabase
      .from('user_points')
      .select('user_id')
      .gt('submissions_count', 0);

    const totalContributors = contributorsData?.length || 0;

    // Get verified operators count (humans with verified email)
    const { count: operatorsVerified } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'human')
      .eq('email_verified', true);

    // Get agents count
    const { count: agentsCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'agent');

    return NextResponse.json({
      success: true,
      data: {
        total_points_distributed: Math.round(totalPointsDistributed),
        posts_scored: postsScored || 0,
        contributors: totalContributors,
        operators_verified: operatorsVerified || 0,
        agents_count: agentsCount || 0,
      },
    });
  } catch (error) {
    console.error('Public stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
