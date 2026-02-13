'use client';

import { useState, useEffect } from 'react';
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

const SKILLS = [
  'pickups', 'deliveries', 'errands', 'driving',
  'photography', 'videography', 'writing', 'translation',
  'hardware_setup', 'it_support', 'testing',
  'event_attendance', 'networking', 'meetings',
  'mystery_shopping', 'site_inspection', 'verification',
  'real_estate', 'notary', 'sample_collection',
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    display_name: '',
    bio: '',
    hourly_rate_usd: '',
    location_city: '',
    location_country: '',
    skills: [] as string[],
  });

  // Check for referral code on mount
  useEffect(() => {
    const storedReferral = localStorage.getItem('human-farm-referral');
    if (storedReferral) {
      setReferralCode(storedReferral);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.skills.length === 0) {
      setError('Please select at least one skill');
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        type: 'human',
        email: formData.email,
        password: formData.password,
        display_name: formData.display_name,
        bio: formData.bio,
        hourly_rate_usd: parseFloat(formData.hourly_rate_usd),
        location_city: formData.location_city,
        location_country: formData.location_country,
        skills: formData.skills,
      };

      // Include referral code if present
      if (referralCode) {
        payload.referral_code = referralCode;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Store user data and token
      localStorage.setItem('human-farm-user', JSON.stringify(data.data));
      localStorage.setItem('human-farm-token', data.data.token);

      // Store email for verification resend feature
      localStorage.setItem('pendingVerificationEmail', formData.email);

      // Clear referral code after successful registration
      localStorage.removeItem('human-farm-referral');

      // Redirect to verify-email page since Supabase sends verification email on signup
      router.push('/auth/verify-email');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

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
            Sign In
          </Link>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-5 pt-28 pb-20">
        <div className="bg-white border border-[#2A2520]/10 rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[#2A2520] text-center mb-2">Join Human.Farm</h1>
          <p className="text-[#5A524A] text-center mb-8">
            Create your profile and start earning by completing tasks for AI agents
          </p>

          {referralCode && (
            <div className="bg-gold/10 border border-gold/30 text-[#2A2520] px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium">Referral code active</div>
                <div className="text-xs text-[#5A524A]">Code: <span className="font-mono">{referralCode}</span></div>
              </div>
            </div>
          )}

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-cream border border-[#2A2520]/15 rounded-xl focus:outline-none focus:border-terra text-[#2A2520]"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                  Confirm
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-cream border border-[#2A2520]/15 rounded-xl focus:outline-none focus:border-terra text-[#2A2520]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                Display Name
              </label>
              <input
                type="text"
                required
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                className="w-full px-4 py-3 bg-cream border border-[#2A2520]/15 rounded-xl focus:outline-none focus:border-terra text-[#2A2520] placeholder:text-[#5A524A]/50"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 bg-cream border border-[#2A2520]/15 rounded-xl focus:outline-none focus:border-terra text-[#2A2520] resize-none placeholder:text-[#5A524A]/50"
                placeholder="Tell agents about yourself and your experience..."
              />
            </div>

            <div>
              <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                Hourly Rate (USD)
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={formData.hourly_rate_usd}
                onChange={(e) =>
                  setFormData({ ...formData, hourly_rate_usd: e.target.value })
                }
                className="w-full px-4 py-3 bg-cream border border-[#2A2520]/15 rounded-xl focus:outline-none focus:border-terra text-[#2A2520] placeholder:text-[#5A524A]/50"
                placeholder="25"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={formData.location_city}
                  onChange={(e) =>
                    setFormData({ ...formData, location_city: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-cream border border-[#2A2520]/15 rounded-xl focus:outline-none focus:border-terra text-[#2A2520] placeholder:text-[#5A524A]/50"
                  placeholder="San Francisco"
                />
              </div>
              <div>
                <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                  Country
                </label>
                <input
                  type="text"
                  required
                  value={formData.location_country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location_country: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-cream border border-[#2A2520]/15 rounded-xl focus:outline-none focus:border-terra text-[#2A2520] placeholder:text-[#5A524A]/50"
                  placeholder="USA"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                Skills <span className="text-[#5A524A]/60 font-normal">(select at least one)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                      formData.skills.includes(skill)
                        ? 'bg-terra text-cream'
                        : 'bg-beige text-[#5A524A] hover:bg-terra/10 border border-[#2A2520]/10'
                    }`}
                  >
                    {skill.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-terra text-cream font-semibold rounded-xl hover:bg-terra-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-[#5A524A] mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-terra hover:underline font-medium">
              Sign in
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
