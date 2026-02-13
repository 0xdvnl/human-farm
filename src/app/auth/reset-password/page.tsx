'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokens, setTokens] = useState<{ access_token: string; refresh_token: string } | null>(null);
  const [isValidLink, setIsValidLink] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase sends tokens in the URL hash for password reset
    // Format: #access_token=...&refresh_token=...&type=recovery
    const hash = window.location.hash;

    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (access_token && refresh_token && type === 'recovery') {
        setTokens({ access_token, refresh_token });
        setIsValidLink(true);
        // Clear the hash from URL for security
        window.history.replaceState(null, '', window.location.pathname);
      } else {
        setIsValidLink(false);
      }
    } else {
      // Check if we have an error in the query params
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        setError(errorDescription || 'Invalid or expired reset link');
        setIsValidLink(false);
      } else {
        setIsValidLink(false);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!tokens) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking tokens
  if (isValidLink === null) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="text-[#5A524A]">Validating reset link...</div>
      </div>
    );
  }

  // Invalid or expired link
  if (!isValidLink) {
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
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-[#2A2520] mb-4">Invalid Reset Link</h1>
            <p className="text-[#5A524A] mb-6">
              {error || 'This password reset link is invalid or has expired. Please request a new one.'}
            </p>

            <Link
              href="/auth/forgot-password"
              className="inline-block py-3 px-6 bg-terra text-cream font-semibold rounded-xl hover:bg-terra-deep transition-colors"
            >
              Request New Link
            </Link>

            <div className="mt-6">
              <Link href="/auth/login" className="text-[#5A524A] hover:text-[#2A2520] text-sm">
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-cream border-b border-[#2A2520]/10">
          <div className="max-w-[1140px] mx-auto px-5 sm:px-10 flex justify-between items-center h-14">
            <Logo />
          </div>
        </nav>

        <div className="max-w-md mx-auto px-5 pt-28 pb-20">
          <div className="bg-white border border-[#2A2520]/10 rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-[#2A2520] mb-4">Password Reset!</h1>
            <p className="text-[#5A524A] mb-6">
              Your password has been successfully updated. Redirecting you to login...
            </p>

            <Link
              href="/auth/login"
              className="text-terra hover:underline font-medium"
            >
              Go to Login Now →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reset form
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
          <h1 className="text-2xl font-bold text-[#2A2520] text-center mb-2">Reset Your Password</h1>
          <p className="text-[#5A524A] text-center mb-8">
            Enter your new password below.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-cream border border-[#2A2520]/15 rounded-xl focus:outline-none focus:border-terra text-[#2A2520]"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-[#5A524A]/70">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-cream border border-[#2A2520]/15 rounded-xl focus:outline-none focus:border-terra text-[#2A2520]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-terra text-cream font-semibold rounded-xl hover:bg-terra-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="text-[#5A524A]">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
