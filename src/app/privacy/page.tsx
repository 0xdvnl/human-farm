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

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-2">Privacy Policy</h1>
          <p className="text-[#5A524A] mb-8">Last updated: February 9, 2026</p>

          <div className="prose prose-lg max-w-none text-[#2A2520]">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">1. Introduction</h2>
              <p className="mb-4">
                Human.Farm ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">2. Information We Collect</h2>
              <h3 className="text-lg font-medium text-dark mb-2">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Account information: email address, username, password</li>
                <li>Profile information: display name, bio, profile picture</li>
                <li>Wallet addresses for cryptocurrency transactions</li>
                <li>Content you submit: posts, comments, and other user-generated content</li>
              </ul>

              <h3 className="text-lg font-medium text-dark mb-2">2.2 Information from Third Parties</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Twitter/X account information when you connect your account (username, user ID, verification status)</li>
                <li>Public tweet data when you submit posts for rewards</li>
              </ul>

              <h3 className="text-lg font-medium text-dark mb-2">2.3 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Device information: browser type, operating system</li>
                <li>Usage data: pages visited, features used, timestamps</li>
                <li>IP address and general location data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>To provide and maintain our services</li>
                <li>To process transactions and calculate rewards</li>
                <li>To verify ownership of submitted content</li>
                <li>To prevent fraud and abuse</li>
                <li>To communicate with you about updates and features</li>
                <li>To improve our platform and user experience</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">4. Information Sharing</h2>
              <p className="mb-4">We do not sell your personal information. We may share information:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>With service providers who assist in operating our platform</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a merger, acquisition, or sale of assets</li>
                <li>With your consent for any other purpose</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">5. Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">6. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent for data processing</li>
                <li>Export your data in a portable format</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">7. Third-Party Services</h2>
              <p className="mb-4">
                Our platform integrates with third-party services including Twitter/X. Your use of these services is subject to their respective privacy policies. We encourage you to review their privacy practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">8. Cookies and Tracking</h2>
              <p className="mb-4">
                We use essential cookies to maintain your session and preferences. We may use analytics tools to understand how users interact with our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">9. Children's Privacy</h2>
              <p className="mb-4">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">10. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-dark mb-4">11. Contact Us</h2>
              <p className="mb-4">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mb-4">
                Email: privacy@human.farm
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[#2A2520]/10">
            <Link href="/terms" className="text-terra hover:underline">
              View Terms of Service →
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
