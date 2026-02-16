'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  usersWithReferrals: number;
  totalReferrals: number;
  avgReferrals: number;
  milestones: {
    reached5: number;
    reached10: number;
    reached15: number;
    reached20: number;
  };
  amplify: {
    usersWhoSubmitted: number;
    totalSubmissions: number;
    totalPointsDistributed: number;
    totalViews: number;
  };
  userGrowth: Record<string, number>;
  generatedAt: string;
}

// Stat card component
function StatCard({ title, value, subtitle, icon }: { title: string; value: string | number; subtitle?: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#2A2520]/10 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#5A524A] font-medium">{title}</p>
          <p className="text-3xl font-bold text-[#2A2520] mt-1">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-[#5A524A]/70 mt-1">{subtitle}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

// Milestone card component
function MilestoneCard({ milestone, count, total }: { milestone: number; count: number; total: number }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-[#F5F3EF] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-[#2A2520]">{milestone}+ referrals</span>
        <span className="text-sm text-[#5A524A]">{percentage}%</span>
      </div>
      <div className="w-full bg-[#2A2520]/10 rounded-full h-2">
        <div
          className="bg-terra h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-[#5A524A] mt-1">{count} users</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for saved auth
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_auth');
    if (savedAuth) {
      setIsAuthenticated(true);
      fetchStats(savedAuth);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });

      if (response.ok) {
        localStorage.setItem('admin_auth', password);
        setIsAuthenticated(true);
        const data = await response.json();
        setStats(data);
      } else {
        setError('Invalid admin password');
      }
    } catch (err) {
      setError('Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async (authToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Token invalid, clear auth
        localStorage.removeItem('admin_auth');
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setStats(null);
    setPassword('');
  };

  const handleRefresh = () => {
    const savedAuth = localStorage.getItem('admin_auth');
    if (savedAuth) {
      fetchStats(savedAuth);
    }
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#2A2520]/10 p-8 shadow-sm max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#2A2520]">Admin Dashboard</h1>
            <p className="text-[#5A524A] mt-1">Enter admin password to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full px-4 py-3 bg-cream border border-[#2A2520]/15 rounded-xl focus:outline-none focus:border-terra text-[#2A2520] mb-4"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-terra text-cream font-semibold rounded-xl hover:bg-terra-deep transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-[#5A524A] hover:text-[#2A2520]">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-[#2A2520]/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#2A2520]">Admin Dashboard</h1>
            <p className="text-sm text-[#5A524A]">Human Farm Campaign Statistics</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-cream border border-[#2A2520]/15 rounded-lg text-sm font-medium hover:bg-[#F5F3EF] transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : '↻ Refresh'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading && !stats ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-terra border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-[#5A524A]">Loading statistics...</p>
          </div>
        ) : stats ? (
          <>
            {/* Overview Section */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-[#2A2520] mb-4">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon="👥"
                />
                <StatCard
                  title="Users Who Referred"
                  value={stats.usersWithReferrals}
                  subtitle={`${stats.totalUsers > 0 ? Math.round((stats.usersWithReferrals / stats.totalUsers) * 100) : 0}% of users`}
                  icon="🔗"
                />
                <StatCard
                  title="Total Referrals"
                  value={stats.totalReferrals}
                  icon="📈"
                />
                <StatCard
                  title="Avg Referrals/User"
                  value={stats.avgReferrals}
                  icon="📊"
                />
              </div>
            </section>

            {/* Milestones Section */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-[#2A2520] mb-4">Referral Milestones</h2>
              <div className="bg-white rounded-xl border border-[#2A2520]/10 p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MilestoneCard milestone={5} count={stats.milestones.reached5} total={stats.totalUsers} />
                  <MilestoneCard milestone={10} count={stats.milestones.reached10} total={stats.totalUsers} />
                  <MilestoneCard milestone={15} count={stats.milestones.reached15} total={stats.totalUsers} />
                  <MilestoneCard milestone={20} count={stats.milestones.reached20} total={stats.totalUsers} />
                </div>
              </div>
            </section>

            {/* Amplify Section */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-[#2A2520] mb-4">Twitter Amplify Campaign</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Users Who Submitted"
                  value={stats.amplify.usersWhoSubmitted}
                  icon="✍️"
                />
                <StatCard
                  title="Total Submissions"
                  value={stats.amplify.totalSubmissions}
                  icon="📝"
                />
                <StatCard
                  title="Points Distributed"
                  value={stats.amplify.totalPointsDistributed}
                  icon="⭐"
                />
                <StatCard
                  title="Total Views Generated"
                  value={stats.amplify.totalViews}
                  icon="👁️"
                />
              </div>
            </section>

            {/* User Growth Chart */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-[#2A2520] mb-4">User Growth (Last 30 Days)</h2>
              <div className="bg-white rounded-xl border border-[#2A2520]/10 p-6 shadow-sm">
                {Object.keys(stats.userGrowth).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(stats.userGrowth)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([date, count]) => (
                        <div key={date} className="flex items-center gap-4">
                          <span className="text-sm text-[#5A524A] w-24">{date}</span>
                          <div className="flex-1 bg-[#F5F3EF] rounded-full h-4">
                            <div
                              className="bg-terra h-4 rounded-full"
                              style={{
                                width: `${Math.min((count / Math.max(...Object.values(stats.userGrowth))) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-[#2A2520] w-12 text-right">{count}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-[#5A524A] text-center py-8">No user signups in the last 30 days</p>
                )}
              </div>
            </section>

            {/* Footer */}
            <div className="text-center text-sm text-[#5A524A]">
              Last updated: {new Date(stats.generatedAt).toLocaleString()}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#5A524A]">Failed to load statistics. Please try refreshing.</p>
          </div>
        )}
      </main>
    </div>
  );
}
