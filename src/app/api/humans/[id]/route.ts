import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get human profile with user data - ONLY show if they have a complete profile
    const { data: profile, error: profileError } = await supabase
      .from('human_profiles')
      .select(`
        *,
        users!inner (
          id,
          wallet_address,
          created_at,
          email_verified,
          twitter_username
        )
      `)
      .eq('user_id', id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Operator not found' },
        { status: 404 }
      );
    }

    // Only show profile if email is verified
    if (!profile.users?.email_verified) {
      return NextResponse.json(
        { success: false, error: 'This profile is not yet activated' },
        { status: 404 }
      );
    }

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
        user_id: profile.user_id,
        display_name: profile.display_name,
        bio: profile.bio || null,
        avatar_url: profile.avatar_url || null,
        hourly_rate_usd: profile.hourly_rate_usd || 0,
        location_city: profile.location_city || null,
        location_country: profile.location_country || null,
        skills: profile.skills || [],
        verification_level: profile.verification_level || 1,
        total_tasks: profile.total_tasks || 0,
        avg_rating: profile.avg_rating || null,
        is_active: profile.is_active !== false,
        wallet_address: profile.users?.wallet_address || null,
        twitter_username: profile.users?.twitter_username || null,
        member_since: profile.users?.created_at,
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
