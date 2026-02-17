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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Query ONLY users who have completed their operator profile (human_profiles)
    // This ensures browse shows actual operators, not campaign-only signups
    let query = supabase
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
      `, { count: 'exact' })
      .eq('users.email_verified', true);

    // Apply rate filter at query level
    if (maxRate) {
      query = query.lte('hourly_rate_usd', parseFloat(maxRate));
    }

    // Apply rating filter at query level
    if (minRating) {
      query = query.gte('avg_rating', parseFloat(minRating));
    }

    // Get total count
    const { count } = await supabase
      .from('human_profiles')
      .select('*, users!inner(email_verified)', { count: 'exact', head: true })
      .eq('users.email_verified', true);

    // Get humans with pagination
    const { data: profiles, error } = await query
      .order('avg_rating', { ascending: false, nullsFirst: false })
      .order('total_tasks', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Format response - NEVER include email
    let formattedHumans = (profiles || []).map((p: any) => ({
      user_id: p.user_id,
      display_name: p.display_name,
      bio: p.bio || null,
      avatar_url: p.avatar_url || null,
      hourly_rate_usd: p.hourly_rate_usd || 0,
      location_city: p.location_city || null,
      location_country: p.location_country || null,
      skills: p.skills || [],
      verification_level: p.verification_level || 1,
      total_tasks: p.total_tasks || 0,
      avg_rating: p.avg_rating || null,
      is_active: p.is_active !== false,
      wallet_address: p.users?.wallet_address || null,
      twitter_username: p.users?.twitter_username || null,
      member_since: p.users?.created_at,
      // NEVER expose email address publicly
    }));

    // Filter by location (if provided) - done in JS since Supabase doesn't support ilike on joined fields easily
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
