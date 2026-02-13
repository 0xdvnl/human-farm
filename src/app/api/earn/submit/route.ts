import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { extractTweetId, fetchTweetData, detectBotActivity } from '@/lib/twitter';
import { scoreContent, calculateEngagementScore } from '@/lib/openai-scoring';
import { distributeReferralRewards } from '@/lib/referral-rewards';
import { markAsActivePoster } from '@/lib/activecampaign';

// Force dynamic rendering - required for API routes that use request data
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Debug: Check env vars directly in API route
  const twitterToken = process.env.TWITTER_BEARER_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;
  console.log('ENV CHECK IN API ROUTE:');
  console.log('- TWITTER_BEARER_TOKEN exists:', !!twitterToken, 'length:', twitterToken?.length || 0);
  console.log('- OPENAI_API_KEY exists:', !!openaiKey, 'length:', openaiKey?.length || 0);
  console.log('- All env keys with TWITTER/OPENAI:', Object.keys(process.env).filter(k => k.toUpperCase().includes('TWITTER') || k.toUpperCase().includes('OPENAI')));
  try {
    // Get auth token from header or cookie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Only humans can earn points
    if (payload.type !== 'human') {
      return NextResponse.json(
        { success: false, error: 'Only human users can earn points' },
        { status: 403 }
      );
    }

    const userId = payload.userId;

    // Get tweet URL from request body
    const { tweetUrl } = await request.json();

    if (!tweetUrl) {
      return NextResponse.json(
        { success: false, error: 'Tweet URL is required' },
        { status: 400 }
      );
    }

    // Extract tweet ID
    const tweetId = extractTweetId(tweetUrl);
    if (!tweetId) {
      return NextResponse.json(
        { success: false, error: 'Invalid tweet URL format' },
        { status: 400 }
      );
    }

    // Get user's connected Twitter account
    const { data: userData } = await supabase
      .from('users')
      .select('twitter_id, twitter_username')
      .eq('id', userId)
      .single();

    // Require Twitter connection for submissions
    if (!userData?.twitter_username) {
      return NextResponse.json({
        success: false,
        error: 'Please connect your Twitter/X account first to submit posts',
        require_twitter: true,
      }, { status: 403 });
    }

    // Check if already submitted by this user
    const { data: existingSubmission } = await supabase
      .from('tweet_submissions')
      .select('*')
      .eq('tweet_id', tweetId)
      .eq('user_id', userId)
      .single();

    if (existingSubmission) {
      return NextResponse.json({
        success: false,
        error: 'This tweet has already been submitted',
        already_submitted: true,
        submission: existingSubmission,
      });
    }

    // Check if tweet was submitted by another user
    const { data: otherSubmission } = await supabase
      .from('tweet_submissions')
      .select('id')
      .eq('tweet_id', tweetId)
      .neq('user_id', userId)
      .single();

    if (otherSubmission) {
      return NextResponse.json({
        success: false,
        error: 'This tweet has already been submitted by another user',
        already_submitted: true,
      });
    }

    // Fetch tweet data from Twitter API
    let tweetData;
    try {
      tweetData = await fetchTweetData(tweetId);
    } catch (twitterError) {
      console.error('Twitter API error:', twitterError);
      const errorMsg = twitterError instanceof Error ? twitterError.message : 'Unknown Twitter API error';
      return NextResponse.json(
        { success: false, error: `Twitter API error: ${errorMsg}` },
        { status: 503 }
      );
    }

    if (!tweetData) {
      return NextResponse.json(
        { success: false, error: 'Could not fetch tweet data. The tweet may not exist or be private.' },
        { status: 404 }
      );
    }

    // Verify post ownership - the tweet must be from the user's connected Twitter account
    const tweetAuthorUsername = tweetData.author.username.toLowerCase();
    const userTwitterUsername = userData.twitter_username.toLowerCase();

    if (tweetAuthorUsername !== userTwitterUsername) {
      console.log('Post ownership verification failed:', {
        tweetAuthor: tweetAuthorUsername,
        connectedAccount: userTwitterUsername,
      });
      return NextResponse.json({
        success: false,
        error: `This post is from @${tweetData.author.username}, but your connected account is @${userData.twitter_username}. You can only submit your own posts.`,
        ownership_mismatch: true,
      }, { status: 403 });
    }

    // Import brand mention check
    const { containsBrandMention } = await import('@/lib/openai-scoring');

    // FIRST: Check for brand mention - if not present, DISQUALIFY entirely (0 points)
    const hasBrandMention = containsBrandMention(tweetData.tweet.text);

    let verificationScore = 0;
    let contentAlignmentScore = 0;
    let engagementScore = 0;
    let botPenalty = 0;
    let contentAnalysis = '';

    if (!hasBrandMention) {
      // No brand mention = DISQUALIFIED = 0 total points
      contentAnalysis = 'Post disqualified: Must mention Human.Farm, @humanfarm, or $HMN to earn points. No points awarded.';
    } else {
      // Calculate scores only if brand is mentioned
      // 1. Verification score (2 points if verified)
      verificationScore = tweetData.author.verified ? 2 : 0;

      // 2. Content alignment score (0-10)
      const contentResult = await scoreContent(tweetData.tweet.text);
      contentAlignmentScore = contentResult.score;
      contentAnalysis = contentResult.analysis;

      // 3. Engagement score (0-10)
      engagementScore = calculateEngagementScore({
        likes: tweetData.tweet.public_metrics.like_count,
        retweets: tweetData.tweet.public_metrics.retweet_count,
        replies: tweetData.tweet.public_metrics.reply_count,
        views: tweetData.tweet.public_metrics.impression_count,
      });

      // 4. Bot penalty
      botPenalty = detectBotActivity(tweetData.tweet, tweetData.author);
    }

    // Calculate total points (0 if no brand mention)
    const totalPoints = hasBrandMention
      ? Math.max(0, verificationScore + contentAlignmentScore + engagementScore - botPenalty)
      : 0;

    const roundedPoints = Math.round(totalPoints * 10) / 10;

    // Create submission record
    const submissionId = uuidv4();
    const submission = {
      id: submissionId,
      user_id: userId,
      tweet_id: tweetId,
      tweet_url: tweetUrl,
      tweet_content: tweetData.tweet.text,
      tweet_author_username: tweetData.author.username,
      tweet_author_verified: tweetData.author.verified,
      tweet_created_at: tweetData.tweet.created_at,
      likes_count: tweetData.tweet.public_metrics.like_count,
      retweets_count: tweetData.tweet.public_metrics.retweet_count,
      replies_count: tweetData.tweet.public_metrics.reply_count,
      views_count: tweetData.tweet.public_metrics.impression_count,
      verification_score: verificationScore,
      content_alignment_score: contentAlignmentScore,
      engagement_score: engagementScore,
      bot_penalty: botPenalty,
      total_points: roundedPoints,
      ai_analysis: contentAnalysis,
      submitted_at: new Date().toISOString(),
      status: 'scored',
    };

    // Insert submission
    const { error: insertError } = await supabase
      .from('tweet_submissions')
      .insert(submission);

    if (insertError) {
      console.error('Error inserting submission:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save submission: ' + insertError.message },
        { status: 500 }
      );
    }

    console.log('Successfully inserted submission:', { submissionId, userId, tweetId, totalPoints: roundedPoints });

    // Update or create user points
    const { data: existingPoints, error: fetchPointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('Existing points lookup:', { existingPoints, fetchPointsError });

    let newTotalPoints = roundedPoints;

    if (existingPoints) {
      // Update existing points
      newTotalPoints = (existingPoints.total_points || 0) + roundedPoints;
      const newSubmissionsCount = (existingPoints.submissions_count || 0) + 1;

      console.log('Updating user points:', {
        userId,
        oldTotal: existingPoints.total_points,
        addingPoints: roundedPoints,
        newTotal: newTotalPoints,
        newSubmissionsCount
      });

      const { data: updateData, error: updateError } = await supabase
        .from('user_points')
        .update({
          total_points: newTotalPoints,
          submissions_count: newSubmissionsCount,
          last_submission_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select();

      console.log('Update result:', { updateData, updateError });

      if (updateError) {
        console.error('Error updating points:', updateError);
      }
    } else {
      // Create new points record
      console.log('Creating new user points record for:', userId);

      const { data: createData, error: createError } = await supabase
        .from('user_points')
        .insert({
          user_id: userId,
          total_points: roundedPoints,
          submissions_count: 1,
          referral_points: 0,
          referral_count: 0,
          last_submission_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      console.log('Create result:', { createData, createError });

      if (createError) {
        console.error('Error creating points:', createError);
      }
    }

    // Distribute referral rewards up the chain (L1: 20%, L2: 15%, L3: 10%, L4: 5%)
    if (roundedPoints > 0) {
      const referralRewards = await distributeReferralRewards(userId, roundedPoints);
      if (referralRewards.length > 0) {
        console.log('Referral rewards distributed:', referralRewards);
      }
    }

    // Mark user as active poster in ActiveCampaign (for email segmentation)
    try {
      const { data: userEmail } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userEmail?.email) {
        await markAsActivePoster(userEmail.email);
      }
    } catch (acError) {
      // Don't fail submission if AC update fails
      console.error('ActiveCampaign active poster update error:', acError);
    }

    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
        score_breakdown: {
          verification: {
            score: verificationScore,
            reason: tweetData.author.verified ? 'Account is verified (+2)' : 'Account not verified',
          },
          content_alignment: {
            score: contentAlignmentScore,
            reason: contentAnalysis,
          },
          engagement: {
            score: engagementScore,
            metrics: {
              likes: tweetData.tweet.public_metrics.like_count,
              retweets: tweetData.tweet.public_metrics.retweet_count,
              replies: tweetData.tweet.public_metrics.reply_count,
              views: tweetData.tweet.public_metrics.impression_count,
            },
          },
          bot_penalty: {
            score: -botPenalty,
            reason: botPenalty > 0 ? 'Suspicious engagement patterns detected' : 'No bot activity detected',
          },
        },
        total_points: roundedPoints,
      },
      user_total_points: newTotalPoints,
    });

  } catch (error) {
    console.error('Submit tweet error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to process submission: ' + errorMessage },
      { status: 500 }
    );
  }
}
