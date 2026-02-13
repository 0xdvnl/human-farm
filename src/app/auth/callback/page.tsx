'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

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

type CallbackStatus = 'processing' | 'success' | 'error';

// Inner component that uses useSearchParams
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Create Supabase client with detectSessionInUrl enabled
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              detectSessionInUrl: true,
              flowType: 'pkce',
            }
          }
        );

        // Log for debugging
        const fullUrl = typeof window !== 'undefined' ? window.location.href : '';
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        console.log('[Auth Callback] Full URL:', fullUrl);
        console.log('[Auth Callback] Hash:', hash);
        console.log('[Auth Callback] Search params:', Object.fromEntries(searchParams.entries()));

        // Check for error in query params
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || error || 'Authentication failed');
          return;
        }

        // Method 1: Check for code in query params (PKCE flow)
        const code = searchParams.get('code');

        if (code) {
          console.log('[Auth Callback] Found code, exchanging for session...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('[Auth Callback] Exchange error:', exchangeError);
            setStatus('error');
            setErrorMessage(exchangeError.message || 'Failed to verify email');
            return;
          }

          if (data.session && data.user) {
            console.log('[Auth Callback] Session established via code exchange');
            await syncVerificationStatus(supabase, data.user);
            setStatus('success');
            setTimeout(() => router.push('/earn'), 2000);
            return;
          }
        }

        // Method 2: Check for tokens in URL hash (implicit flow / magic links)
        if (typeof window !== 'undefined' && hash) {
          console.log('[Auth Callback] Checking hash for tokens...');
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          // Check for error in hash
          const hashError = hashParams.get('error');
          const hashErrorDescription = hashParams.get('error_description');

          if (hashError) {
            setStatus('error');
            setErrorMessage(hashErrorDescription || hashError || 'Authentication failed');
            return;
          }

          if (accessToken) {
            console.log('[Auth Callback] Found access token in hash');
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) {
              console.error('[Auth Callback] Session error:', sessionError);
              setStatus('error');
              setErrorMessage(sessionError.message || 'Failed to verify email');
              return;
            }

            if (data.session && data.user) {
              console.log('[Auth Callback] Session established via hash tokens');
              await syncVerificationStatus(supabase, data.user);
              setStatus('success');
              setTimeout(() => router.push('/earn'), 2000);
              return;
            }
          }
        }

        // Method 3: Wait a moment then check if session was auto-detected
        // Supabase might need a moment to process the URL and set up the session
        console.log('[Auth Callback] Waiting for auto-detection...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[Auth Callback] getSession result:', { session: !!session, error: sessionError });

        if (session?.user) {
          console.log('[Auth Callback] Session found via getSession');
          await syncVerificationStatus(supabase, session.user);
          setStatus('success');
          setTimeout(() => router.push('/earn'), 2000);
          return;
        }

        // Method 4: Listen for auth state change
        console.log('[Auth Callback] Setting up auth state listener...');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[Auth Callback] Auth state change:', event, !!session);
          if (event === 'SIGNED_IN' && session?.user) {
            await syncVerificationStatus(supabase, session.user);
            setStatus('success');
            subscription.unsubscribe();
            setTimeout(() => router.push('/earn'), 2000);
          }
        });

        // Wait for potential auth state change
        await new Promise(resolve => setTimeout(resolve, 2000));
        subscription.unsubscribe();

        // If we still don't have a session, show error with debug info
        const debugStr = `URL: ${fullUrl.substring(0, 100)}..., Hash: ${hash ? 'present' : 'none'}, Code: ${code || 'none'}`;
        setDebugInfo(debugStr);
        setStatus('error');
        setErrorMessage('Could not verify your email. The link may have expired or already been used.');
      } catch (err) {
        console.error('[Auth Callback] Error:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred during verification');
      }
    };

    // Helper function to sync verification status to our users table
    const syncVerificationStatus = async (supabase: any, user: any) => {
      const userId = user.id;
      const emailConfirmedAt = user.email_confirmed_at;

      console.log('[Auth Callback] Syncing verification status for user:', userId);

      if (emailConfirmedAt) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email_verified: true,
            email_verified_at: emailConfirmedAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          console.error('[Auth Callback] Failed to update users table:', updateError);
        } else {
          console.log('[Auth Callback] User verification status updated');
        }
      }
    };

    handleCallback();
  }, [searchParams, router]);

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
          {status === 'processing' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-cyan/20 border-t-cyan animate-spin" />
              <h1 className="text-2xl font-bold text-cream mb-2">Verifying your email</h1>
              <p className="text-cream/60">Please wait while we confirm your account...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cyan/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-cream mb-2">Email Verified!</h1>
              <p className="text-cream/60 mb-6">
                Your account is now fully activated. Redirecting you to start earning...
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/earn"
                  className="px-6 py-3 bg-cyan text-dark rounded-xl font-semibold hover:bg-cyan/90 transition-colors"
                >
                  Start Earning
                </Link>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 border border-cream/20 text-cream rounded-xl font-semibold hover:bg-cream/5 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-cream mb-2">Verification Failed</h1>
              <p className="text-cream/60 mb-6">{errorMessage}</p>
              {debugInfo && (
                <p className="text-cream/30 text-xs mb-4 break-all">{debugInfo}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/auth/login"
                  className="px-6 py-3 bg-cyan text-dark rounded-xl font-semibold hover:bg-cyan/90 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 border border-cream/20 text-cream rounded-xl font-semibold hover:bg-cream/5 transition-colors"
                >
                  Go Home
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-cream/30 text-sm mt-6">
          Need help? Contact support@human.farm
        </p>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
