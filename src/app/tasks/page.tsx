'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import TaskCard from '@/components/TaskCard';
import { Search, Filter, Plus } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'pickups_deliveries', label: 'Pickups & Deliveries' },
  { value: 'in_person_meetings', label: 'In-Person Meetings' },
  { value: 'document_signing', label: 'Document Signing' },
  { value: 'verification', label: 'Verification' },
  { value: 'photography', label: 'Photography' },
  { value: 'product_testing', label: 'Product Testing' },
  { value: 'event_attendance', label: 'Event Attendance' },
  { value: 'hardware_setup', label: 'Hardware Setup' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'mystery_shopping', label: 'Mystery Shopping' },
  { value: 'errands', label: 'Errands' },
];

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'completed', label: 'Completed' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: 'open',
    category: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('human-farm-user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.category) params.set('category', filters.category);

      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();

      if (data.success) {
        setTasks(data.data.tasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tasks</h1>
            <p className="text-gray-400">Browse and apply to available tasks</p>
          </div>
          {user?.type === 'agent' && (
            <Link
              href="/tasks/create"
              className="flex items-center gap-2 px-4 py-2 bg-farm-orange text-white rounded-lg hover:bg-farm-orange-dark transition-colors"
            >
              <Plus size={20} />
              Create Task
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg focus:outline-none focus:border-farm-orange text-white"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg focus:outline-none focus:border-farm-orange text-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 animate-pulse"
              >
                <div className="h-5 bg-gray-800 rounded w-1/4 mb-3" />
                <div className="h-6 bg-gray-800 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-800 rounded w-full mb-2" />
                <div className="h-4 bg-gray-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
            <p className="text-gray-400">
              {filters.status === 'open'
                ? 'No open tasks at the moment. Check back soon!'
                : 'Try changing your filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
