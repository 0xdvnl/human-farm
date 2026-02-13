import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skills = searchParams.get('skills')?.split(',').filter(Boolean);
    const location = searchParams.get('location');
    const maxRate = searchParams.get('max_rate');
    const minRating = searchParams.get('min_rating');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query - only show verified, active users to agents
    let query = supabase
      .from('human_profiles')
      .select('*, users!inner(email, wallet_address, email_verified)')
      .eq('is_active', true)
      .eq('users.email_verified', true);

    if (maxRate) {
      query = query.lte('hourly_rate_usd', parseFloat(maxRate));
    }

    if (minRating) {
      query = query.gte('avg_rating', parseFloat(minRating));
    }

    // Get total count - only count verified, active users
    const { count } = await supabase
      .from('human_profiles')
      .select('*, users!inner(email_verified)', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('users.email_verified', true);

    // Get humans with pagination
    const { data: humans, error } = await query
      .order('avg_rating', { ascending: false, nullsFirst: false })
      .order('total_tasks', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Format response and apply remaining filters
    let formattedHumans = (humans || []).map((h: any) => ({
      ...h,
      email: h.users?.email,
      wallet_address: h.users?.wallet_address,
      users: undefined,
    }));

    // Filter by location (if provided)
    if (location) {
      const loc = location.toLowerCase();
      formattedHumans = formattedHumans.filter((h: any) =>
        (h.location_city?.toLowerCase().includes(loc)) ||
        (h.location_country?.toLowerCase().includes(loc))
      );
    }

    // Filter by skills (if provided)
    if (skills && skills.length > 0) {
      formattedHumans = formattedHumans.filter((h: any) => {
        const humanSkills = Array.isArray(h.skills) ? h.skills : [];
        return skills.some((skill) => humanSkills.includes(skill));
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        humans: formattedHumans,
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Humans list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch humans' },
      { status: 500 }
    );
  }
}
