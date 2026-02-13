'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ReferralPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  useEffect(() => {
    if (code) {
      // Store the referral code in localStorage
      localStorage.setItem('human-farm-referral', code);

      // Redirect to registration page
      router.push('/auth/register');
    }
  }, [code, router]);

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
        <p className="text-cream/50">Activating referral...</p>
        <p className="text-gold font-mono text-sm mt-2">{code}</p>
      </div>
    </div>
  );
}
