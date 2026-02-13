import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Twitter OAuth 2.0 configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`
  : 'https://human.farm/api/auth/twitter/callback';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface TwitterUser {
  id: string;
  name: string;
  username: string;
}

/**
 * Handles Twitter OAuth 2.0 callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description');
      console.error('Twitter OAuth error:', error, errorDescription);
      return NextResponse.redirect(new URL(`/earn?error=twitter_denied&details=${encodeURIComponent(errorDescription || error)}`, request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/earn?error=missing_params', request.url));
    }

    // Get code verifier from cookie
    const codeVerifier = request.cookies.get('twitter_code_verifier')?.value;
    if (!codeVerifier) {
      return NextResponse.redirect(new URL('/earn?error=session_expired', request.url));
    }

    // Decode state to get user info
    let stateData: { userId: string; token: string; nonce: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return NextResponse.redirect(new URL('/earn?error=invalid_state', request.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Twitter token exchange error:', errorData);
      return NextResponse.redirect(new URL('/earn?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user info from Twitter
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('Twitter user fetch error:', errorData);
      return NextResponse.redirect(new URL('/earn?error=user_fetch_failed', request.url));
    }

    const userData = await userResponse.json();
    const twitterUser: TwitterUser = userData.data;

    console.log('Twitter user attempting connection:', {
      userId: stateData.userId,
      twitterId: twitterUser.id,
      twitterUsername: twitterUser.username,
    });

    // Check if this Twitter account is already connected to another user
    const { data: existingConnection } = await supabase
      .from('users')
      .select('id, email')
      .eq('twitter_id', twitterUser.id)
      .neq('id', stateData.userId)
      .single();

    if (existingConnection) {
      console.log('Twitter account already connected to another user:', {
        twitterId: twitterUser.id,
        existingUserId: existingConnection.id,
        attemptingUserId: stateData.userId,
      });
      return NextResponse.redirect(
        new URL(`/earn?error=twitter_already_linked&details=${encodeURIComponent(`This X account (@${twitterUser.username}) is already connected to another human.farm account.`)}`, request.url)
      );
    }

    // Update user in database with Twitter info
    const { error: updateError } = await supabase
      .from('users')
      .update({
        twitter_id: twitterUser.id,
        twitter_username: twitterUser.username,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stateData.userId);

    if (updateError) {
      console.error('Error updating user with Twitter info:', updateError);
      return NextResponse.redirect(new URL('/earn?error=db_update_failed', request.url));
    }

    // Clear the code verifier cookie and redirect to earn page
    const response = NextResponse.redirect(new URL('/earn?twitter=connected', request.url));
    response.cookies.delete('twitter_code_verifier');

    return response;
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    return NextResponse.redirect(new URL('/earn?error=callback_failed', request.url));
  }
}
