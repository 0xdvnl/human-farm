import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // First get the user to ensure they exist and are verified
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, wallet_address, created_at, email_verified, twitter_username')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Only show profile if email is verified
    if (!user.email_verified) {
      return NextResponse.json(
        { success: false, error: 'This profile is not yet activated' },
        { status: 404 }
      );
    }

    // Try to get human profile (may not exist for all users)
    const { data: profile } = await supabase
      .from('human_profiles')
      .select('*')
      .eq('user_id', id)
      .single();

    // Generate display name from profile, twitter, wallet, or generic
    const displayName = profile?.display_name ||
      (user.twitter_username ? `@${user.twitter_username}` : null) ||
      (user.wallet_address ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}` : null) ||
      `Operator ${user.id.slice(0, 8)}`;

    // Get recent reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get completed tasks count by category
    const { data: tasks } = await supabase
      .from('tasks')
      .select('category')
      .eq('human_id', id)
      .eq('status', 'completed');

    // Aggregate task stats
    const taskStats = (tasks || []).reduce((acc: any[], task: any) => {
      const existing = acc.find(s => s.category === task.category);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ category: task.category, count: 1 });
      }
      return acc;
    }, []);

    return NextResponse.json({
      success: true,
      data: {
        user_id: user.id,
        display_name: displayName,
        bio: profile?.bio || null,
        avatar_url: profile?.avatar_url || null,
        hourly_rate_usd: profile?.hourly_rate_usd || 0,
        location_city: profile?.location_city || null,
        location_country: profile?.location_country || null,
        skills: profile?.skills || [],
        verification_level: profile?.verification_level || (user.email_verified ? 1 : 0),
        total_tasks: profile?.total_tasks || 0,
        avg_rating: profile?.avg_rating || null,
        is_active: profile?.is_active !== false,
        wallet_address: user.wallet_address || null,
        twitter_username: user.twitter_username || null,
        member_since: user.created_at,
        reviews: reviews || [],
        task_stats: taskStats,
        // NEVER expose email address publicly
      },
    });
  } catch (error) {
    console.error('Human detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch human' },
      { status: 500 }
    );
  }
}
