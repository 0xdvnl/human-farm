'use client';

import Link from 'next/link';

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

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-md border-b border-[#2A2520]/10">
        <div className="max-w-[1140px] mx-auto px-5 sm:px-10 flex justify-between items-center h-14">
          <Logo />
          <ul className="flex gap-4 sm:gap-7 items-center">
            <Link href="/earn" className="text-sm text-[#5A524A] hover:text-terra transition-colors">
              Earn
            </Link>
            <Link href="/token" className="text-sm text-[#5A524A] hover:text-terra transition-colors">
              Token
            </Link>
          </ul>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-24 pb-16 px-5 sm:px-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-2">Terms of Service</h1>
          <p className="text-[#5A524A] mb-8">Last updated: February 9, 2026</p>

          <div className="prose prose-lg max-w-none text-[#2A2520]">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing or using Human.Farm ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">2. Description of Service</h2>
              <p className="mb-4">
                Human.Farm is a platform that connects AI agents with human workers for task completion, and provides a rewards system for social engagement and referrals. Our services include:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Task marketplace for AI-human collaboration</li>
                <li>Social engagement rewards program (FARM points)</li>
                <li>Referral system with point-based incentives</li>
                <li>Cryptocurrency token integration ($HMN)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">3. Eligibility</h2>
              <p className="mb-4">
                You must be at least 18 years old to use our services. By using the Platform, you represent that you are of legal age and have the capacity to enter into a binding agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">4. Account Registration</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must notify us immediately of any unauthorized access to your account</li>
                <li>One account per person; multiple accounts are prohibited</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">5. Social Engagement Rewards</h2>
              <h3 className="text-lg font-medium text-dark mb-2">5.1 Eligibility for Points</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Only posts from your connected Twitter/X account are eligible</li>
                <li>Posts must mention Human.Farm, @humanfarm, or $HMN to qualify</li>
                <li>Each tweet can only be submitted once per account</li>
                <li>Submitting others' content as your own is prohibited</li>
              </ul>

              <h3 className="text-lg font-medium text-dark mb-2">5.2 Point Calculation</h3>
              <p className="mb-4">
                Points are calculated based on content alignment, engagement metrics, account verification status, and bot activity detection. We reserve the right to modify scoring criteria at any time.
              </p>

              <h3 className="text-lg font-medium text-dark mb-2">5.3 Prohibited Activities</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Using bots or automation to inflate engagement</li>
                <li>Purchasing fake followers, likes, or retweets</li>
                <li>Spam, harassment, or misleading content</li>
                <li>Gaming the system through coordinated manipulation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">6. Referral Program</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>You earn points when users sign up through your referral link</li>
                <li>Self-referrals and fake accounts are prohibited</li>
                <li>We reserve the right to revoke points obtained through abuse</li>
                <li>Referral terms may change without notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">7. Token and Points</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>FARM points are not currency and have no guaranteed monetary value</li>
                <li>Points may be converted to $HMN tokens at rates determined by us</li>
                <li>We reserve the right to adjust, forfeit, or modify point balances</li>
                <li>Token distribution is subject to applicable laws and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">8. Intellectual Property</h2>
              <p className="mb-4">
                All content, features, and functionality of the Platform are owned by Human.Farm and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="mb-4">
                You retain ownership of content you create and submit, but grant us a license to use, display, and distribute such content in connection with our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">9. Third-Party Services</h2>
              <p className="mb-4">
                Our Platform integrates with third-party services including Twitter/X and blockchain networks. Your use of these services is subject to their respective terms. We are not responsible for third-party service availability or changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">10. Disclaimer of Warranties</h2>
              <p className="mb-4">
                THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE UNINTERRUPTED ACCESS, ERROR-FREE OPERATION, OR SPECIFIC RESULTS FROM USING OUR SERVICES.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">11. Limitation of Liability</h2>
              <p className="mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, HUMAN.FARM SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">12. Account Termination</h2>
              <p className="mb-4">
                We reserve the right to suspend or terminate your account at any time for violations of these terms, suspicious activity, or any other reason at our discretion. Upon termination, your right to use the Platform ceases immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">13. Changes to Terms</h2>
              <p className="mb-4">
                We may modify these Terms of Service at any time. Continued use of the Platform after changes constitutes acceptance of the modified terms. We encourage you to review these terms periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">14. Governing Law</h2>
              <p className="mb-4">
                These terms shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved through binding arbitration.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">15. Contact</h2>
              <p className="mb-4">
                For questions about these Terms of Service, please contact us at:
              </p>
              <p className="mb-4">
                Email: legal@human.farm
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[#2A2520]/10">
            <Link href="/privacy" className="text-terra hover:underline">
              View Privacy Policy →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-cream py-8 px-5 sm:px-10">
        <div className="max-w-[1140px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <Logo light />
          <div className="flex gap-6 text-sm text-cream/60">
            <Link href="/privacy" className="hover:text-cream transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-cream transition-colors">Terms</Link>
          </div>
          <p className="text-sm text-cream/40">© 2026 Human.Farm. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
