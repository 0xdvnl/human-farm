'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TaskCard from '@/components/TaskCard';
import WalletConnect from '@/components/WalletConnect';
import { User, DollarSign, Clock, Star, Plus, Copy, Key, LogOut } from 'lucide-react';

// Logo component
const Logo = () => (
  <Link href="/" className="flex items-center gap-2.5">
    <div className="w-6 h-6">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M16 2L28.66 9.5V24.5L16 32L3.34 24.5V9.5L16 2Z" stroke="#A0614E" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <path d="M16 7L24.66 12V22L16 27L7.34 22V12L16 7Z" stroke="#A0614E" strokeWidth="1" fill="none" opacity="0.3"/>
      </svg>
    </div>
    <span className="font-mono text-[15px] font-bold tracking-tight text-terra">
      human.farm
    </span>
  </Link>
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('human-farm-user');
    if (!stored) {
      router.push('/auth/login');
      return;
    }

    const userData = JSON.parse(stored);
    setUser(userData);
    setWalletAddress(userData.user?.wallet_address || null);
    fetchUserTasks(userData);
  }, []);

  const fetchUserTasks = async (userData: any) => {
    try {
      const token = localStorage.getItem('human-farm-token');
      const param = userData.user.type === 'agent' ? 'agent_id' : 'human_id';

      const res = await fetch(`/api/tasks?${param}=${userData.user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data.success) {
        setTasks(data.data.tasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnect = async (address: string) => {
    const res = await fetch('/api/users/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.user.id,
        wallet_address: address,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to save wallet address');
    }

    setWalletAddress(address);
    // Update local storage
    const updatedUser = {
      ...user,
      user: { ...user.user, wallet_address: address },
    };
    localStorage.setItem('human-farm-user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const handleWalletDisconnect = async () => {
    try {
      const res = await fetch('/api/users/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user.id,
          wallet_address: null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWalletAddress(null);
        // Update local storage
        const updatedUser = {
          ...user,
          user: { ...user.user, wallet_address: null },
        };
        localStorage.setItem('human-farm-user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('human-farm-user');
    localStorage.removeItem('human-farm-token');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-terra border-t-transparent rounded-full" />
      </div>
    );
  }

  const profile = user.profile;
  const isAgent = user.user.type === 'agent';

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream border-b border-[#2A2520]/10">
        <div className="max-w-[1140px] mx-auto px-5 sm:px-10 flex justify-between items-center h-14">
          <Logo />
          <ul className="flex gap-4 sm:gap-7 items-center">
            <Link href="/browse" className="text-sm text-[#5A524A] hover:text-terra transition-colors hidden sm:block">
              Browse
            </Link>
            <Link href="/tasks" className="text-sm text-[#5A524A] hover:text-terra transition-colors hidden sm:block">
              Tasks
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-1.5 text-[#5A524A] hover:text-terra transition-colors text-sm"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </ul>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 sm:px-10 pt-24 pb-16">
        {/* Profile Header */}
        <div className="bg-white border border-[#2A2520]/10 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-terra to-terra-deep flex items-center justify-center text-cream font-bold text-2xl flex-shrink-0">
              {(isAgent ? profile.name : profile.display_name)?.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-[#2A2520]">
                  {isAgent ? profile.name : profile.display_name}
                </h1>
                <span className="px-2 py-1 bg-beige text-[#5A524A] text-xs rounded-full">
                  {isAgent ? '🤖 Agent' : '🧑 Operator'}
                </span>
              </div>
              <p className="text-[#5A524A]">{user.user.email}</p>
              {!isAgent && profile.bio && (
                <p className="text-[#5A524A]/70 mt-2">{profile.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              {isAgent ? (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-terra">
                      {profile.total_tasks}
                    </div>
                    <div className="text-xs text-[#5A524A]">Tasks Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-terra">
                      ${profile.total_spent_usd?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-[#5A524A]">Total Spent</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-terra">
                      {profile.total_tasks}
                    </div>
                    <div className="text-xs text-[#5A524A]">Tasks Done</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-terra">
                      {profile.avg_rating?.toFixed(1) || '-'}
                    </div>
                    <div className="text-xs text-[#5A524A]">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-terra">
                      ${profile.hourly_rate_usd}
                    </div>
                    <div className="text-xs text-[#5A524A]">Hourly Rate</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* API Key for agents */}
          {isAgent && profile.api_key && (
            <div className="mt-6 pt-6 border-t border-[#2A2520]/10">
              <div className="flex items-center gap-2 text-sm text-[#5A524A] mb-2">
                <Key size={16} />
                API Key
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2.5 bg-cream border border-[#2A2520]/10 rounded-xl text-terra overflow-x-auto font-mono text-sm">
                  {profile.api_key}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(profile.api_key)}
                  className="p-2.5 bg-beige rounded-xl hover:bg-terra/10 transition-colors"
                >
                  <Copy size={18} className="text-[#5A524A]" />
                </button>
              </div>
            </div>
          )}

          {/* Skills for humans */}
          {!isAgent && profile.skills && (
            <div className="mt-6 pt-6 border-t border-[#2A2520]/10">
              <div className="text-sm text-[#5A524A] mb-3 font-medium">Skills</div>
              <div className="flex flex-wrap gap-2">
                {(typeof profile.skills === 'string'
                  ? JSON.parse(profile.skills)
                  : profile.skills
                ).map((skill: string) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-beige text-[#5A524A] text-sm rounded-full"
                  >
                    {skill.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Wallet Connection for Humans */}
        {!isAgent && (
          <div className="mb-8">
            <WalletConnect
              currentAddress={walletAddress}
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#2A2520]">
            {isAgent ? 'Your Tasks' : 'Your Jobs'}
          </h2>
          {isAgent && (
            <Link
              href="/tasks/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-terra text-cream rounded-xl hover:bg-terra-deep transition-colors font-medium"
            >
              <Plus size={18} />
              Create Task
            </Link>
          )}
        </div>

        {/* Tasks */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-[#2A2520]/10 rounded-2xl p-5 animate-pulse"
              >
                <div className="h-5 bg-beige rounded w-1/4 mb-3" />
                <div className="h-6 bg-beige rounded w-3/4 mb-3" />
                <div className="h-4 bg-beige rounded w-full" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#2A2520]/10 rounded-2xl">
            <div className="text-4xl mb-4">{isAgent ? '📋' : '🔍'}</div>
            <h3 className="text-xl font-semibold text-[#2A2520] mb-2">No tasks yet</h3>
            <p className="text-[#5A524A] mb-6">
              {isAgent
                ? 'Create your first task to hire a human'
                : 'Browse open tasks to start earning'}
            </p>
            <Link
              href={isAgent ? '/tasks/create' : '/tasks'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-terra text-cream rounded-xl hover:bg-terra-deep transition-colors font-medium"
            >
              {isAgent ? (
                <>
                  <Plus size={18} />
                  Create Task
                </>
              ) : (
                'Browse Tasks'
              )}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
