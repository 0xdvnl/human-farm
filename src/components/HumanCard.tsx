import Link from 'next/link';
import { MapPin, Star, Clock, CheckCircle } from 'lucide-react';

interface HumanCardProps {
  human: {
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
  };
}

export default function HumanCard({ human }: HumanCardProps) {
  return (
    <Link
      href={`/browse/${human.user_id}`}
      className="block bg-white border border-[#2A2520]/10 rounded-2xl p-5 hover:border-terra/40 transition-all hover:shadow-lg hover:shadow-terra/5"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terra to-terra-deep flex items-center justify-center text-cream font-bold text-lg flex-shrink-0">
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

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#2A2520] truncate">
              {human.display_name}
            </h3>
            {human.verification_level >= 1 && (
              <CheckCircle size={16} className="text-cyan flex-shrink-0" />
            )}
            {human.is_active && (
              <span className="w-2 h-2 rounded-full bg-cyan flex-shrink-0" />
            )}
          </div>

          {human.bio && (
            <p className="text-sm text-[#5A524A] mt-1 line-clamp-2">
              {human.bio}
            </p>
          )}

          {/* Location */}
          {(human.location_city || human.location_country) && (
            <div className="flex items-center gap-1 mt-2 text-xs text-[#5A524A]/70">
              <MapPin size={12} />
              <span>
                {[human.location_city, human.location_country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {human.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 bg-beige text-[#5A524A] text-xs rounded-full"
              >
                {skill.replace(/_/g, ' ')}
              </span>
            ))}
            {human.skills.length > 3 && (
              <span className="px-2 py-0.5 bg-beige text-[#5A524A]/60 text-xs rounded-full">
                +{human.skills.length - 3}
              </span>
            )}
          </div>

          {/* Stats & Price */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4 text-xs text-[#5A524A]/70">
              {human.avg_rating && (
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-gold" />
                  <span>{human.avg_rating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{human.total_tasks} tasks</span>
              </div>
            </div>
            <div className="text-terra font-semibold">
              ${human.hourly_rate_usd}
              <span className="text-xs text-[#5A524A]/60">/hr</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
