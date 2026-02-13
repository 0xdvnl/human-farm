'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  MapPin, Star, Clock, CheckCircle, ArrowLeft,
  Mail, Wallet, Calendar, Briefcase, MessageSquare
} from 'lucide-react';

interface HumanProfile {
  user_id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  hourly_rate_usd: number;
  location_city?: string;
  location_country?: string;
  skills: string[];
  verification_level: number;
  total_tasks: number;
  avg_rating?: number;
  is_active: boolean;
  email: string;
  wallet_address?: string;
  member_since: string;
}

export default function HumanProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [human, setHuman] = useState<HumanProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchHumanProfile(params.id as string);
    }
  }, [params.id]);

  const fetchHumanProfile = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/humans/${id}`);
      const data = await res.json();

      if (data.success) {
        setHuman(data.data);
      } else {
        setError(data.error || 'Profile not found');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-8" />
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-gray-800 rounded-full" />
                <div className="flex-1">
                  <div className="h-8 bg-gray-800 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-gray-800 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !human) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Browse
          </Link>
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
            <p className="text-gray-400 mb-6">
              {error || "This human doesn't exist or has been removed."}
            </p>
            <button
              onClick={() => router.push('/browse')}
              className="px-6 py-3 bg-farm-orange text-white rounded-lg hover:bg-farm-orange-dark transition-colors"
            >
              Browse Humans
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Browse
        </Link>

        {/* Profile Card */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-farm-orange/20 to-orange-600/10 p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-farm-orange to-orange-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0 ring-4 ring-[#1a1a1a]">
                {human.avatar_url ? (
                  <img
                    src={human.avatar_url}
                    alt={human.display_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  human.display_name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Name & Status */}
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {human.display_name}
                  </h1>
                  {human.verification_level >= 1 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      <CheckCircle size={14} />
                      Verified
                    </span>
                  )}
                  {human.is_active && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Online
                    </span>
                  )}
                </div>

                {(human.location_city || human.location_country) && (
                  <div className="flex items-center gap-2 mt-2 text-gray-400">
                    <MapPin size={16} />
                    <span>
                      {[human.location_city, human.location_country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Rate */}
              <div className="text-right">
                <div className="text-3xl font-bold text-farm-orange">
                  ${human.hourly_rate_usd}
                </div>
                <div className="text-sm text-gray-400">per hour</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                  <Star size={18} />
                  <span className="text-xl font-bold">
                    {human.avg_rating?.toFixed(1) || '—'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Rating</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                  <Briefcase size={18} />
                  <span className="text-xl font-bold">{human.total_tasks}</span>
                </div>
                <div className="text-xs text-gray-500">Tasks Done</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                  <CheckCircle size={18} />
                  <span className="text-xl font-bold">
                    {human.verification_level}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Verification</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                  <Calendar size={18} />
                  <span className="text-xl font-bold">
                    {new Date(human.member_since).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Joined</div>
              </div>
            </div>

            {/* Bio */}
            {human.bio && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3 text-white">About</h2>
                <p className="text-gray-400 leading-relaxed">{human.bio}</p>
              </div>
            )}

            {/* Skills */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-white">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {human.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-lg"
                  >
                    {skill.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-white">Contact</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail size={18} />
                  <span>{human.email}</span>
                </div>
                {human.wallet_address && (
                  <div className="flex items-center gap-3 text-gray-400">
                    <Wallet size={18} />
                    <span className="font-mono text-sm">
                      {human.wallet_address.slice(0, 6)}...
                      {human.wallet_address.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-farm-orange text-white rounded-lg hover:bg-farm-orange-dark transition-colors font-medium">
                <Briefcase size={20} />
                Hire for Task
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                <MessageSquare size={20} />
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
