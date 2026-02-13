import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, resendVerificationEmail } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/verify-email?token=xxx
 *
 * NOTE: With Supabase Auth, email verification is handled via the /auth/callback page.
 * This endpoint is kept for backwards compatibility but redirects to the proper flow.
 */
export async function GET(request: NextRequest) {
  // Supabase Auth handles verification via /auth/callback
  // If someone lands here with an old token, redirect them
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');

  if (token) {
    // Old-style token verification - redirect to login page
    // They'll need to request a new verification email
    return NextResponse.json({
      success: false,
      error: 'Verification method has changed. Please request a new verification email from your account.',
      redirectTo: '/auth/login',
    }, { status: 400 });
  }

  return NextResponse.json({
    success: false,
    error: 'Email verification is handled through the link in your email',
  }, { status: 400 });
}

/**
 * POST /api/auth/verify-email
 * Resends verification email for the authenticated user via Supabase Auth
 */
export async function POST(request: NextRequest) {
  try {
    // Get auth token from header or cookie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('auth_token')?.value;

    let userEmail: string | null = null;

    // Try to get email from our JWT token
    if (token) {
      const payload = verifyToken(token);
      if (payload?.email) {
        userEmail = payload.email;
      }
    }

    // Or try to get email from request body
    if (!userEmail) {
      try {
        const body = await request.json();
        userEmail = body.email;
      } catch {
        // No body provided
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Check if user exists and isn't already verified
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email_verified')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email' },
        { status: 404 }
      );
    }

    if (user.email_verified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Resend verification email via Supabase Auth
    const result = await resendVerificationEmail(userEmail);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send verification email' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
