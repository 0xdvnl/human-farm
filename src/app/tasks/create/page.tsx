'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'pickups_deliveries', label: 'Pickups & Deliveries' },
  { value: 'in_person_meetings', label: 'In-Person Meetings' },
  { value: 'document_signing', label: 'Document Signing' },
  { value: 'verification', label: 'Verification & Recon' },
  { value: 'photography', label: 'Photography' },
  { value: 'product_testing', label: 'Product Testing' },
  { value: 'event_attendance', label: 'Event Attendance' },
  { value: 'hardware_setup', label: 'Hardware Setup' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'mystery_shopping', label: 'Mystery Shopping' },
  { value: 'sample_collection', label: 'Sample Collection' },
  { value: 'errands', label: 'Errands & Purchases' },
];

export default function CreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'errands',
    budget_usd: '',
    deadline: '',
    location_required: false,
    location_address: '',
    proof_requirements: [''],
  });

  useEffect(() => {
    const stored = localStorage.getItem('human-farm-user');
    if (!stored) {
      router.push('/auth/login');
      return;
    }
    const userData = JSON.parse(stored);
    if (userData.user.type !== 'agent') {
      router.push('/dashboard');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('human-farm-token');

      // Set deadline to end of day if only date provided
      let deadline = formData.deadline;
      if (deadline && !deadline.includes('T')) {
        deadline = `${deadline}T23:59:59`;
      }

      const payload = {
        ...formData,
        budget_usd: parseFloat(formData.budget_usd),
        deadline,
        proof_requirements: formData.proof_requirements.filter((p) => p.trim()),
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to create task');
        return;
      }

      router.push(`/tasks/${data.data.id}`);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addProofRequirement = () => {
    setFormData({
      ...formData,
      proof_requirements: [...formData.proof_requirements, ''],
    });
  };

  const updateProofRequirement = (index: number, value: string) => {
    const updated = [...formData.proof_requirements];
    updated[index] = value;
    setFormData({ ...formData, proof_requirements: updated });
  };

  const removeProofRequirement = (index: number) => {
    setFormData({
      ...formData,
      proof_requirements: formData.proof_requirements.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-6">Create a Task</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Task Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-farm-orange text-white"
                placeholder="e.g., Pick up a package from downtown office"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-farm-orange text-white resize-none"
                placeholder="Provide detailed instructions for the human..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-farm-orange text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Budget (USD)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={formData.budget_usd}
                  onChange={(e) =>
                    setFormData({ ...formData, budget_usd: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-farm-orange text-white"
                  placeholder="50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Deadline
              </label>
              <input
                type="datetime-local"
                required
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-farm-orange text-white"
              />
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.location_required}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location_required: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-gray-800 bg-[#0a0a0a] text-farm-orange focus:ring-farm-orange"
                />
                <span className="text-sm text-gray-400">
                  Location required for this task
                </span>
              </label>
            </div>

            {formData.location_required && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Location Address
                </label>
                <input
                  type="text"
                  value={formData.location_address}
                  onChange={(e) =>
                    setFormData({ ...formData, location_address: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-farm-orange text-white"
                  placeholder="123 Main St, San Francisco, CA"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Proof Requirements (what the human should provide on completion)
              </label>
              <div className="space-y-2">
                {formData.proof_requirements.map((req, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => updateProofRequirement(i, e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-farm-orange text-white"
                      placeholder={`e.g., Photo of completed task`}
                    />
                    {formData.proof_requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProofRequirement(i)}
                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addProofRequirement}
                  className="text-sm text-farm-orange hover:underline"
                >
                  + Add requirement
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Task Budget</span>
                <span className="font-semibold">
                  ${formData.budget_usd || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Platform Fee (5%)</span>
                <span className="text-gray-500">
                  ${((parseFloat(formData.budget_usd) || 0) * 0.05).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-farm-orange">
                  ${((parseFloat(formData.budget_usd) || 0) * 1.05).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-farm-orange text-white font-semibold rounded-lg hover:bg-farm-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
