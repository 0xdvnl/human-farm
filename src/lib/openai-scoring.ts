import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface ContentScoreResult {
  score: number;       // 0-10
  analysis: string;    // Reasoning for the score
}

const HUMAN_FARM_USP = `
Human.Farm is a revolutionary platform where AI agents hire humans for real-world tasks.
Key value propositions and topics:
1. Agentic Future - AI agents as economic actors that need human assistance for physical tasks
2. Human-AI Collaboration - Humans working alongside AI, not being replaced by it
3. $HMN Token - The native cryptocurrency powering the Human.Farm ecosystem
4. NFT Badges - Verification and achievement badges for human workers
5. KYC Operators - Verified human operators with identity verification
6. Rankings and Reputation - Leaderboards, ratings, and trust scores
7. Real-World Tasks - Deliveries, meetings, verification, photography, etc.
8. Gig Economy Evolution - The next evolution of freelance/gig work
9. Web3 Integration - Blockchain-based payments and verification
10. Human Potential - Bullish outlook on human value in an AI-powered world
`;

const SCORING_PROMPT = `You are a content analyst for Human.Farm, a platform where AI agents hire humans for tasks.

Analyze the following tweet/post for alignment with Human.Farm's value propositions and messaging.

Human.Farm USP:
${HUMAN_FARM_USP}

SCORING CRITERIA (0-10 scale):
- 0-2: Not related to Human.Farm or AI/human collaboration topics
- 3-4: Tangentially related (mentions AI, crypto, gig economy) but doesn't specifically align
- 5-6: Moderately aligned (mentions relevant topics, positive sentiment toward human-AI collaboration)
- 7-8: Well aligned (specifically mentions Human.Farm, $HMN, or strongly promotes the core message)
- 9-10: Excellent alignment (enthusiastic promotion of Human.Farm with specific mentions of features, bullish sentiment, calls to action)

Penalize:
- Generic crypto shilling without substance (-2)
- Negative sentiment toward Human.Farm or the concept (-3)
- Spam-like content or obvious bot patterns (-2)
- Misinformation about Human.Farm (-3)

Reward:
- Specific feature mentions (+1)
- Original insights or explanations (+1)
- Engagement-driving questions or discussions (+1)
- Authentic personal experiences (+2)

Respond in JSON format:
{
  "score": <number 0-10>,
  "analysis": "<brief explanation of the score, 2-3 sentences>"
}

Tweet to analyze:
`;

/**
 * Check if tweet contains required brand mentions
 */
export function containsBrandMention(tweetText: string): boolean {
  const text = tweetText.toLowerCase();
  const brandKeywords = [
    'human.farm',
    'humanfarm',
    '@humanfarm',
    'human farm',
    '$hmn',
    'hmn token',
  ];

  return brandKeywords.some(keyword => text.includes(keyword));
}

/**
 * Score tweet content using OpenAI for alignment with Human.Farm messaging
 */
export async function scoreContent(tweetText: string): Promise<ContentScoreResult> {
  // REQUIREMENT: Posts MUST mention Human.Farm or $HMN to be eligible
  if (!containsBrandMention(tweetText)) {
    return {
      score: 0,
      analysis: 'Post disqualified: Must mention Human.Farm, @humanfarm, or $HMN to earn points.',
    };
  }

  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using fallback scoring');
    return fallbackScoring(tweetText);
  }

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a content scoring assistant. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: SCORING_PROMPT + tweetText,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content);

    return {
      score: Math.max(0, Math.min(10, Number(result.score) || 0)),
      analysis: result.analysis || 'No analysis provided',
    };
  } catch (error) {
    console.error('Error scoring content with OpenAI:', error);
    return fallbackScoring(tweetText);
  }
}

/**
 * Fallback scoring when OpenAI is unavailable
 * Uses keyword matching and sentiment analysis
 */
function fallbackScoring(tweetText: string): ContentScoreResult {
  const text = tweetText.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  // High-value keywords (direct mentions)
  const highValueKeywords = [
    'human.farm', 'humanfarm', '@humanfarm',
    '$hmn', 'hmn token',
    'agentic economy', 'agentic future',
  ];

  // Medium-value keywords (related concepts)
  const mediumValueKeywords = [
    'ai agents', 'agents hiring', 'human workers',
    'nft badge', 'kyc', 'verified human',
    'real-world tasks', 'gig economy',
    'human potential', 'human value',
  ];

  // Low-value keywords (tangentially related)
  const lowValueKeywords = [
    'ai', 'artificial intelligence',
    'web3', 'crypto', 'blockchain',
    'future of work', 'freelance',
    'decentralized', 'token',
  ];

  // Sentiment keywords
  const positiveKeywords = ['bullish', 'excited', 'amazing', 'love', 'great', '🚀', '🔥', '💪'];
  const negativeKeywords = ['scam', 'fake', 'bearish', 'dump', 'rug', 'avoid'];

  // Score calculation
  for (const keyword of highValueKeywords) {
    if (text.includes(keyword)) {
      score += 3;
      reasons.push(`Mentions ${keyword}`);
    }
  }

  for (const keyword of mediumValueKeywords) {
    if (text.includes(keyword)) {
      score += 1.5;
    }
  }

  for (const keyword of lowValueKeywords) {
    if (text.includes(keyword)) {
      score += 0.5;
    }
  }

  // Sentiment adjustment
  for (const keyword of positiveKeywords) {
    if (text.includes(keyword)) {
      score += 0.5;
    }
  }

  for (const keyword of negativeKeywords) {
    if (text.includes(keyword)) {
      score -= 2;
      reasons.push('Contains negative sentiment');
    }
  }

  // Cap and round
  score = Math.max(0, Math.min(10, Math.round(score * 10) / 10));

  // Generate analysis
  let analysis = '';
  if (score >= 7) {
    analysis = 'Strong alignment with Human.Farm messaging. Contains direct mentions or highly relevant content.';
  } else if (score >= 4) {
    analysis = 'Moderate alignment with Human.Farm themes. Contains some relevant keywords and positive sentiment.';
  } else if (score >= 1) {
    analysis = 'Low alignment. Content is tangentially related to AI or crypto topics.';
  } else {
    analysis = 'Not aligned with Human.Farm messaging. No relevant keywords or themes detected.';
  }

  return { score, analysis };
}

/**
 * Calculate engagement score based on metrics
 * Returns a score from 0-10 based on engagement quality
 *
 * Views are now a significant factor - more views = more reach = more points
 */
export function calculateEngagementScore(metrics: {
  likes: number;
  retweets: number;
  replies: number;
  views: number;
}): number {
  const { likes, retweets, replies, views } = metrics;

  // Engagement rate calculation
  const totalEngagements = likes + retweets * 2 + replies * 3; // Weight replies highest
  const engagementRate = views > 0 ? totalEngagements / views : 0;

  // Score tiers based on absolute numbers and engagement rate
  let score = 0;

  // Base score from absolute engagement
  if (likes >= 1000) score += 2.5;
  else if (likes >= 100) score += 1.5;
  else if (likes >= 10) score += 0.75;
  else if (likes >= 1) score += 0.25;

  if (retweets >= 500) score += 1.5;
  else if (retweets >= 50) score += 1;
  else if (retweets >= 5) score += 0.5;
  else if (retweets >= 1) score += 0.25;

  if (replies >= 100) score += 1.5;
  else if (replies >= 20) score += 1;
  else if (replies >= 5) score += 0.5;
  else if (replies >= 1) score += 0.25;

  // Bonus for good engagement rate (quality over quantity)
  if (engagementRate > 0.1) score += 1.5;
  else if (engagementRate > 0.05) score += 1;
  else if (engagementRate > 0.02) score += 0.5;
  else if (engagementRate > 0.01) score += 0.25;

  // VIEWS/REACH SCORING - Now more significant
  // Views represent reach/impressions which is valuable for brand awareness
  if (views >= 1000000) score += 3;        // 1M+ views
  else if (views >= 500000) score += 2.5;  // 500k+ views
  else if (views >= 100000) score += 2;    // 100k+ views
  else if (views >= 50000) score += 1.5;   // 50k+ views
  else if (views >= 10000) score += 1;     // 10k+ views
  else if (views >= 5000) score += 0.75;   // 5k+ views
  else if (views >= 1000) score += 0.5;    // 1k+ views
  else if (views >= 500) score += 0.25;    // 500+ views
  else if (views >= 100) score += 0.1;     // 100+ views

  return Math.min(10, Math.round(score * 10) / 10);
}
