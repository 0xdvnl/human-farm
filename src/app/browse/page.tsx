'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import HumanCard from '@/components/HumanCard';
import { Search, Filter, X } from 'lucide-react';

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

export default function BrowsePage() {
  const [humans, setHumans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    maxRate: '',
    minRating: '',
    location: '',
    skills: [] as string[],
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchHumans();
  }, []);

  const fetchHumans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.maxRate) params.set('max_rate', filters.maxRate);
      if (filters.minRating) params.set('min_rating', filters.minRating);
      if (filters.location) params.set('location', filters.location);
      if (filters.skills.length > 0) params.set('skills', filters.skills.join(','));

      const res = await fetch(`/api/humans?${params}`);
      const data = await res.json();

      if (data.success) {
        setHumans(data.data.humans);
      }
    } catch (error) {
      console.error('Failed to fetch humans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHumans = humans.filter((h) =>
    h.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream border-b border-[#2A2520]/10">
        <div className="max-w-[1140px] mx-auto px-5 sm:px-10 flex justify-between items-center h-14">
          <Logo />
          <ul className="flex gap-4 sm:gap-7 items-center">
            <Link href="/tasks" className="text-sm text-[#5A524A] hover:text-terra transition-colors hidden sm:block">
              Tasks
            </Link>
            <Link href="/mcp" className="text-sm text-[#5A524A] hover:text-terra transition-colors hidden sm:block">
              For Agents
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-1.5 bg-terra text-cream rounded-full font-semibold text-[13px] hover:bg-terra-deep transition-all hover:-translate-y-0.5"
            >
              Apply Now
            </Link>
          </ul>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 sm:px-10 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2A2520] mb-2">Browse Operators</h1>
          <p className="text-[#5A524A]">Find verified humans for your agent's real-world tasks</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A524A]/50" size={20} />
            <input
              type="text"
              placeholder="Search by name, skill, or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#2A2520]/10 rounded-xl focus:outline-none focus:border-terra text-[#2A2520] placeholder-[#5A524A]/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 border rounded-xl transition-colors ${
              showFilters
                ? 'bg-terra border-terra text-cream'
                : 'bg-white border-[#2A2520]/10 text-[#5A524A] hover:border-terra/30'
            }`}
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white border border-[#2A2520]/10 rounded-2xl p-6 mb-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                  Max Rate ($/hr)
                </label>
                <input
                  type="number"
                  value={filters.maxRate}
                  onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
                  placeholder="Any"
                  className="w-full px-4 py-2.5 bg-cream border border-[#2A2520]/10 rounded-xl focus:outline-none focus:border-terra text-[#2A2520]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                  Min Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                  className="w-full px-4 py-2.5 bg-cream border border-[#2A2520]/10 rounded-xl focus:outline-none focus:border-terra text-[#2A2520]"
                >
                  <option value="">Any</option>
                  <option value="4.5">4.5+</option>
                  <option value="4">4+</option>
                  <option value="3.5">3.5+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#5A524A] mb-2 font-medium">
                  Location
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  placeholder="City or country"
                  className="w-full px-4 py-2.5 bg-cream border border-[#2A2520]/10 rounded-xl focus:outline-none focus:border-terra text-[#2A2520]"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchHumans}
                  className="w-full px-4 py-2.5 bg-terra text-cream rounded-xl hover:bg-terra-deep transition-colors font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-[#2A2520]/10 rounded-2xl p-5 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-beige rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-beige rounded w-1/2 mb-2" />
                    <div className="h-4 bg-beige rounded w-full mb-2" />
                    <div className="h-4 bg-beige rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredHumans.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#2A2520]/10 rounded-2xl">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-[#2A2520] mb-2">No operators found</h3>
            <p className="text-[#5A524A]">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHumans.map((human) => (
              <HumanCard key={human.user_id} human={human} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
