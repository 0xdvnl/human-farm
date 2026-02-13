'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Logo component
const Logo = () => (
  <Link href="/" className="flex items-center gap-2.5">
    <div className="w-6 h-6">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M16 2L28.66 9.5V24.5L16 32L3.34 24.5V9.5L16 2Z" stroke="#F2EDE5" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <path d="M16 7L24.66 12V22L16 27L7.34 22V12L16 7Z" stroke="#F2EDE5" strokeWidth="1" fill="none" opacity="0.3"/>
      </svg>
    </div>
    <span className="font-mono text-[15px] font-bold tracking-tight text-cream">
      human.farm
    </span>
  </Link>
);

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-deep to-dark" />
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-block">
            <Logo />
          </div>
        </div>
        <div className="bg-dark-surface border border-cream/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-cyan/20 border-t-cyan animate-spin" />
          <h1 className="text-2xl font-bold text-cream mb-2">Loading</h1>
          <p className="text-cream/60">Please wait...</p>
        </div>
      </div>
    </div>
  );
}

// Inner component that uses useSearchParams
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // If there's a code parameter, redirect to the callback page
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      router.replace(`/auth/callback?code=${code}`);
    }
  }, [searchParams, router]);

  const handleResendEmail = async () => {
    setResending(true);
    setMessage(null);

    try {
      // Get email from localStorage if available
      const email = localStorage.getItem('pendingVerificationEmail');

      if (!email) {
        setMessage({ type: 'error', text: 'Please log in to resend verification email' });
        setResending(false);
        return;
      }

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Verification email sent! Check your inbox.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send verification email' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-deep to-dark" />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <Logo />
          </div>
        </div>

        <div className="bg-dark-surface border border-cream/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-cream mb-2">Check Your Email</h1>
          <p className="text-cream/60 mb-6">
            We've sent a verification link to your email address. Click the link to verify your account and unlock all features.
          </p>

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-cyan/10 text-cyan' : 'bg-red-500/10 text-red-400'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleResendEmail}
              disabled={resending}
              className="w-full px-6 py-3 bg-dark-deep border border-cream/20 text-cream rounded-xl font-semibold hover:bg-cream/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>

            <Link
              href="/auth/login"
              className="block w-full px-6 py-3 bg-cyan text-dark rounded-xl font-semibold hover:bg-cyan/90 transition-colors text-center"
            >
              Back to Sign In
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-cream/10">
            <h3 className="text-cream/80 font-medium mb-3">Didn't receive the email?</h3>
            <ul className="text-cream/40 text-sm space-y-2 text-left">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email address</li>
              <li>• Wait a few minutes and try resending</li>
              <li>• Contact support@human.farm if issues persist</li>
            </ul>
          </div>
        </div>

        <p className="text-center text-cream/30 text-sm mt-6">
          Need help? Contact support@human.farm
        </p>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
