import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get human profile with user data - only show verified users
    const { data: human, error: humanError } = await supabase
      .from('human_profiles')
      .select('*, users!inner(email, wallet_address, created_at, email_verified)')
      .eq('user_id', id)
      .single();

    if (humanError || !human) {
      return NextResponse.json(
        { success: false, error: 'Human not found' },
        { status: 404 }
      );
    }

    // Only show profile if email is verified
    if (!human.users?.email_verified) {
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
        ...human,
        email: human.users?.email,
        wallet_address: human.users?.wallet_address,
        member_since: human.users?.created_at,
        users: undefined,
        reviews: reviews || [],
        task_stats: taskStats,
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
