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

    // Query all verified users, left join with human_profiles for additional data
    // This shows all registered users as potential operators
    const { data: users, error: usersError, count } = await supabase
      .from('users')
      .select(`
        id,
        wallet_address,
        created_at,
        email_verified,
        twitter_username,
        human_profiles (
          display_name,
          bio,
          avatar_url,
          hourly_rate_usd,
          location_city,
          location_country,
          skills,
          verification_level,
          total_tasks,
          avg_rating,
          is_active
        )
      `, { count: 'exact' })
      .eq('email_verified', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (usersError) throw usersError;

    // Format response - merge user data with profile data
    let formattedHumans = (users || []).map((u: any) => {
      const profile = u.human_profiles?.[0] || u.human_profiles || {};

      // Generate display name from twitter username or wallet or generic
      const displayName = profile.display_name ||
        (u.twitter_username ? `@${u.twitter_username}` : null) ||
        (u.wallet_address ? `${u.wallet_address.slice(0, 6)}...${u.wallet_address.slice(-4)}` : null) ||
        `Operator ${u.id.slice(0, 8)}`;

      return {
        user_id: u.id,
        display_name: displayName,
        bio: profile.bio || null,
        avatar_url: profile.avatar_url || null,
        hourly_rate_usd: profile.hourly_rate_usd || 0,
        location_city: profile.location_city || null,
        location_country: profile.location_country || null,
        skills: profile.skills || [],
        verification_level: profile.verification_level || (u.email_verified ? 1 : 0),
        total_tasks: profile.total_tasks || 0,
        avg_rating: profile.avg_rating || null,
        is_active: profile.is_active !== false, // Default to active
        wallet_address: u.wallet_address || null,
        twitter_username: u.twitter_username || null,
        member_since: u.created_at,
        // NEVER expose email address publicly
      };
    });

    // Apply filters
    if (maxRate) {
      const max = parseFloat(maxRate);
      formattedHumans = formattedHumans.filter((h: any) =>
        h.hourly_rate_usd === 0 || h.hourly_rate_usd <= max
      );
    }

    if (minRating) {
      const min = parseFloat(minRating);
      formattedHumans = formattedHumans.filter((h: any) =>
        h.avg_rating && h.avg_rating >= min
      );
    }

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
