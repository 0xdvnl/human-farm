import { supabase } from './supabase';

// Multi-level referral percentages
const REFERRAL_PERCENTAGES = {
  L1: 0.20,  // 20% for direct referrer
  L2: 0.15,  // 15% for referrer's referrer
  L3: 0.10,  // 10% for L3
  L4: 0.05,  // 5% for L4
};

interface ReferralReward {
  userId: string;
  level: number;
  percentage: number;
  points: number;
}

/**
 * Distributes referral rewards up the chain when a user earns points
 * IMPORTANT: Only verified users' points count toward referral rewards
 * @param earnerId - The user who earned the original points
 * @param pointsEarned - The amount of points earned
 * @returns Array of rewards distributed
 */
export async function distributeReferralRewards(
  earnerId: string,
  pointsEarned: number
): Promise<ReferralReward[]> {
  const rewards: ReferralReward[] = [];

  console.log(`[Referral] Starting reward distribution for earner ${earnerId}, points earned: ${pointsEarned}`);

  if (pointsEarned <= 0) {
    console.log('[Referral] No points to distribute (pointsEarned <= 0)');
    return rewards;
  }

  try {
    // Check if the earner has verified their email - only verified users count for referrals
    const { data: earnerData, error: earnerError } = await supabase
      .from('users')
      .select('email_verified')
      .eq('id', earnerId)
      .single();

    if (earnerError || !earnerData) {
      console.log(`[Referral] Could not find earner ${earnerId}`);
      return rewards;
    }

    if (!earnerData.email_verified) {
      console.log(`[Referral] Earner ${earnerId} has not verified email - no referral rewards distributed`);
      return rewards;
    }

    // Get the earner's referral chain by walking up the referred_by relationships
    let currentUserId = earnerId;
    let level = 1;

    while (level <= 4) {
      // Get who referred the current user
      const { data: userPoints, error: lookupError } = await supabase
        .from('user_points')
        .select('referred_by')
        .eq('user_id', currentUserId)
        .single();

      if (lookupError) {
        console.log(`[Referral] Error looking up user_points for ${currentUserId}:`, lookupError.message);
        break;
      }

      if (!userPoints?.referred_by) {
        // No referrer at this level, stop the chain
        console.log(`[Referral] No referrer found for ${currentUserId} at level ${level}, chain ends`);
        break;
      }

      const referrerId = userPoints.referred_by;

      // Check if the referrer has verified their email - only verified users receive rewards
      const { data: referrerUser, error: referrerUserError } = await supabase
        .from('users')
        .select('email_verified')
        .eq('id', referrerId)
        .single();

      if (referrerUserError || !referrerUser) {
        console.log(`[Referral] Could not find referrer ${referrerId}, continuing chain`);
        currentUserId = referrerId;
        level++;
        continue;
      }

      if (!referrerUser.email_verified) {
        console.log(`[Referral] L${level}: Referrer ${referrerId} has not verified email - skipping but continuing chain`);
        currentUserId = referrerId;
        level++;
        continue;
      }

      const levelKey = `L${level}` as keyof typeof REFERRAL_PERCENTAGES;
      const percentage = REFERRAL_PERCENTAGES[levelKey];
      const rewardPoints = Math.round(pointsEarned * percentage * 10) / 10;

      console.log(`[Referral] L${level}: Found verified referrer ${referrerId}, calculating ${percentage * 100}% of ${pointsEarned} = ${rewardPoints} points`);

      if (rewardPoints > 0) {
        // Update the referrer's points
        const { data: referrerPoints, error: referrerError } = await supabase
          .from('user_points')
          .select('total_points, referral_points')
          .eq('user_id', referrerId)
          .single();

        if (referrerError) {
          console.log(`[Referral] Error fetching referrer points for ${referrerId}:`, referrerError.message);
          // Create user_points record if it doesn't exist
          const { error: createError } = await supabase
            .from('user_points')
            .insert({
              user_id: referrerId,
              total_points: rewardPoints,
              submissions_count: 0,
              referral_points: rewardPoints,
              referral_count: 0,
              updated_at: new Date().toISOString(),
            });

          if (createError) {
            console.error(`[Referral] Failed to create user_points for ${referrerId}:`, createError.message);
          } else {
            console.log(`[Referral] Created user_points for ${referrerId} with ${rewardPoints} referral points`);
            rewards.push({
              userId: referrerId,
              level,
              percentage,
              points: rewardPoints,
            });
          }
        } else if (referrerPoints) {
          const newReferralPoints = (referrerPoints.referral_points || 0) + rewardPoints;
          const newTotalPoints = (referrerPoints.total_points || 0) + rewardPoints;

          const { error: updateError } = await supabase
            .from('user_points')
            .update({
              referral_points: newReferralPoints,
              total_points: newTotalPoints,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', referrerId);

          if (updateError) {
            console.error(`[Referral] Failed to update points for ${referrerId}:`, updateError.message);
          } else {
            rewards.push({
              userId: referrerId,
              level,
              percentage,
              points: rewardPoints,
            });

            console.log(`[Referral] SUCCESS L${level}: ${rewardPoints} points awarded to ${referrerId} (${percentage * 100}% of ${pointsEarned})`);
            console.log(`[Referral] ${referrerId} now has total_points: ${newTotalPoints}, referral_points: ${newReferralPoints}`);
          }
        }
      }

      // Move up the chain
      currentUserId = referrerId;
      level++;
    }
  } catch (error) {
    console.error('[Referral] Error distributing referral rewards:', error);
  }

  console.log(`[Referral] Distribution complete. Total rewards distributed: ${rewards.length}`, rewards);
  return rewards;
}

/**
 * Gets the referral chain for a user (up to 4 levels up)
 * @param userId - The user to get the chain for
 * @returns Array of user IDs in the chain [L1, L2, L3, L4]
 */
export async function getReferralChain(userId: string): Promise<string[]> {
  const chain: string[] = [];
  let currentUserId = userId;

  for (let level = 1; level <= 4; level++) {
    const { data } = await supabase
      .from('user_points')
      .select('referred_by')
      .eq('user_id', currentUserId)
      .single();

    if (!data?.referred_by) {
      break;
    }

    chain.push(data.referred_by);
    currentUserId = data.referred_by;
  }

  return chain;
}
