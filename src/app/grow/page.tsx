'use client';
// Force rebuild for production env vars - v2

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// Types for API responses
interface UserStats {
  total_points: number;
  submissions_count: number;
  referral_points: number;
  referral_count: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  referral_count: number;
  isCurrentUser?: boolean;
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

// Network Tree Node with highlight support
const TreeNode = ({
  label,
  sublabel,
  primary = false,
  delay = 0,
  level = 0,
  highlightLevel = -1
}: {
  label: string;
  sublabel?: string;
  primary?: boolean;
  delay?: number;
  level?: number;
  highlightLevel?: number;
}) => {
  const isHighlighted = highlightLevel === level;

  // Get color based on level: L1=gold, L2=terra, L3=cyan, L4=cream
  const getLevelColor = () => {
    if (!isHighlighted) return 'border-cream/20 text-cream/60';
    switch (level) {
      case 1: return 'border-gold text-gold scale-110 shadow-lg shadow-gold/30';
      case 2: return 'border-terra text-terra scale-110 shadow-lg shadow-terra/30';
      case 3: return 'border-cyan text-cyan scale-110 shadow-lg shadow-cyan/30';
      case 4: return 'border-cream text-cream scale-110 shadow-lg shadow-cream/30';
      default: return 'border-cream/20 text-cream/60';
    }
  };

  return (
    <div
      className={`rounded-full flex flex-col items-center justify-center text-center transition-all duration-300 ${
        primary
          ? 'w-16 h-16 sm:w-20 sm:h-20 border-2 border-gold bg-dark-surface text-gold shadow-lg shadow-gold/20'
          : `w-12 h-12 sm:w-14 sm:h-14 border bg-dark-surface/50 ${getLevelColor()}`
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`font-mono text-[8px] sm:text-[10px] ${primary ? 'font-semibold' : ''}`}>{label}</span>
      {sublabel && <span className="font-mono text-[6px] sm:text-[8px] opacity-60">{sublabel}</span>}
    </div>
  );
};

// Cohort Slot Component (like Legions)
const CohortSlot = ({
  filled,
  isLast,
  onClick
}: {
  filled: boolean;
  isLast: boolean;
  onClick?: () => void;
}) => (
  <div
    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center transition-all duration-300 overflow-hidden ${
      filled
        ? 'bg-gold/20 border border-gold/40'
        : 'bg-dark-surface/30 border border-cream/10 border-dashed'
    } ${isLast && !filled ? 'hover:border-gold/30 cursor-pointer' : ''}`}
    onClick={onClick}
  >
    {filled ? (
      <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) : (
      <img
        src="/images/grow/multiplier-badge-locked.png"
        alt="Locked"
        className="w-8 h-8 object-contain opacity-30"
      />
    )}
  </div>
);

// Leaderboard Entry Component
const LeaderboardRow = ({
  entry,
  highlight
}: {
  entry: LeaderboardEntry;
  highlight: 'gold' | 'silver' | 'bronze' | 'top10' | 'top50' | 'top100' | 'normal';
}) => {
  const getBgClass = () => {
    switch (highlight) {
      case 'gold': return 'bg-gradient-to-r from-gold/20 to-transparent border-l-4 border-gold';
      case 'silver': return 'bg-gradient-to-r from-cream/10 to-transparent border-l-4 border-cream/50';
      case 'bronze': return 'bg-gradient-to-r from-terra/20 to-transparent border-l-4 border-terra';
      case 'top10': return 'bg-gold/5 border-l-2 border-gold/30';
      case 'top50': return 'bg-cyan/5 border-l-2 border-cyan/30';
      case 'top100': return 'bg-terra/5 border-l-2 border-terra/30';
      default: return 'bg-dark-surface/20';
    }
  };

  const getRankDisplay = () => {
    if (entry.rank === 1) return <img src="/images/grow/leaderboard-1st.png" alt="1st" className="w-8 h-8 object-contain" />;
    if (entry.rank === 2) return <img src="/images/grow/leaderboard-2nd.png" alt="2nd" className="w-8 h-8 object-contain" />;
    if (entry.rank === 3) return <img src="/images/grow/leaderboard-3rd.png" alt="3rd" className="w-8 h-8 object-contain" />;
    return <span className={`font-mono text-sm ${entry.rank <= 10 ? 'text-gold' : entry.rank <= 50 ? 'text-cyan' : entry.rank <= 100 ? 'text-terra' : 'text-cream/40'}`}>#{entry.rank}</span>;
  };

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${getBgClass()} ${entry.isCurrentUser ? 'ring-2 ring-cyan/50' : ''}`}>
      <div className="w-10 text-center">{getRankDisplay()}</div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${entry.isCurrentUser ? 'text-cyan' : 'text-cream'}`}>
          {entry.username}
          {entry.isCurrentUser && <span className="ml-2 text-xs text-cyan/60">(You)</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-semibold text-gold">{entry.referral_count}</div>
        <div className="text-[10px] text-cream/40">referrals</div>
      </div>
    </div>
  );
};

export default function GrowPage() {
  const [copied, setCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);

  // User stats
  const [stats, setStats] = useState<UserStats | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);

  // Hover state for network visualization
  const [highlightLevel, setHighlightLevel] = useState(-1);

  // App URL for referral links
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://humanfarm.ai';

  // Mock leaderboard data (sorted by referrals)
  const [leaderboard] = useState<LeaderboardEntry[]>([
    { rank: 1, username: 'alpha_network', referral_count: 847, isCurrentUser: false },
    { rank: 2, username: 'web3_builder', referral_count: 623, isCurrentUser: false },
    { rank: 3, username: 'crypto_evangelist', referral_count: 512, isCurrentUser: false },
    { rank: 4, username: 'ai_pioneer', referral_count: 445, isCurrentUser: false },
    { rank: 5, username: 'human_connector', referral_count: 389, isCurrentUser: false },
    { rank: 6, username: 'defi_master', referral_count: 356, isCurrentUser: false },
    { rank: 7, username: 'token_hunter', referral_count: 298, isCurrentUser: false },
    { rank: 8, username: 'farm_lord', referral_count: 267, isCurrentUser: false },
    { rank: 9, username: 'network_king', referral_count: 234, isCurrentUser: false },
    { rank: 10, username: 'point_collector', referral_count: 198, isCurrentUser: false },
    { rank: 11, username: 'growth_hacker', referral_count: 167, isCurrentUser: false },
    { rank: 12, username: 'social_builder', referral_count: 145, isCurrentUser: false },
  ]);

  // Cohort configuration - Operator Nodes unlocked at milestones
  const cohorts = [
    { id: 1, slots: 5, reward: '1x Airdrop', description: 'Guaranteed airdrop allocation' },
    { id: 2, slots: 5, reward: '3x Airdrop', description: '3x airdrop allocation' },
    { id: 3, slots: 5, reward: '5x Airdrop', description: '+ free badge boosting visibility' },
    { id: 4, slots: 5, reward: '7x Airdrop', description: '+ Free Operator Kit (physical)' },
  ];

  // Template messages
  const templates = {
    x: `I'm building my network on @humanfarm - the platform where AI agents hire humans.\n\nJoin through my link and we both earn FARM points:\n${appUrl}/ref/${referralCode || 'YOUR_CODE'}\n\n#HumanFarm #Web3 #AI`,
    telegram: `Hey! I've been using human.farm - it's a platform where AI agents hire humans for tasks.\n\nIf you join through my link, we both earn FARM points:\n${appUrl}/ref/${referralCode || 'YOUR_CODE'}`,
    email: `Subject: Join me on human.farm\n\nHey!\n\nI wanted to share something interesting with you. human.farm is a platform where AI agents hire humans for tasks - and you can earn FARM points.\n\nJoin through my referral link and we both benefit:\n${appUrl}/ref/${referralCode || 'YOUR_CODE'}\n\nLet me know if you have questions!`
  };

  // Check auth on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
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
        setReferralCode(data.data.referral_code);
        setReferralCount(data.data.stats.referral_count || 0);
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

  // Scroll reveal animations
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    elements.forEach((el) => el.classList.add('will-animate'));

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

  const handleCopyLink = () => {
    if (!referralCode) return;
    const referralLink = `${appUrl}/ref/${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnX = () => {
    const text = encodeURIComponent(templates.x);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareOnTelegram = () => {
    const text = encodeURIComponent(templates.telegram);
    window.open(`https://t.me/share/url?url=${appUrl}/ref/${referralCode}&text=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join me on human.farm');
    const body = encodeURIComponent(templates.email.replace('Subject: Join me on human.farm\n\n', ''));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
          <p className="text-cream/50">Loading...</p>
        </div>
      </div>
    );
  }

  // Helper function to get highlight type for leaderboard
  const getHighlight = (rank: number): 'gold' | 'silver' | 'bronze' | 'top10' | 'top50' | 'top100' | 'normal' => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    if (rank <= 10) return 'top10';
    if (rank <= 50) return 'top50';
    if (rank <= 100) return 'top100';
    return 'normal';
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/90 backdrop-blur-sm border-b border-cream/10">
        <div className="max-w-[1140px] mx-auto px-5 sm:px-10 flex justify-between items-center h-14">
          <Logo light />
          <ul className="flex gap-4 sm:gap-7 items-center">
            <Link href="/earn" className="text-sm text-cream/75 hover:text-cream transition-colors hidden sm:block">
              Amplify
            </Link>
            <Link href="/grow" className="text-sm text-gold font-medium hidden sm:block">
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
                className="px-5 py-1.5 bg-gold text-dark rounded-full font-semibold text-[13px] hover:bg-gold/90 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/20"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/register"
                className="px-5 py-1.5 bg-gold text-dark rounded-full font-semibold text-[13px] hover:bg-gold/90 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/20"
              >
                Apply Now
              </Link>
            )}
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden pt-14">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-deep to-dark" />

        {/* Animated hexagon grid */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[5%] animate-hex-float opacity-10" style={{ animationDelay: '0s' }}>
            <HexIcon size={80} className="text-gold" />
          </div>
          <div className="absolute top-[25%] right-[8%] animate-hex-float opacity-15" style={{ animationDelay: '0.8s' }}>
            <HexIcon size={60} className="text-terra" />
          </div>
          <div className="absolute bottom-[25%] left-[12%] animate-hex-float opacity-10" style={{ animationDelay: '1.5s' }}>
            <HexIcon size={100} className="text-gold" />
          </div>
          <div className="absolute top-[50%] right-[15%] animate-hex-float opacity-8" style={{ animationDelay: '2s' }}>
            <HexIcon size={45} className="text-cream" />
          </div>
          <div className="absolute bottom-[15%] right-[25%] animate-hex-float opacity-12" style={{ animationDelay: '0.5s' }}>
            <HexIcon size={70} className="text-gold" />
          </div>
          <div className="absolute top-[35%] left-[25%] animate-hex-float opacity-8" style={{ animationDelay: '1.2s' }}>
            <HexIcon size={35} className="text-terra" />
          </div>
        </div>

        {/* Glowing orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-gold/10 via-transparent to-transparent blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative z-10 max-w-[900px] mx-auto px-5 sm:px-10 py-16 text-center">
          <div className="reveal-scale inline-flex items-center gap-2 px-4 py-2 mb-6 border border-gold/30 rounded-full text-gold text-sm font-mono animate-glow-pulse">
            <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            Grow • Build Your Network
          </div>

          <h1 className="reveal text-4xl sm:text-5xl lg:text-6xl font-bold text-cream leading-tight mb-4">
            Invite. Expand.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-terra to-gold">Unlock.</span>
          </h1>

          <p className="reveal text-lg text-cream/60 mb-8 max-w-xl mx-auto">
            Build your network of operators. Unlock Operator Nodes at every milestone — designed to reward early contributors.
          </p>

          {/* Quick stats */}
          <div className="reveal flex justify-center gap-8 sm:gap-12 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-gold mb-1">
                {isLoggedIn ? referralCount : <AnimatedCounter target={0} />}
              </div>
              <div className="text-xs text-cream/50 font-mono">Your Operators</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-terra mb-1">
                {isLoggedIn ? Math.min(Math.floor(referralCount / 5), 4) : 0}
              </div>
              <div className="text-xs text-cream/50 font-mono">Nodes Unlocked</div>
            </div>
          </div>
        </div>
      </section>

      {/* Compressed Referral + Cohorts Section (Legions Style) */}
      <section className="py-12 sm:py-16 bg-dark-deep relative">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Left: Cohorts Grid */}
            <div className="relative bg-dark-surface/50 rounded-2xl border border-cream/10 p-6 overflow-hidden">
              {/* Background texture */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
                style={{ backgroundImage: "url('/images/grow/legions-card-bckg.jpg')" }}
              />
              <div className="relative z-10 flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-cream uppercase tracking-wider">Your Network</h3>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-cream/50">Operators</span>
                    <span className="text-gold font-bold">{referralCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cream/50">Nodes</span>
                    <span className="text-cyan font-bold">{Math.min(Math.floor(referralCount / 5), 4)}/4</span>
                  </div>
                </div>
              </div>

              {/* Cohort Rows */}
              <div className="relative z-10 space-y-4">
                {cohorts.map((cohort, cohortIndex) => {
                  const filledInCohort = Math.max(0, Math.min(cohort.slots, referralCount - cohortIndex * 5));
                  const isCohortComplete = filledInCohort >= cohort.slots;

                  return (
                    <div key={cohort.id} className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-cream/40 uppercase tracking-wider">Cohort {cohort.id}</span>
                        {isCohortComplete && (
                          <span className="text-[10px] font-mono text-gold">✓ Complete</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5 flex-1">
                          {Array.from({ length: cohort.slots }).map((_, slotIndex) => (
                            <CohortSlot
                              key={slotIndex}
                              filled={slotIndex < filledInCohort}
                              isLast={slotIndex === filledInCohort && !isCohortComplete}
                            />
                          ))}
                        </div>
                        <div className={`text-right min-w-[120px] px-3 py-2 rounded-lg ${
                          isCohortComplete ? 'bg-gold/10 border border-gold/30' : 'bg-dark/30 border border-cream/5'
                        }`}>
                          <div className={`text-xs ${isCohortComplete ? 'text-gold' : 'text-cream/40'}`}>
                            {isCohortComplete ? cohort.reward : `Invite ${cohort.slots - filledInCohort} more`}
                          </div>
                          <div className={`text-[10px] ${isCohortComplete ? 'text-gold/60' : 'text-cream/30'}`}>
                            {isCohortComplete ? cohort.description : `to unlock ${cohort.reward}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Share Section */}
            <div className="bg-dark-surface/50 rounded-2xl border border-cream/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 bg-gold/20 rounded text-gold text-xs font-mono font-bold">001</div>
                <h3 className="text-lg font-bold text-cream uppercase tracking-wider">Share Referral Code</h3>
              </div>

              <p className="text-cream/60 text-sm mb-4">
                Build your network of operators. Every 5 referrals unlocks an Operator Node — designed to reward early contributors. The earlier you build, the more you accumulate.
              </p>

              {/* Referral Link */}
              <div className="mb-4">
                <div className="text-[10px] font-mono text-cream/40 uppercase tracking-wider mb-2">Your unique referral URL</div>
                {isLoggedIn && referralCode ? (
                  <div className="flex bg-dark rounded-lg border border-cream/20 overflow-hidden">
                    <input
                      type="text"
                      value={`${appUrl}/ref/${referralCode}`}
                      readOnly
                      className="flex-1 px-4 py-3 bg-transparent text-cream/60 font-mono text-sm focus:outline-none truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-5 py-3 bg-cream/5 text-cream font-bold text-sm hover:bg-cream/10 transition-colors border-l border-cream/20 uppercase tracking-wider"
                    >
                      {copied ? '✓' : 'Copy'}
                    </button>
                  </div>
                ) : (
                  <Link href="/auth/register" className="block text-center py-3 bg-dark rounded-lg border border-cream/20 text-cream/50 text-sm hover:border-gold/30 transition-colors">
                    Sign up to get your referral link
                  </Link>
                )}
              </div>

              {/* Share Buttons */}
              <div className="mb-4">
                <div className="text-[10px] font-mono text-cream/40 uppercase tracking-wider mb-2">Or share directly on</div>
                <div className="flex gap-2">
                  <button
                    onClick={shareOnX}
                    disabled={!isLoggedIn}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-dark rounded-lg border border-cream/20 text-cream hover:border-cream/40 hover:bg-cream/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>
                  <button
                    onClick={shareOnTelegram}
                    disabled={!isLoggedIn}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-dark rounded-lg border border-cream/20 text-cream hover:border-[#0088cc]/50 hover:bg-[#0088cc]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </button>
                  <button
                    onClick={shareViaEmail}
                    disabled={!isLoggedIn}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-dark rounded-lg border border-cream/20 text-cream hover:border-cream/40 hover:bg-cream/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Templates Button */}
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full text-center py-2 text-cream/40 text-xs font-mono hover:text-cream/60 transition-colors"
              >
                {showTemplates ? '↑ Hide templates' : "Don't know what to say? Get our templates ↓"}
              </button>

              {/* Templates Dropdown */}
              {showTemplates && (
                <div className="mt-4 space-y-3 animate-fade-in">
                  <div className="bg-dark/50 rounded-lg p-3 border border-cream/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-cream/50">X / Twitter</span>
                      <button
                        onClick={() => {navigator.clipboard.writeText(templates.x); }}
                        className="text-xs text-cyan hover:text-cyan/80"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-cream/40 whitespace-pre-line">{templates.x}</p>
                  </div>
                  <div className="bg-dark/50 rounded-lg p-3 border border-cream/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-cream/50">Telegram</span>
                      <button
                        onClick={() => {navigator.clipboard.writeText(templates.telegram); }}
                        className="text-xs text-cyan hover:text-cyan/80"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-cream/40 whitespace-pre-line">{templates.telegram}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="py-16 sm:py-20 relative">
        <div className="max-w-[700px] mx-auto px-5 sm:px-10">
          <div className="text-center mb-10">
            <div className="reveal-scale text-cyan font-mono text-sm tracking-wider mb-3">
              Referral leaderboard
            </div>
            <h2 className="reveal text-2xl sm:text-3xl font-bold text-cream mb-3">
              Top network builders
            </h2>
            <p className="reveal text-cream/50 text-sm max-w-lg mx-auto">
              Ranked by number of referrals. Top positions unlock exclusive rewards.
            </p>
          </div>

          {/* Airdrop Distribution Cards */}
          <div className="reveal grid grid-cols-3 gap-3 mb-8">
            <div className="bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gold mb-1">40%</div>
              <div className="text-xs text-cream/70 font-medium">Top 1-10</div>
              <div className="text-[10px] text-cream/40 mt-1">of leaderboard airdrop</div>
            </div>
            <div className="bg-gradient-to-br from-cyan/20 to-cyan/5 border border-cyan/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-cyan mb-1">50%</div>
              <div className="text-xs text-cream/70 font-medium">Top 11-50</div>
              <div className="text-[10px] text-cream/40 mt-1">of leaderboard airdrop</div>
            </div>
            <div className="bg-gradient-to-br from-terra/20 to-terra/5 border border-terra/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-terra mb-1">10%</div>
              <div className="text-xs text-cream/70 font-medium">Top 51-100</div>
              <div className="text-[10px] text-cream/40 mt-1">of leaderboard airdrop</div>
            </div>
          </div>

          {/* Tier indicators */}
          <div className="reveal flex justify-center gap-4 mb-6 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gold" />
              <span className="text-cream/60">Top 10</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan/50" />
              <span className="text-cream/60">Top 50</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-terra/50" />
              <span className="text-cream/60">Top 100</span>
            </div>
          </div>

          {/* Scrollable Leaderboard */}
          <div className="reveal-scale bg-dark-surface/30 rounded-2xl border border-cream/10 overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto space-y-1.5 p-3">
              {leaderboard.map((entry) => (
                <LeaderboardRow
                  key={entry.rank}
                  entry={entry}
                  highlight={getHighlight(entry.rank)}
                />
              ))}
            </div>
          </div>

          {!isLoggedIn && (
            <div className="reveal mt-4 text-center">
              <Link href="/auth/register" className="text-sm text-gold hover:text-gold/80 transition-colors">
                Sign up to see your position →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Network Compounds Section (Pre-CTA) */}
      <section className="py-16 sm:py-20 bg-dark-deep relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark to-dark-deep" />

        <div className="max-w-[1000px] mx-auto px-5 sm:px-10 relative z-10">
          <div className="text-center mb-12">
            <div className="reveal-scale text-terra font-mono text-sm tracking-wider mb-3">
              Passive rewards
            </div>
            <h2 className="reveal text-2xl sm:text-3xl font-bold text-cream mb-3">
              Your network compounds.
            </h2>
            <p className="reveal text-cream/50 text-sm max-w-lg mx-auto">
              Earn from everyone you bring — and everyone they bring. Four levels of rewards that multiply your impact.
            </p>
          </div>

          {/* Two Column Layout: Tree + Tiers */}
          <div className="reveal grid lg:grid-cols-2 gap-8 items-center">

            {/* Left: Interactive Tree */}
            <div className="relative py-6">
              <div className="flex flex-col items-center">
                {/* You - Level 0 */}
                <TreeNode label="You" primary level={0} highlightLevel={highlightLevel} />

                {/* Connector */}
                <div className={`w-px h-6 transition-colors duration-300 ${highlightLevel === 1 ? 'bg-gold' : 'bg-cream/20'}`} />

                {/* Level 1 - Direct (20%) */}
                <div className="relative">
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 sm:w-40 h-px transition-colors duration-300 ${highlightLevel === 1 ? 'bg-gold' : 'bg-cream/20'}`} />
                  <div className="flex justify-center gap-6 sm:gap-10 pt-5">
                    <TreeNode label="20%" sublabel="L1" level={1} highlightLevel={highlightLevel} />
                    <TreeNode label="20%" sublabel="L1" level={1} highlightLevel={highlightLevel} />
                    <TreeNode label="20%" sublabel="L1" level={1} highlightLevel={highlightLevel} />
                  </div>
                </div>

                {/* Connector */}
                <div className={`w-px h-4 transition-colors duration-300 ${highlightLevel === 2 ? 'bg-terra' : 'bg-cream/10'}`} />

                {/* Level 2 (15%) */}
                <div className="flex justify-center gap-4 sm:gap-6">
                  <TreeNode label="15%" sublabel="L2" level={2} highlightLevel={highlightLevel} />
                  <TreeNode label="15%" sublabel="L2" level={2} highlightLevel={highlightLevel} />
                  <TreeNode label="15%" sublabel="L2" level={2} highlightLevel={highlightLevel} />
                  <TreeNode label="15%" sublabel="L2" level={2} highlightLevel={highlightLevel} />
                </div>

                {/* Connector */}
                <div className={`w-px h-4 transition-colors duration-300 ${highlightLevel === 3 ? 'bg-cyan' : 'bg-cream/5'}`} />

                {/* Level 3 (10%) */}
                <div className="flex justify-center gap-3 sm:gap-4">
                  <TreeNode label="10%" sublabel="L3" level={3} highlightLevel={highlightLevel} />
                  <TreeNode label="10%" sublabel="L3" level={3} highlightLevel={highlightLevel} />
                  <TreeNode label="10%" sublabel="L3" level={3} highlightLevel={highlightLevel} />
                  <TreeNode label="10%" sublabel="L3" level={3} highlightLevel={highlightLevel} />
                  <TreeNode label="10%" sublabel="L3" level={3} highlightLevel={highlightLevel} />
                </div>

                {/* Connector */}
                <div className={`w-px h-4 transition-colors duration-300 ${highlightLevel === 4 ? 'bg-cream' : 'bg-cream/5'}`} />

                {/* Level 4 (5%) */}
                <div className="flex justify-center gap-2 sm:gap-3 opacity-60">
                  <TreeNode label="5%" sublabel="L4" level={4} highlightLevel={highlightLevel} />
                  <TreeNode label="5%" sublabel="L4" level={4} highlightLevel={highlightLevel} />
                  <TreeNode label="5%" sublabel="L4" level={4} highlightLevel={highlightLevel} />
                  <TreeNode label="5%" sublabel="L4" level={4} highlightLevel={highlightLevel} />
                  <TreeNode label="5%" sublabel="L4" level={4} highlightLevel={highlightLevel} />
                  <TreeNode label="5%" sublabel="L4" level={4} highlightLevel={highlightLevel} />
                </div>
              </div>

              {/* Pulsing ring */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border border-gold/20 animate-ping" style={{ animationDuration: '3s' }} />
            </div>

            {/* Right: Tier Cards Stacked */}
            <div className="space-y-3">
              {/* Level 1 */}
              <div
                className={`relative p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  highlightLevel === 1
                    ? 'border-gold/50 shadow-lg shadow-gold/10'
                    : 'border-cream/10 hover:border-gold/30'
                }`}
                onMouseEnter={() => setHighlightLevel(1)}
                onMouseLeave={() => setHighlightLevel(-1)}
              >
                <div
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${highlightLevel === 1 ? 'opacity-20' : 'opacity-10'}`}
                  style={{ backgroundImage: "url('/images/grow/tier-card-l1.jpeg')" }}
                />
                <div className="absolute inset-0 bg-dark/60" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${highlightLevel === 1 ? 'bg-gold text-dark' : 'bg-gold/20 text-gold'}`}>
                        L1
                      </div>
                      <span className="font-semibold text-cream">Direct Referrals</span>
                    </div>
                    <span className={`text-2xl font-bold ${highlightLevel === 1 ? 'text-gold' : 'text-gold/70'}`}>20%</span>
                  </div>
                  <p className="text-xs text-cream/50 pl-11">
                    Earn 20% of every point your direct invites generate through tasks and content.
                  </p>
                </div>
              </div>

              {/* Level 2 */}
              <div
                className={`relative p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  highlightLevel === 2
                    ? 'border-gold/50 shadow-lg shadow-gold/10'
                    : 'border-cream/10 hover:border-gold/30'
                }`}
                onMouseEnter={() => setHighlightLevel(2)}
                onMouseLeave={() => setHighlightLevel(-1)}
              >
                <div
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${highlightLevel === 2 ? 'opacity-20' : 'opacity-10'}`}
                  style={{ backgroundImage: "url('/images/grow/tier-card-l2.jpg')" }}
                />
                <div className="absolute inset-0 bg-dark/60" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${highlightLevel === 2 ? 'bg-terra text-cream' : 'bg-terra/20 text-terra'}`}>
                        L2
                      </div>
                      <span className="font-semibold text-cream">Second Level</span>
                    </div>
                    <span className={`text-2xl font-bold ${highlightLevel === 2 ? 'text-terra' : 'text-terra/70'}`}>15%</span>
                  </div>
                  <p className="text-xs text-cream/50 pl-11">
                    Earn 15% from people your referrals bring in. Your network starts to compound.
                  </p>
                </div>
              </div>

              {/* Level 3 */}
              <div
                className={`relative p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  highlightLevel === 3
                    ? 'border-gold/50 shadow-lg shadow-gold/10'
                    : 'border-cream/10 hover:border-gold/30'
                }`}
                onMouseEnter={() => setHighlightLevel(3)}
                onMouseLeave={() => setHighlightLevel(-1)}
              >
                <div
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${highlightLevel === 3 ? 'opacity-20' : 'opacity-10'}`}
                  style={{ backgroundImage: "url('/images/grow/tier-card-l3.jpg')" }}
                />
                <div className="absolute inset-0 bg-dark/60" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${highlightLevel === 3 ? 'bg-cyan text-dark' : 'bg-cyan/20 text-cyan'}`}>
                        L3
                      </div>
                      <span className="font-semibold text-cream">Third Level</span>
                    </div>
                    <span className={`text-2xl font-bold ${highlightLevel === 3 ? 'text-cyan' : 'text-cyan/70'}`}>10%</span>
                  </div>
                  <p className="text-xs text-cream/50 pl-11">
                    Earn 10% from the third layer. True passive income from network effects.
                  </p>
                </div>
              </div>

              {/* Level 4 */}
              <div
                className={`relative p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  highlightLevel === 4
                    ? 'border-gold/50 shadow-lg shadow-gold/10'
                    : 'border-cream/10 hover:border-gold/30'
                }`}
                onMouseEnter={() => setHighlightLevel(4)}
                onMouseLeave={() => setHighlightLevel(-1)}
              >
                <div
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${highlightLevel === 4 ? 'opacity-20' : 'opacity-10'}`}
                  style={{ backgroundImage: "url('/images/grow/tier-card-l4.jpeg')" }}
                />
                <div className="absolute inset-0 bg-dark/60" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${highlightLevel === 4 ? 'bg-cream text-dark' : 'bg-cream/20 text-cream'}`}>
                        L4
                      </div>
                      <span className="font-semibold text-cream">Fourth Level</span>
                    </div>
                    <span className={`text-2xl font-bold ${highlightLevel === 4 ? 'text-cream' : 'text-cream/70'}`}>5%</span>
                  </div>
                  <p className="text-xs text-cream/50 pl-11">
                    Earn 5% from the fourth layer. Maximum depth for exponential growth.
                  </p>
                </div>
              </div>

              {/* Total */}
              <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-gold/10 to-terra/10 border border-gold/20 text-center">
                <span className="text-cream/60 text-sm">Total potential from full network: </span>
                <span className="text-gold font-bold text-lg">50%</span>
                <span className="text-cream/60 text-sm"> of downstream earnings</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-dark-deep to-dark relative overflow-hidden">
        <div className="absolute top-10 left-10 animate-hex-float opacity-5">
          <HexIcon size={100} className="text-gold" />
        </div>

        <div className="max-w-[600px] mx-auto px-5 sm:px-10 text-center relative z-10">
          <h2 className="reveal text-2xl sm:text-3xl font-bold text-cream mb-3">
            Start growing now.
          </h2>
          <p className="reveal text-cream/50 mb-6 text-sm max-w-md mx-auto">
            Every referral compounds. Build your network early and watch your rewards multiply.
          </p>

          <div className="reveal flex flex-col sm:flex-row gap-3 justify-center">
            {isLoggedIn ? (
              <>
                <button onClick={handleCopyLink} className="btn btn-gold-glow group">
                  Copy Referral Link
                  <span className="opacity-60 group-hover:opacity-100 transition-opacity">{copied ? '✓' : '→'}</span>
                </button>
                <Link href="/earn" className="btn btn-outline-cyan group">
                  Amplify on X
                  <HexIcon className="opacity-60 group-hover:opacity-100 group-hover:rotate-90 transition-all duration-300" />
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/register" className="btn btn-gold-glow group">
                  Create Account
                  <HexIcon className="opacity-60 group-hover:opacity-100 group-hover:rotate-90 transition-all duration-300" />
                </Link>
                <Link href="/auth/login" className="btn btn-outline-gold">
                  Sign In
                </Link>
              </>
            )}
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
