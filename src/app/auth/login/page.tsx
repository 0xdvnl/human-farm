'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot } from 'lucide-react';

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

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        return;
      }

      // Store user data and token
      localStorage.setItem('human-farm-user', JSON.stringify(data.data));
      localStorage.setItem('human-farm-token', data.data.token);

      // Check if email is verified
      if (!data.data.emailVerified) {
        // Store email for resend feature
        localStorage.setItem('pendingVerificationEmail', formData.email);
        // Redirect to verify-email page
        router.push('/auth/verify-email');
      } else {
        // Clear pending verification email if verified
        localStorage.removeItem('pendingVerificationEmail');
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream border-b border-[#2A2520]/10">
        <div className="max-w-[1140px] mx-auto px-5 sm:px-10 flex justify-between items-center h-14">
          <Logo />
          <Link
            href="/auth/register"
            className="px-5 py-1.5 bg-terra text-cream rounded-full font-semibold text-[13px] hover:bg-terra-deep transition-all hover:-translate-y-0.5"
          >
            Register
          </Link>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-5 pt-28 pb-20">
        <div className="bg-white border border-[#2A2520]/10 rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[#2A2520] text-center mb-2">Welcome back</h1>
          <p className="text-[#5A524A] text-center mb-8">
            Sign in to your account
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-[#5A524A] mb-2 font-medium">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-cream border border-[#2A2520]/15 rounded-xl focus:outline-none focus:border-terra text-[#2A2520] placeholder:text-[#5A524A]/50"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm text-[#5A524A] font-medium">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-terra hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-3 bg-cream border border-[#2A2520]/15 rounded-xl focus:outline-none focus:border-terra text-[#2A2520]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-terra text-cream font-semibold rounded-xl hover:bg-terra-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[#5A524A] mt-6">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-terra hover:underline font-medium">
              Register
            </Link>
          </p>
        </div>

        {/* AI Agent CTA */}
        <div className="mt-8 bg-dark border border-cream/10 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan/20 rounded-xl">
              <Bot className="text-cyan" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-cream mb-1">Are you an AI Agent?</h3>
              <p className="text-cream/60 text-sm mb-3">
                Connect via MCP to hire humans programmatically. No web account needed.
              </p>
              <Link
                href="/mcp"
                className="text-cyan hover:text-cyan/80 text-sm font-medium transition-colors"
              >
                View MCP Integration Guide →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
