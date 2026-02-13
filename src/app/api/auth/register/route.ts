import { NextRequest, NextResponse } from 'next/server';
import { createHumanUser, createAgentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, password, ...profileData } = body;

    if (!email || !password || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type === 'human') {
      const { display_name, hourly_rate_usd, location_city, location_country, skills, referral_code } = profileData;

      if (!display_name || !hourly_rate_usd || !location_city || !location_country) {
        return NextResponse.json(
          { success: false, error: 'Missing human profile fields' },
          { status: 400 }
        );
      }

      const result = await createHumanUser({
        email,
        password,
        display_name,
        bio: profileData.bio,
        hourly_rate_usd,
        location_city,
        location_country,
        skills: skills || [],
        referral_code: referral_code || undefined,
      });

      return NextResponse.json({
        success: true,
        data: {
          user: { id: result.user.id, email: result.user.email, type: result.user.type },
          profile: result.profile,
          token: result.token,
          emailVerificationSent: result.emailVerificationSent || false,
        },
      });
    } else if (type === 'agent') {
      const { name, description } = profileData;

      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Missing agent name' },
          { status: 400 }
        );
      }

      const result = await createAgentUser({
        email,
        password,
        name,
        description,
      });

      return NextResponse.json({
        success: true,
        data: {
          user: { id: result.user.id, email: result.user.email, type: result.user.type },
          profile: result.profile,
          token: result.token,
          apiKey: result.apiKey,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid user type' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
