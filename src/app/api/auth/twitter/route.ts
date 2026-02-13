import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyToken } from '@/lib/auth';

// Twitter OAuth 2.0 configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`
  : 'https://human.farm/api/auth/twitter/callback';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Initiates Twitter OAuth 2.0 flow with PKCE
 */
export async function GET(request: NextRequest) {
  try {
    // Get the user's auth token from query params or cookie
    const authToken = request.nextUrl.searchParams.get('token') ||
                      request.cookies.get('human-farm-token')?.value;

    if (!authToken) {
      return NextResponse.redirect(new URL('/auth/login?redirect=/earn', request.url));
    }

    // Verify the token
    const payload = verifyToken(authToken);
    if (!payload) {
      return NextResponse.redirect(new URL('/auth/login?redirect=/earn', request.url));
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Generate state with user info
    const state = Buffer.from(JSON.stringify({
      userId: payload.userId,
      token: authToken,
      nonce: crypto.randomBytes(16).toString('hex'),
    })).toString('base64url');

    // Build Twitter authorization URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', TWITTER_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    // Simplified scopes - just what we need to verify user identity
    authUrl.searchParams.set('scope', 'tweet.read users.read');

    console.log('Twitter OAuth - Redirecting to:', authUrl.toString());
    console.log('Twitter OAuth - Client ID:', TWITTER_CLIENT_ID);
    console.log('Twitter OAuth - Redirect URI:', REDIRECT_URI);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    // Store code verifier in a cookie (needed for callback)
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Twitter OAuth initiation error:', error);
    return NextResponse.redirect(new URL('/earn?error=oauth_failed', request.url));
  }
}
