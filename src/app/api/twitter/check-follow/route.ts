import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

// The @humanfarmai Twitter account username
const HUMANFARM_TWITTER_USERNAME = 'humanfarmai';

// Cache the humanfarmai user ID to avoid repeated lookups
let humanfarmTwitterId: string | null = null;

/**
 * Get the Twitter user ID for @humanfarmai
 */
async function getHumanFarmTwitterId(): Promise<string | null> {
  if (humanfarmTwitterId) return humanfarmTwitterId;

  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    console.error('TWITTER_BEARER_TOKEN not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${HUMANFARM_TWITTER_USERNAME}`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch humanfarmai user ID:', await response.text());
      return null;
    }

    const data = await response.json();
    humanfarmTwitterId = data.data?.id;
    return humanfarmTwitterId;
  } catch (error) {
    console.error('Error fetching humanfarmai user ID:', error);
    return null;
  }
}

/**
 * Check if a user follows @humanfarmai
 * Uses Twitter API v2 - checks if the user's twitter_id is in humanfarmai's followers
 */
async function checkFollowStatus(userTwitterId: string): Promise<boolean> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    console.error('TWITTER_BEARER_TOKEN not configured');
    return false;
  }

  const humanfarmId = await getHumanFarmTwitterId();
  if (!humanfarmId) {
    console.error('Could not get humanfarmai Twitter ID');
    return false;
  }

  try {
    // Check if the user follows humanfarmai by looking at the user's following list
    // Using the user lookup endpoint with connection_status would be ideal but requires OAuth 2.0 user context
    // Instead, we'll check humanfarmai's followers (limited but works with bearer token)

    // First, try to find the user in humanfarmai's followers
    // Note: This only works well when there aren't too many followers
    // For production with many followers, consider storing follow status and verifying periodically

    let paginationToken: string | undefined;
    let checked = 0;
    const maxToCheck = 10000; // Limit how many followers we check

    while (checked < maxToCheck) {
      const url = new URL(`https://api.twitter.com/2/users/${humanfarmId}/followers`);
      url.searchParams.set('max_results', '1000');
      if (paginationToken) {
        url.searchParams.set('pagination_token', paginationToken);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch followers:', errorText);

        // If rate limited, return false but don't error
        if (response.status === 429) {
          console.warn('Twitter API rate limited');
          return false;
        }
        return false;
      }

      const data = await response.json();
      const followers = data.data || [];

      // Check if user is in this batch
      const found = followers.some((f: { id: string }) => f.id === userTwitterId);
      if (found) {
        return true;
      }

      checked += followers.length;

      // Check for more pages
      paginationToken = data.meta?.next_token;
      if (!paginationToken || followers.length === 0) {
        break;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

/**
 * POST /api/twitter/check-follow
 * Verifies if the authenticated user follows @humanfarmai
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's Twitter ID from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('twitter_id, twitter_username')
      .eq('id', payload.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.twitter_id) {
      return NextResponse.json({
        error: 'Twitter account not connected',
        follows: false,
        twitter_connected: false
      }, { status: 400 });
    }

    // Check if user follows @humanfarmai
    const follows = await checkFollowStatus(user.twitter_id);

    // Optionally store the result in database for caching
    // This could be added to user_points or a separate table

    return NextResponse.json({
      success: true,
      follows,
      twitter_username: user.twitter_username,
      humanfarm_account: `@${HUMANFARM_TWITTER_USERNAME}`,
    });
  } catch (error) {
    console.error('Check follow error:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/twitter/check-follow
 * Returns the @humanfarmai account info for the follow button
 */
export async function GET() {
  return NextResponse.json({
    twitter_username: HUMANFARM_TWITTER_USERNAME,
    twitter_url: `https://x.com/${HUMANFARM_TWITTER_USERNAME}`,
  });
}
