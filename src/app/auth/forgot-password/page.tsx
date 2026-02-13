'use client';

import { useState } from 'react';
import Link from 'next/link';

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-cream">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-cream border-b border-[#2A2520]/10">
          <div className="max-w-[1140px] mx-auto px-5 sm:px-10 flex justify-between items-center h-14">
            <Logo />
            <Link
              href="/auth/login"
              className="px-5 py-1.5 bg-terra text-cream rounded-full font-semibold text-[13px] hover:bg-terra-deep transition-all hover:-translate-y-0.5"
            >
              Login
            </Link>
          </div>
        </nav>

        <div className="max-w-md mx-auto px-5 pt-28 pb-20">
          <div className="bg-white border border-[#2A2520]/10 rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-[#2A2520] mb-4">Check Your Email</h1>
            <p className="text-[#5A524A] mb-6">
              If an account exists for <span className="font-medium text-[#2A2520]">{email}</span>, you&apos;ll receive a password reset link shortly.
            </p>

            <div className="space-y-4">
              <p className="text-sm text-[#5A524A]/70">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>

              <button
                onClick={() => setIsSubmitted(false)}
                className="text-terra hover:underline text-sm font-medium"
              >
                Try a different email
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-[#2A2520]/10">
              <Link href="/auth/login" className="text-[#5A524A] hover:text-[#2A2520] text-sm">
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream border-b border-[#2A2520]/10">
        <div className="max-w-[1140px] mx-auto px-5 sm:px-10 flex justify-between items-center h-14">
          <Logo />
          <Link
            href="/auth/login"
            className="px-5 py-1.5 bg-terra text-cream rounded-full font-semibold text-[13px] hover:bg-terra-deep transition-all hover:-translate-y-0.5"
          >
            Login
          </Link>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-5 pt-28 pb-20">
        <div className="bg-white border border-[#2A2520]/10 rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[#2A2520] text-center mb-2">Forgot Password?</h1>
          <p className="text-[#5A524A] text-center mb-8">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-cream border border-[#2A2520]/15 rounded-xl focus:outline-none focus:border-terra text-[#2A2520] placeholder:text-[#5A524A]/50"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-terra text-cream font-semibold rounded-xl hover:bg-terra-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center text-[#5A524A] mt-6">
            <Link href="/auth/login" className="text-terra hover:underline font-medium">
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
