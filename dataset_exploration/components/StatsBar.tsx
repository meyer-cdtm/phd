'use client';

import { Stats } from '@/lib/types';

interface StatsBarProps {
  stats: Stats | null;
}

export function StatsBar({ stats }: StatsBarProps) {
  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Dataset Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 p-4 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statItems = [
    { label: 'Total Questions', value: stats.totalQuestions },
    { label: 'Deleted', value: stats.deletedQuestions },
    { label: 'Bulk Deletes', value: stats.bulkDeletes },
    { label: 'Published', value: stats.publishedQuestions },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Dataset Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((stat) => (
          <div key={stat.label} className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
