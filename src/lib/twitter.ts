import type { TwitterTweetData, TwitterUserData } from '@/types';

// Read at runtime instead of module load time for Vercel compatibility
function getTwitterBearerToken(): string | undefined {
  return process.env.TWITTER_BEARER_TOKEN;
}

export interface FetchedTweetData {
  tweet: TwitterTweetData;
  author: TwitterUserData;
}

/**
 * Extract tweet ID from various X/Twitter URL formats
 */
export function extractTweetId(url: string): string | null {
  // Handle various URL formats:
  // https://twitter.com/username/status/1234567890
  // https://x.com/username/status/1234567890
  // https://twitter.com/username/status/1234567890?s=20
  // https://x.com/i/status/1234567890

  const patterns = [
    /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i,
    /(?:twitter\.com|x\.com)\/i\/status\/(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Check if it's just a tweet ID
  if (/^\d+$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}

/**
 * Fetch tweet data from the X/Twitter API v2
 */
export async function fetchTweetData(tweetId: string): Promise<FetchedTweetData | null> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const TWITTER_BEARER_TOKEN = getTwitterBearerToken();

  console.log('Twitter token check - exists:', !!TWITTER_BEARER_TOKEN, 'length:', TWITTER_BEARER_TOKEN?.length || 0);

  if (!TWITTER_BEARER_TOKEN) {
    console.error('Twitter Bearer Token not configured. NODE_ENV:', process.env.NODE_ENV);
    // Only return mock data in development
    if (isDevelopment) {
      console.log('Returning mock data for development');
      return getMockTweetData(tweetId);
    }
    // In production, throw an error so we can debug
    throw new Error('Twitter API not configured. Please set TWITTER_BEARER_TOKEN environment variable.');
  }

  console.log('Fetching tweet with ID:', tweetId);

  try {
    // Fetch tweet with expansions for author
    const tweetResponse = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=username,verified,verified_type`,
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        },
      }
    );

    console.log('Twitter API response status:', tweetResponse.status);

    if (!tweetResponse.ok) {
      if (tweetResponse.status === 404) {
        return null;
      }
      const errorText = await tweetResponse.text();
      console.error('Twitter API error response:', errorText);
      throw new Error(`Twitter API error: ${tweetResponse.status} - ${errorText}`);
    }

    const data = await tweetResponse.json();
    console.log('Twitter API response data:', JSON.stringify(data, null, 2));

    if (!data.data) {
      console.error('No tweet data in response');
      return null;
    }

    const tweet: TwitterTweetData = {
      id: data.data.id,
      text: data.data.text,
      author_id: data.data.author_id,
      created_at: data.data.created_at,
      public_metrics: {
        like_count: data.data.public_metrics?.like_count || 0,
        retweet_count: data.data.public_metrics?.retweet_count || 0,
        reply_count: data.data.public_metrics?.reply_count || 0,
        impression_count: data.data.public_metrics?.impression_count || 0,
      },
    };

    // Get author from includes
    const authorData = data.includes?.users?.[0];
    const author: TwitterUserData = {
      id: authorData?.id || data.data.author_id,
      username: authorData?.username || 'unknown',
      verified: authorData?.verified || false,
      verified_type: authorData?.verified_type,
    };

    return { tweet, author };
  } catch (error) {
    console.error('Error fetching tweet:', error);
    // Return mock data in development if API fails
    if (isDevelopment) {
      console.log('Returning mock data due to API error in development');
      return getMockTweetData(tweetId);
    }
    throw error; // Re-throw in production so we see the actual error
  }
}

/**
 * Mock tweet data for development/testing
 */
function getMockTweetData(tweetId: string): FetchedTweetData {
  return {
    tweet: {
      id: tweetId,
      text: 'Just discovered @humanfarm - the future of work is here! AI agents hiring humans for real-world tasks. The agentic economy is coming and $HMN token is how we participate. Bullish on human potential! 🚀 #humanfarm #AI #web3',
      author_id: 'mock_author_123',
      created_at: new Date().toISOString(),
      public_metrics: {
        like_count: Math.floor(Math.random() * 500) + 10,
        retweet_count: Math.floor(Math.random() * 100) + 5,
        reply_count: Math.floor(Math.random() * 50) + 2,
        impression_count: Math.floor(Math.random() * 10000) + 1000,
      },
    },
    author: {
      id: 'mock_author_123',
      username: 'crypto_enthusiast',
      verified: Math.random() > 0.5,
      verified_type: Math.random() > 0.7 ? 'blue' : undefined,
    },
  };
}

/**
 * Detect potential bot activity based on engagement patterns
 * Returns a penalty score (0 = no bot activity detected, higher = more suspicious)
 */
export function detectBotActivity(tweet: TwitterTweetData, author: TwitterUserData): number {
  let suspicionScore = 0;

  const { like_count, retweet_count, reply_count, impression_count } = tweet.public_metrics;

  // Check engagement ratios
  // Very high likes to impressions ratio is suspicious
  if (impression_count > 0) {
    const likeRatio = like_count / impression_count;
    if (likeRatio > 0.5) {
      suspicionScore += 2; // Unusually high engagement
    }
  }

  // Retweets significantly higher than likes is unusual
  if (retweet_count > like_count * 2 && retweet_count > 100) {
    suspicionScore += 1;
  }

  // Very few impressions but high engagement
  if (impression_count < 100 && (like_count > 50 || retweet_count > 30)) {
    suspicionScore += 2;
  }

  // No replies with very high other engagement
  if (reply_count === 0 && like_count > 100) {
    suspicionScore += 1;
  }

  return Math.min(suspicionScore, 5); // Cap at 5 points penalty
}
