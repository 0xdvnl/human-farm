'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// Types for API responses
interface ScoreBreakdown {
  verification: { score: number; reason: string };
  content_alignment: { score: number; reason: string };
  engagement: {
    score: number;
    metrics: { likes: number; retweets: number; replies: number; views: number };
  };
  bot_penalty: { score: number; reason: string };
}

interface SubmissionResult {
  id: string;
  tweet_content: string;
  total_points: number;
  score_breakdown: ScoreBreakdown;
}

interface UserStats {
  total_points: number;
  submissions_count: number;
  referral_points: number;
  referral_count: number;
  avg_content_score: number;
  avg_engagement_score: number;
}

interface RecentSubmission {
  id: string;
  tweet_url: string;
  tweet_content: string;
  total_points: number;
  submitted_at: string;
  score_breakdown: {
    verification: number;
    content: number;
    engagement: number;
    bot_penalty: number;
  };
}

// Hexagon SVG component
const HexIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} style={{ width: size, height: size }}>
    <path d="M16 4L27 10.5V23.5L16 30L5 23.5V10.5L16 4Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
  </svg>
);

// Logo component
const Logo = ({ light = false }: { light?: boolean }) => (
  <Link href="/" className="flex items-center gap-2.5">
    <div className="w-6 h-6">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M16 2L28.66 9.5V24.5L16 32L3.34 24.5V9.5L16 2Z" stroke={light ? '#F2EDE5' : '#A0614E'} strokeWidth="1.5" fill="none" opacity="0.7"/>
        <path d="M16 7L24.66 12V22L16 27L7.34 22V12L16 7Z" stroke={light ? '#F2EDE5' : '#A0614E'} strokeWidth="1" fill="none" opacity="0.3"/>
      </svg>
    </div>
    <span className={`font-mono text-[15px] font-bold tracking-tight ${light ? 'text-cream' : 'text-terra'}`}>
      human.farm
    </span>
  </Link>
);

// Animated counter component
const AnimatedCounter = ({ target, duration = 2000 }: { target: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

// FAQ Item component
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border border-cream/20 rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'bg-dark-surface/50' : 'bg-dark-surface/30 hover:bg-dark-surface/40'}`}>
      <button
        className="w-full flex justify-between items-center p-5 text-left gap-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-cream font-medium">{question}</span>
        <span className={`text-cyan text-2xl font-light transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 pb-5 px-5' : 'max-h-0'}`}>
        <p className="text-cream/60 text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

// Loading Modal Component
const LoadingModal = ({ isOpen, status }: { isOpen: boolean; status: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/90 backdrop-blur-sm">
      <div className="bg-dark-surface border border-cream/20 rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-16 h-16 mx-auto mb-6 relative">
          <div className="absolute inset-0 rounded-full border-2 border-cyan/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan animate-spin" />
          <div className="absolute inset-2 rounded-full border border-gold/20" />
          <div className="absolute inset-2 rounded-full border border-transparent border-t-gold animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <HexIcon size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-cream mb-2">Analyzing Your Post</h3>
        <p className="text-cream/50 text-sm mb-4">{status}</p>
        <div className="flex justify-center gap-1">
          <span className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

// Results Modal Component
const ResultsModal = ({
  isOpen,
  onClose,
  result,
  userTotalPoints,
}: {
  isOpen: boolean;
  onClose: () => void;
  result: SubmissionResult | null;
  userTotalPoints: number;
}) => {
  if (!isOpen || !result) return null;

  const { score_breakdown } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/90 backdrop-blur-sm p-4">
      <div className="bg-dark-surface border border-cream/20 rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan/20 to-gold/20 flex items-center justify-center">
            <span className="text-4xl font-bold text-cyan">+{result.total_points.toFixed(1)}</span>
          </div>
          <h3 className="text-xl font-semibold text-cream mb-1">Points Earned!</h3>
          <p className="text-cream/50 text-sm">Your total: {userTotalPoints.toFixed(1)} points</p>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3 mb-6">
          {/* Verification */}
          <div className="bg-dark/50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-cream/70 text-sm">Account Verification</span>
              <span className={`font-semibold ${score_breakdown.verification.score > 0 ? 'text-cyan' : 'text-cream/40'}`}>
                +{score_breakdown.verification.score}
              </span>
            </div>
            <p className="text-xs text-cream/40">{score_breakdown.verification.reason}</p>
          </div>

          {/* Content Alignment */}
          <div className="bg-dark/50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-cream/70 text-sm">Content Alignment</span>
              <span className="font-semibold text-gold">+{score_breakdown.content_alignment.score.toFixed(1)}</span>
            </div>
            <p className="text-xs text-cream/40">{score_breakdown.content_alignment.reason}</p>
          </div>

          {/* Engagement */}
          <div className="bg-dark/50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-cream/70 text-sm">Engagement Score</span>
              <span className="font-semibold text-terra">+{score_breakdown.engagement.score.toFixed(1)}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="text-center">
                <div className="text-xs text-cream/60">{score_breakdown.engagement.metrics.likes.toLocaleString()}</div>
                <div className="text-[10px] text-cream/30">likes</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-cream/60">{score_breakdown.engagement.metrics.retweets.toLocaleString()}</div>
                <div className="text-[10px] text-cream/30">retweets</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-cream/60">{score_breakdown.engagement.metrics.replies.toLocaleString()}</div>
                <div className="text-[10px] text-cream/30">replies</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-cream/60">{score_breakdown.engagement.metrics.views.toLocaleString()}</div>
                <div className="text-[10px] text-cream/30">views</div>
              </div>
            </div>
          </div>

          {/* Bot Penalty */}
          {score_breakdown.bot_penalty.score < 0 && (
            <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-red-400/70 text-sm">Bot Detection Penalty</span>
                <span className="font-semibold text-red-400">{score_breakdown.bot_penalty.score}</span>
              </div>
              <p className="text-xs text-red-400/40">{score_breakdown.bot_penalty.reason}</p>
            </div>
          )}
        </div>

        {/* Tweet Preview */}
        <div className="bg-dark/30 rounded-xl p-4 mb-6 border border-cream/10">
          <p className="text-cream/60 text-sm line-clamp-3">{result.tweet_content}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-semibold text-dark bg-gradient-to-r from-cyan to-cyan/80 hover:shadow-lg hover:shadow-cyan/30 transition-all duration-300"
        >
          Continue Earning
        </button>
      </div>
    </div>
  );
};

export default function EarnPage() {
  const [postUrl, setPostUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Results modal state
  const [showResults, setShowResults] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [userTotalPoints, setUserTotalPoints] = useState(0);

  // User stats
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [leaderboardPosition, setLeaderboardPosition] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Twitter connection
  const [twitterConnected, setTwitterConnected] = useState(false);
  const [twitterUsername, setTwitterUsername] = useState<string | null>(null);

  // Follow @humanfarmai requirement
  const [followsHumanFarm, setFollowsHumanFarm] = useState(false);
  const [checkingFollow, setCheckingFollow] = useState(false);

  // Email verification
  const [emailVerified, setEmailVerified] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Public stats (for the global counters)
  const [publicStats, setPublicStats] = useState({
    total_points_distributed: 0,
    posts_scored: 0,
    contributors: 0,
  });

  // Fetch public stats on mount (no auth required)
  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const res = await fetch('/api/stats/public');
        const data = await res.json();
        if (data.success) {
          setPublicStats({
            total_points_distributed: data.data.total_points_distributed || 0,
            posts_scored: data.data.posts_scored || 0,
            contributors: data.data.contributors || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch public stats:', err);
      }
    };
    fetchPublicStats();
  }, []);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check localStorage for token - using the same key as the login page
        const token = localStorage.getItem('human-farm-token');
        if (token) {
          setAuthToken(token);
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch user stats when logged in
  const fetchStats = useCallback(async () => {
    if (!authToken) return;

    try {
      const response = await fetch('/api/earn/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
        setRecentSubmissions(data.data.recent_submissions || []);
        setLeaderboardPosition(data.data.leaderboard_position);
        setUserTotalPoints(data.data.stats.total_points);
        setReferralCode(data.data.referral_code);
        setTwitterConnected(data.data.twitter_connected || false);
        setTwitterUsername(data.data.twitter_username || null);
        setFollowsHumanFarm(data.data.follows_humanfarm || false);
        setEmailVerified(data.data.email_verified || false);
        setUserEmail(data.data.email || null);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [authToken]);

  useEffect(() => {
    if (isLoggedIn && authToken) {
      fetchStats();
    }
  }, [isLoggedIn, authToken, fetchStats]);

  // Scroll reveal animations - content is visible by default, animations are progressive enhancement
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    // Add will-animate class to enable animation, then set up observer
    elements.forEach((el) => el.classList.add('will-animate'));

    // Small delay to allow CSS to apply before observing
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
      );

      elements.forEach((el) => observer.observe(el));
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (!postUrl || !isLoggedIn || !authToken) return;

    setIsSubmitting(true);
    setError(null);
    setLoadingStatus('Fetching tweet data...');

    try {
      // Simulate loading stages
      setTimeout(() => setLoadingStatus('Analyzing content alignment...'), 1000);
      setTimeout(() => setLoadingStatus('Calculating engagement score...'), 2000);
      setTimeout(() => setLoadingStatus('Detecting bot activity...'), 3000);

      const response = await fetch('/api/earn/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ tweetUrl: postUrl }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmissionResult(data.submission);
        setUserTotalPoints(data.user_total_points);
        setShowResults(true);
        setPostUrl('');
        // Refresh stats
        fetchStats();
      } else {
        if (data.already_submitted) {
          setError('This tweet has already been submitted.');
        } else {
          setError(data.error || 'Failed to submit tweet');
        }
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to process submission. Please try again.');
    } finally {
      setIsSubmitting(false);
      setLoadingStatus('');
    }
  };

  const closeResults = () => {
    setShowResults(false);
    setSubmissionResult(null);
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!authToken || resendingVerification) return;

    setResendingVerification(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setError(null);
        alert('Verification email sent! Check your inbox.');
      } else {
        setError(data.error || 'Failed to send verification email');
      }
    } catch (err) {
      console.error('Resend verification error:', err);
      setError('Failed to send verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  // Check if user follows @humanfarmai
  const handleCheckFollow = async () => {
    if (!authToken || checkingFollow) return;

    setCheckingFollow(true);
    setError(null);

    try {
      const response = await fetch('/api/twitter/check-follow', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        if (data.follows) {
          setFollowsHumanFarm(true);
        } else {
          setError('It looks like you haven\'t followed @humanfarmai yet. Please follow and try again.');
        }
      } else {
        setError(data.error || 'Failed to verify follow status');
      }
    } catch (err) {
      console.error('Check follow error:', err);
      setError('Failed to verify follow status. Please try again.');
    } finally {
      setCheckingFollow(false);
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-cyan/20 border-t-cyan animate-spin" />
          <p className="text-cream/50">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Loading Modal */}
      <LoadingModal isOpen={isSubmitting} status={loadingStatus} />

      {/* Results Modal */}
      <ResultsModal
        isOpen={showResults}
        onClose={closeResults}
        result={submissionResult}
        userTotalPoints={userTotalPoints}
      />

      {/* Email Verification Banner */}
      {isLoggedIn && !emailVerified && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-terra/90 to-gold/90 text-dark py-2.5 px-4">
          <div className="max-w-[1140px] mx-auto flex items-center justify-center gap-3 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
            <span className="font-medium">
              Please verify your email to activate your account
            </span>
            <button
              onClick={handleResendVerification}
              disabled={resendingVerification}
              className="ml-2 px-3 py-1 bg-dark/20 hover:bg-dark/30 rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {resendingVerification ? 'Sending...' : 'Resend Email'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`fixed left-0 right-0 z-50 bg-dark/90 backdrop-blur-sm border-b border-cream/10 ${isLoggedIn && !emailVerified ? 'top-10' : 'top-0'}`}>
        <div className="max-w-[1140px] mx-auto px-5 sm:px-10 flex justify-between items-center h-14">
          <Logo light />
          <ul className="flex gap-4 sm:gap-7 items-center">
            <Link href="/earn" className="text-sm text-cyan font-medium hidden sm:block">
              Amplify
            </Link>
            <Link href="/grow" className="text-sm text-cream/75 hover:text-cream transition-colors hidden sm:block">
              Grow
            </Link>
            <Link href="/mcp" className="text-sm text-cream/75 hover:text-cream transition-colors hidden sm:block">
              MCP
            </Link>
            <Link href="/token" className="text-sm text-cream/75 hover:text-cream transition-colors hidden sm:block">
              Token
            </Link>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-5 py-1.5 bg-cyan text-dark rounded-full font-semibold text-[13px] hover:bg-cyan/90 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan/20"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/register"
                className="px-5 py-1.5 bg-cyan text-dark rounded-full font-semibold text-[13px] hover:bg-cyan/90 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan/20"
              >
                Apply Now
              </Link>
            )}
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-14">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-deep to-dark" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/images/amplify/amplify-hero-bckg.jpg')" }}
        />

        {/* Animated hexagon grid */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[5%] animate-hex-float opacity-10" style={{ animationDelay: '0s' }}>
            <HexIcon size={80} className="text-cyan" />
          </div>
          <div className="absolute top-[30%] right-[10%] animate-hex-float opacity-15" style={{ animationDelay: '1s' }}>
            <HexIcon size={60} className="text-gold" />
          </div>
          <div className="absolute bottom-[20%] left-[15%] animate-hex-float opacity-10" style={{ animationDelay: '2s' }}>
            <HexIcon size={100} className="text-cyan" />
          </div>
          <div className="absolute top-[50%] right-[5%] animate-hex-float opacity-20" style={{ animationDelay: '0.5s' }}>
            <HexIcon size={40} className="text-terra" />
          </div>
          <div className="absolute top-[15%] right-[25%] animate-hex-float opacity-8" style={{ animationDelay: '1.5s' }}>
            <HexIcon size={50} className="text-cyan" />
          </div>
          <div className="absolute bottom-[30%] right-[20%] animate-hex-float opacity-12" style={{ animationDelay: '0.8s' }}>
            <HexIcon size={70} className="text-gold" />
          </div>
          <div className="absolute top-[60%] left-[8%] animate-hex-float opacity-8" style={{ animationDelay: '2.5s' }}>
            <HexIcon size={35} className="text-terra" />
          </div>
          <div className="absolute bottom-[10%] left-[30%] animate-hex-float opacity-10" style={{ animationDelay: '1.8s' }}>
            <HexIcon size={55} className="text-cyan" />
          </div>
        </div>

        {/* Glowing orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-cyan/10 via-transparent to-transparent blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative z-10 max-w-[900px] mx-auto px-5 sm:px-10 py-20 text-center">
          <div className="reveal-scale inline-flex items-center gap-2 px-4 py-2 mb-8 border border-cyan/30 rounded-full text-cyan text-sm font-mono animate-glow-pulse">
            <span className="w-2 h-2 bg-cyan rounded-full animate-pulse" />
            Amplify • Earn FARM Points
          </div>

          <h1 className="reveal text-4xl sm:text-6xl lg:text-7xl font-bold text-cream leading-tight mb-6">
            Post. Submit.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan via-gold to-terra">Earn.</span>
          </h1>

          <p className="reveal text-lg sm:text-xl text-cream/60 mb-10 max-w-xl mx-auto">
            Turn your content into FARM points. Every post about human.farm has value — our AI scores it, and you get rewarded instantly.
          </p>

          {/* Stats row */}
          <div className="reveal flex flex-wrap justify-center gap-8 sm:gap-12 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <img src="/images/points-icon.png" alt="FARM Points" className="w-8 h-8 object-contain" />
                <span className="text-3xl sm:text-4xl font-bold text-cyan">
                  <AnimatedCounter target={publicStats.total_points_distributed} />
                </span>
              </div>
              <div className="text-sm text-cream/50 font-mono">Points Distributed</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-gold mb-1">
                <AnimatedCounter target={publicStats.posts_scored} />
              </div>
              <div className="text-sm text-cream/50 font-mono">Posts Scored</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-terra mb-1">
                <AnimatedCounter target={publicStats.contributors} />
              </div>
              <div className="text-sm text-cream/50 font-mono">Contributors</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle">
          <div className="w-6 h-10 rounded-full border-2 border-cream/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-cyan/70 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-24 relative">
        <div className="max-w-[1140px] mx-auto px-5 sm:px-10">
          <div className="reveal-left text-cyan font-mono text-sm tracking-wider mb-4">
            How it works
          </div>
          <h2 className="reveal-left text-3xl sm:text-4xl font-bold text-cream mb-12">
            Three steps. Real points.
          </h2>

          <div className="grid md:grid-cols-3 gap-px bg-cream/10 rounded-2xl overflow-hidden">
            {/* Step 1: Post on X */}
            <div className="reveal-scale bg-dark-surface p-8 group hover:bg-dark-surface/80 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-cyan/50 font-mono text-xs tracking-wider">STEP 01</span>
                <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center group-hover:bg-cyan/20 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-6 h-6 text-cyan" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-cream mb-3 group-hover:text-cyan transition-colors duration-300">
                Post on X
              </h3>
              <p className="text-cream/50 text-sm leading-relaxed">
                Write about human.farm — your take, your angle, your voice. Original content only.
              </p>
            </div>

            {/* Step 2: Submit the link */}
            <div className="reveal-scale bg-dark-surface p-8 group hover:bg-dark-surface/80 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-cyan/50 font-mono text-xs tracking-wider">STEP 02</span>
                <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center group-hover:bg-cyan/20 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-6 h-6 text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-cream mb-3 group-hover:text-cyan transition-colors duration-300">
                Submit the link
              </h3>
              <p className="text-cream/50 text-sm leading-relaxed">
                Paste your post URL below. Our AI evaluates quality, reach, and account credibility in minutes.
              </p>
            </div>

            {/* Step 3: Receive FARM points */}
            <div className="reveal-scale bg-dark-surface p-8 group hover:bg-dark-surface/80 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-cyan/50 font-mono text-xs tracking-wider">STEP 03</span>
                <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center group-hover:bg-cyan/20 group-hover:scale-110 transition-all duration-300">
                  <HexIcon size={24} className="text-cyan" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-cream mb-3 group-hover:text-cyan transition-colors duration-300">
                Receive FARM points
              </h3>
              <p className="text-cream/50 text-sm leading-relaxed">
                Points are awarded based on your score. Higher quality, higher reach — higher reward.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Submit Post Section */}
      <section id="submit" className="py-20 sm:py-24 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-gradient-radial from-cyan/5 via-transparent to-transparent blur-3xl" />

        {/* Floating hexagons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[15%] left-[10%] animate-hex-float opacity-5" style={{ animationDelay: '0.3s' }}>
            <HexIcon size={60} className="text-cyan" />
          </div>
          <div className="absolute bottom-[20%] right-[8%] animate-hex-float opacity-5" style={{ animationDelay: '1.2s' }}>
            <HexIcon size={80} className="text-gold" />
          </div>
          <div className="absolute top-[40%] right-[15%] animate-hex-float opacity-4" style={{ animationDelay: '2s' }}>
            <HexIcon size={40} className="text-terra" />
          </div>
        </div>

        <div className="max-w-[600px] mx-auto px-5 sm:px-10 text-center relative z-10">
          <div className="reveal-scale text-cyan font-mono text-sm tracking-wider mb-4">
            Submit your post
          </div>
          <h2 className="reveal text-3xl sm:text-4xl font-bold text-cream mb-4">
            Paste. Score. Earn.
          </h2>
          <p className="reveal text-cream/50 mb-10">
            Paste your X post link below. You'll see your score and points within minutes.
          </p>

          <div className="reveal-scale space-y-4">
            {/* Error message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Twitter connection status */}
            {isLoggedIn && twitterConnected && followsHumanFarm && (
              <div className="flex items-center justify-center gap-2 text-sm text-cream/60 mb-2">
                <svg className="w-4 h-4 text-cyan" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Connected as <span className="text-cyan">@{twitterUsername}</span></span>
              </div>
            )}

            {isLoggedIn && !twitterConnected ? (
              /* Step 1: Show Connect Twitter button if logged in but Twitter not connected */
              <div className="space-y-4">
                <div className="bg-dark-surface/50 border border-cream/10 rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="w-8 h-8 rounded-full bg-cyan/20 text-cyan text-sm font-bold flex items-center justify-center">1</span>
                    <div className="w-12 h-0.5 bg-cream/20" />
                    <span className="w-8 h-8 rounded-full bg-cream/10 text-cream/40 text-sm font-bold flex items-center justify-center">2</span>
                    <div className="w-12 h-0.5 bg-cream/20" />
                    <span className="w-8 h-8 rounded-full bg-cream/10 text-cream/40 text-sm font-bold flex items-center justify-center">3</span>
                  </div>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-cream mb-2">Step 1: Connect your X account</h3>
                  <p className="text-cream/50 text-sm mb-4">
                    Link your X/Twitter account to verify ownership of your posts.
                  </p>
                  <a
                    href={`/api/auth/twitter?token=${authToken}`}
                    className="inline-block px-8 py-3 rounded-xl font-semibold text-white bg-[#1DA1F2] hover:bg-[#1a8cd8] transition-all duration-300 hover:shadow-lg hover:shadow-[#1DA1F2]/30"
                  >
                    Connect X Account
                  </a>
                </div>
              </div>
            ) : isLoggedIn && twitterConnected && !followsHumanFarm ? (
              /* Step 2: Show Follow @humanfarmai requirement */
              <div className="space-y-4">
                <div className="bg-dark-surface/50 border border-cream/10 rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 text-sm font-bold flex items-center justify-center">✓</span>
                    <div className="w-12 h-0.5 bg-cyan/50" />
                    <span className="w-8 h-8 rounded-full bg-cyan/20 text-cyan text-sm font-bold flex items-center justify-center">2</span>
                    <div className="w-12 h-0.5 bg-cream/20" />
                    <span className="w-8 h-8 rounded-full bg-cream/10 text-cream/40 text-sm font-bold flex items-center justify-center">3</span>
                  </div>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="8.5" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="20" y1="8" x2="20" y2="14" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="23" y1="11" x2="17" y2="11" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-cream mb-2">Step 2: Follow @humanfarmai</h3>
                  <p className="text-cream/50 text-sm mb-2">
                    Connected as <span className="text-cyan">@{twitterUsername}</span>
                  </p>
                  <p className="text-cream/50 text-sm mb-4">
                    Follow our official X account to stay updated and unlock post submissions.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href="https://x.com/humanfarmai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#1DA1F2] hover:bg-[#1a8cd8] transition-all duration-300 hover:shadow-lg hover:shadow-[#1DA1F2]/30"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Follow @humanfarmai
                    </a>
                    <button
                      onClick={handleCheckFollow}
                      disabled={checkingFollow}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-cyan border-2 border-cyan/50 hover:border-cyan hover:bg-cyan/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {checkingFollow ? (
                        <>
                          <span className="w-4 h-4 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          I've Followed
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Step 3: Show submit form if all requirements are met */
              <>
                {isLoggedIn && twitterConnected && followsHumanFarm && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 text-sm font-bold flex items-center justify-center">✓</span>
                    <div className="w-12 h-0.5 bg-green-500/50" />
                    <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 text-sm font-bold flex items-center justify-center">✓</span>
                    <div className="w-12 h-0.5 bg-cyan/50" />
                    <span className="w-8 h-8 rounded-full bg-cyan/20 text-cyan text-sm font-bold flex items-center justify-center">3</span>
                  </div>
                )}
                <div className="relative group">
                  <input
                    type="text"
                    value={postUrl}
                    onChange={(e) => {
                      setPostUrl(e.target.value);
                      setError(null);
                    }}
                    placeholder={isLoggedIn ? "https://x.com/yourpost" : "Sign in to submit posts"}
                    disabled={!isLoggedIn || isSubmitting}
                    className={`w-full px-6 py-4 bg-dark-surface border-2 rounded-xl text-cream font-mono text-sm text-center placeholder:text-cream/30 focus:outline-none transition-all duration-300 ${
                      isLoggedIn && !isSubmitting
                        ? 'border-cream/20 focus:border-cyan group-hover:border-cream/30'
                        : 'border-cream/10 cursor-not-allowed opacity-60'
                    }`}
                  />
                  {isLoggedIn && !isSubmitting && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan/0 via-cyan/5 to-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  )}
                </div>

                {isLoggedIn ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !postUrl}
                    className={`w-full py-4 rounded-xl font-semibold text-dark transition-all duration-300 ${
                      isSubmitting || !postUrl
                        ? 'bg-cream/30 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan to-cyan/80 hover:shadow-lg hover:shadow-cyan/30 hover:-translate-y-0.5'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                        Analyzing...
                      </span>
                    ) : (
                      'Submit Post'
                    )}
                  </button>
                ) : (
                  <Link
                    href="/auth/register"
                    className="block w-full py-4 rounded-xl font-semibold text-dark bg-gradient-to-r from-cyan to-cyan/80 hover:shadow-lg hover:shadow-cyan/30 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Sign Up to Submit
                  </Link>
                )}
              </>
            )}
          </div>

          <p className="reveal mt-6 text-cream/30 text-xs font-mono tracking-wide">
            Scored by AI — quality · reach · account verification · originality
          </p>

          {/* Timing guidance */}
          <div className="reveal mt-4 bg-gold/5 border border-gold/20 rounded-xl p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div>
                <p className="text-gold/90 text-sm font-medium mb-1">Pro tip: Wait before verifying</p>
                <p className="text-cream/50 text-xs leading-relaxed">
                  Points are calculated at submission time based on current engagement. For maximum rewards, wait 12-24 hours after posting to let your content gain views, likes, and replies before submitting.
                </p>
              </div>
            </div>
          </div>

          {/* Score preview cards */}
          <div className="reveal mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Verified', value: '—', color: 'cyan', desc: '+2 if verified' },
              { label: 'Content', value: '—', color: 'gold', desc: '0-10 alignment' },
              { label: 'Engagement', value: '—', color: 'terra', desc: '0-10 based on reach' },
              { label: 'Total', value: '—', color: 'cream', desc: 'Final points' },
            ].map((item) => (
              <div key={item.label} className="bg-dark-surface/50 rounded-xl p-4 border border-cream/10">
                <div className={`text-2xl font-bold text-${item.color} mb-1`}>{item.value}</div>
                <div className="text-xs text-cream/40 font-mono">{item.label}</div>
                <div className="text-[10px] text-cream/25 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Your Stats Section - Dashboard (moved below Submit) */}
      <section className="py-16 sm:py-20 bg-dark-deep relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark to-dark-deep" />

        <div className="max-w-[1000px] mx-auto px-5 sm:px-10 relative z-10">
          <div className="reveal text-center mb-10">
            <div className="text-cyan font-mono text-sm tracking-wider mb-3">Your Dashboard</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-cream">Track your progress</h2>
          </div>

          {isLoggedIn ? (
            /* Logged in state - show actual stats */
            <div className="reveal grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-dark-surface rounded-2xl p-6 border border-cream/10 group hover:border-cyan/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center group-hover:bg-cyan/20 transition-colors">
                    <img src="/images/points-icon.png" alt="" className="w-6 h-6" />
                  </div>
                  <span className="text-cream/50 text-sm font-mono">Total Points</span>
                </div>
                <div className="text-3xl font-bold text-cyan">{stats?.total_points.toFixed(1) || '0'}</div>
                <div className="text-xs text-cream/30 mt-1">
                  {stats?.referral_points ? `+${stats.referral_points.toFixed(1)} from referrals` : 'Start earning!'}
                </div>
              </div>

              <div className="bg-dark-surface rounded-2xl p-6 border border-cream/10 group hover:border-gold/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                    <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round"/>
                      <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round"/>
                      <polyline points="10,9 9,9 8,9" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-cream/50 text-sm font-mono">Posts Submitted</span>
                </div>
                <div className="text-3xl font-bold text-gold">{stats?.submissions_count || 0}</div>
                <div className="text-xs text-cream/30 mt-1">
                  Avg score: {stats?.avg_content_score.toFixed(1) || '—'}/10
                </div>
              </div>

              <div className="bg-dark-surface rounded-2xl p-6 border border-cream/10 group hover:border-terra/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-terra/10 flex items-center justify-center group-hover:bg-terra/20 transition-colors">
                    <svg className="w-5 h-5 text-terra" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-cream/50 text-sm font-mono">Referrals</span>
                </div>
                <div className="text-3xl font-bold text-terra">{stats?.referral_count || 0}</div>
                <div className="text-xs text-cream/30 mt-1">
                  <Link href="/grow" className="hover:text-terra transition-colors">Grow your network →</Link>
                </div>
              </div>

              <div className="bg-dark-surface rounded-2xl p-6 border border-cream/10 group hover:border-cream/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cream/10 flex items-center justify-center group-hover:bg-cream/20 transition-colors">
                    <svg className="w-5 h-5 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-cream/50 text-sm font-mono">Network Rank</span>
                </div>
                <div className="text-3xl font-bold text-cream">
                  {leaderboardPosition ? `#${leaderboardPosition}` : '—'}
                </div>
                <div className="text-xs text-cream/30 mt-1">Keep earning to climb!</div>
              </div>
            </div>
          ) : (
            /* Logged out state - show sign up prompt */
            <div className="reveal bg-dark-surface/50 rounded-2xl p-8 sm:p-12 border border-cream/10 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cyan/10 flex items-center justify-center">
                <HexIcon size={32} className="text-cyan" />
              </div>
              <h3 className="text-xl font-semibold text-cream mb-3">Sign up to start earning</h3>
              <p className="text-cream/50 mb-6 max-w-md mx-auto">
                Create an account to track your points, submit posts, and get your unique referral link.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/register" className="btn btn-cyan-glow">
                  Create Account
                </Link>
                <Link href="/auth/login" className="btn btn-outline-cyan">
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Recent Submissions - only show if logged in and has submissions */}
          {isLoggedIn && recentSubmissions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-cream mb-4">Recent Submissions</h3>
              <div className="space-y-3">
                {recentSubmissions.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="bg-dark-surface/50 rounded-xl p-4 border border-cream/10 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-cream/70 text-sm truncate">{sub.tweet_content}</p>
                      <p className="text-cream/30 text-xs mt-1">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-cyan font-semibold">+{sub.total_points.toFixed(1)}</div>
                      <div className="text-cream/30 text-xs">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Points Leaderboard Section */}
      <section className="py-16 sm:py-20 relative">
        <div className="max-w-[700px] mx-auto px-5 sm:px-10">
          <div className="text-center mb-10">
            <div className="reveal-scale text-cyan font-mono text-sm tracking-wider mb-3">
              Points leaderboard
            </div>
            <h2 className="reveal text-2xl sm:text-3xl font-bold text-cream mb-3">
              Top amplifiers
            </h2>
            <p className="reveal text-cream/50 text-sm max-w-lg mx-auto">
              Ranked by total FARM points earned. Quality content rises to the top.
            </p>
          </div>

          {/* Tier indicators */}
          <div className="reveal flex justify-center gap-4 mb-6 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gold" />
              <span className="text-cream/60">Top 1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cream/50" />
              <span className="text-cream/60">Top 3</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan/50" />
              <span className="text-cream/60">Top 10</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cream/20" />
              <span className="text-cream/60">Top 50</span>
            </div>
          </div>

          {/* Scrollable Leaderboard */}
          <div className="reveal-scale bg-dark-surface/30 rounded-2xl border border-cream/10 overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto space-y-1.5 p-3">
              {[
                { rank: 1, username: 'content_king', total_points: 145230, posts: 156 },
                { rank: 2, username: 'viral_writer', total_points: 128750, posts: 134 },
                { rank: 3, username: 'alpha_poster', total_points: 97320, posts: 98 },
                { rank: 4, username: 'thread_master', total_points: 82150, posts: 87 },
                { rank: 5, username: 'ai_evangelist', total_points: 75890, posts: 76 },
                { rank: 6, username: 'crypto_scribe', total_points: 68420, posts: 71 },
                { rank: 7, username: 'farm_contributor', total_points: 59730, posts: 63 },
                { rank: 8, username: 'network_voice', total_points: 53250, posts: 56 },
                { rank: 9, username: 'early_adopter', total_points: 48960, posts: 52 },
                { rank: 10, username: 'quality_poster', total_points: 42450, posts: 45 },
                { rank: 11, username: 'daily_grinder', total_points: 37830, posts: 41 },
                { rank: 12, username: 'engagement_pro', total_points: 33560, posts: 36 },
              ].map((entry) => {
                const getHighlight = (rank: number) => {
                  if (rank === 1) return 'bg-gradient-to-r from-gold/20 to-transparent border-l-4 border-gold';
                  if (rank === 2 || rank === 3) return 'bg-gradient-to-r from-cream/10 to-transparent border-l-4 border-cream/50';
                  if (rank <= 10) return 'bg-cyan/5 border-l-2 border-cyan/30';
                  return 'bg-dark-surface/30 border-l-2 border-cream/10';
                };

                const getRankDisplay = (rank: number) => {
                  if (rank === 1) return <img src="/images/grow/leaderboard-1st.png" alt="1st" className="w-8 h-8 object-contain" />;
                  if (rank === 2) return <img src="/images/grow/leaderboard-2nd.png" alt="2nd" className="w-8 h-8 object-contain" />;
                  if (rank === 3) return <img src="/images/grow/leaderboard-3rd.png" alt="3rd" className="w-8 h-8 object-contain" />;
                  return <span className={`font-mono text-sm ${rank <= 10 ? 'text-cyan' : 'text-cream/40'}`}>#{rank}</span>;
                };

                return (
                  <div key={entry.rank} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${getHighlight(entry.rank)}`}>
                    <div className="w-10 text-center">{getRankDisplay(entry.rank)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-cream">{entry.username}</div>
                      <div className="text-[10px] text-cream/40">{entry.posts} posts</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-cyan">{entry.total_points.toLocaleString()}</div>
                      <div className="text-[10px] text-cream/40">points</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isLoggedIn && (
            <div className="reveal mt-4 text-center">
              <Link href="/auth/register" className="text-sm text-cyan hover:text-cyan/80 transition-colors">
                Sign up to see your position →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 sm:py-24 bg-gradient-to-b from-dark to-dark-deep relative overflow-hidden">
        {/* Decorative hexagons */}
        <div className="absolute top-10 left-10 animate-hex-float opacity-5">
          <HexIcon size={120} className="text-cyan" />
        </div>
        <div className="absolute bottom-10 right-10 animate-hex-float opacity-5" style={{ animationDelay: '1s' }}>
          <HexIcon size={80} className="text-gold" />
        </div>

        <div className="max-w-[600px] mx-auto px-5 sm:px-10 text-center relative z-10">
          <div className="reveal-scale mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan/20 to-gold/20 flex items-center justify-center animate-glow-pulse">
              <HexIcon size={40} className="text-cyan" />
            </div>
          </div>

          <h2 className="reveal text-3xl sm:text-4xl font-bold text-cream mb-4">
            Keep amplifying.
          </h2>
          <p className="reveal text-cream/50 mb-8 max-w-md mx-auto">
            The network rewards early participation. Every quality post builds your stake in what comes next.
          </p>

          <div className="reveal flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <>
                <a href="#submit" className="btn btn-cyan-glow group">
                  Submit a Post
                  <HexIcon className="opacity-60 group-hover:opacity-100 group-hover:rotate-90 transition-all duration-300" />
                </a>
                <Link href="/grow" className="btn btn-outline-gold group">
                  Grow Your Network
                  <span className="opacity-60 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/register" className="btn btn-cyan-glow group">
                  Create Account
                  <HexIcon className="opacity-60 group-hover:opacity-100 group-hover:rotate-90 transition-all duration-300" />
                </Link>
                <Link href="/auth/login" className="btn btn-outline-cyan">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section - Now at the bottom */}
      <section className="py-20 sm:py-24 bg-dark relative">
        <div className="max-w-[700px] mx-auto px-5 sm:px-10">
          <div className="text-center mb-12">
            <div className="reveal-scale text-terra font-mono text-sm tracking-wider mb-4">
              FAQ
            </div>
            <h2 className="reveal text-3xl sm:text-4xl font-bold text-cream">
              Questions.
            </h2>
          </div>

          <div className="reveal space-y-3">
            <FAQItem
              question="What are FARM points?"
              answer="FARM points measure your contribution to the human.farm network. They're earned through content creation and referrals, and will factor into future token distribution and operator priority."
            />
            <FAQItem
              question="How is my post scored?"
              answer="Our AI evaluates multiple signals: content quality, originality, engagement potential, reach, and account verification status. Better content earns a higher score — and more points."
            />
            <FAQItem
              question="When will HMN tokens launch?"
              answer="The token generation event (TGE) is coming soon. Points earned now will be relevant when the token goes live. Early participation positions you ahead of the network."
            />
            <FAQItem
              question="How deep do referral rewards go?"
              answer="You earn from direct referrals and their extended network. The exact depth and percentages will be detailed in the full tokenomics release. The principle: early builders benefit most."
            />
            <FAQItem
              question="Can I earn from both posting and referrals?"
              answer="Yes. Content and referrals are independent point streams. Active participants who do both accumulate significantly faster than those using one channel alone."
            />
            <FAQItem
              question="What happens to my points later?"
              answer="Points represent early contribution to the network. How they translate into token allocation, operator priority, and platform access will be announced alongside the TGE."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-dark border-t border-cream/10">
        <div className="max-w-[1140px] mx-auto px-5 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo light />
          <ul className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
            <Link href="/browse" className="text-cream/50 hover:text-cream transition-colors">Operators</Link>
            <Link href="/mcp" className="text-cream/50 hover:text-cream transition-colors">Agents</Link>
            <Link href="/token" className="text-cream/50 hover:text-cream transition-colors">Token</Link>
            <Link href="#" className="text-cream/50 hover:text-cream transition-colors">X</Link>
            <Link href="#" className="text-cream/50 hover:text-cream transition-colors">Discord</Link>
          </ul>
          <span className="text-cream/30 text-sm">© 2025 human.farm</span>
        </div>
      </footer>
    </div>
  );
}
