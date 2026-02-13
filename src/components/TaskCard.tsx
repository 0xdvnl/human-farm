import Link from 'next/link';
import { MapPin, Clock, DollarSign, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    budget_usd: number;
    location_required: boolean;
    location_address?: string;
    deadline: string;
    created_at: string;
    agent_name?: string;
    applications_count?: number;
  };
}

const statusLabels: Record<string, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  pending_review: 'Pending Review',
  completed: 'Completed',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
};

const statusStyles: Record<string, string> = {
  open: 'bg-cyan/10 text-cyan border border-cyan/20',
  assigned: 'bg-terra/10 text-terra border border-terra/20',
  in_progress: 'bg-gold/10 text-gold border border-gold/20',
  pending_review: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
  completed: 'bg-green-500/10 text-green-600 border border-green-500/20',
  disputed: 'bg-red-500/10 text-red-500 border border-red-500/20',
  cancelled: 'bg-gray-500/10 text-gray-500 border border-gray-500/20',
};

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block bg-white border border-[#2A2520]/10 rounded-2xl p-5 hover:border-terra/40 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Status & Category */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusStyles[task.status] || 'bg-beige text-[#5A524A]'}`}
            >
              {statusLabels[task.status] || task.status}
            </span>
            <span className="text-xs text-[#5A524A]/70">
              {task.category.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-[#2A2520] mb-2">{task.title}</h3>

          {/* Description */}
          <p className="text-sm text-[#5A524A] line-clamp-2 mb-3">
            {task.description}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#5A524A]/70">
            {task.location_required && task.location_address && (
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span className="truncate max-w-[150px]">
                  {task.location_address}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>
                Due {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
              </span>
            </div>
            {task.applications_count !== undefined && task.status === 'open' && (
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span>{task.applications_count} applicants</span>
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <div className="text-terra font-bold text-lg">
            ${task.budget_usd}
          </div>
          {task.agent_name && (
            <div className="text-xs text-[#5A524A]/60 mt-1">
              by {task.agent_name}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
