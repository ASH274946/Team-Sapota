'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface UsageStats {
  userId: string;
  type: 'quiz' | 'paper' | 'assignment';
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
}

interface Props {
  type: 'quiz' | 'paper' | 'assignment';
  showFullStatus?: boolean;
}

export function DailyLimitIndicator({ type, showFullStatus = false }: Props) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await api.get('/usage/daily-stats');
      if (response.data?.success) {
        const typeStats = response.data.data.find((s: UsageStats) => s.type === type);
        setStats(typeStats || null);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return null;
  }

  const percentage = (stats.used / stats.limit) * 100;
  const isWarning = stats.remaining <= 1;
  const isExceeded = stats.remaining <= 0;

  const typeLabels = {
    quiz: 'Mock Quizzes',
    paper: 'Question Papers',
    assignment: 'Assignments',
  };

  const resetDate = new Date(stats.resetAt);
  const resetTime = resetDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-700">
            {typeLabels[type]}
          </span>
          {isExceeded && <AlertCircle size={16} className="text-red-500" />}
          {isWarning && !isExceeded && <AlertCircle size={16} className="text-amber-500" />}
          {!isWarning && !isExceeded && <CheckCircle2 size={16} className="text-green-500" />}
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isExceeded ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {showFullStatus && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
            <span>
              {stats.used} of {stats.limit} used
            </span>
            <span className="text-gray-400">•</span>
            <Clock size={12} />
            <span>Resets at {resetTime}</span>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 text-right">
        <div className={`text-sm font-bold ${
          isExceeded ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-green-600'
        }`}>
          {stats.remaining} left
        </div>
      </div>
    </div>
  );
}

interface FullStatusProps {
  showDialog?: boolean;
}

export function DailyLimitStatus({ showDialog = false }: FullStatusProps) {
  const [stats, setStats] = useState<UsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(showDialog);

  const fetchStats = async () => {
    try {
      const response = await api.get('/usage/daily-stats');
      if (response.data?.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats', error);
      toast.error('Failed to load usage statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const typeLabels = {
    quiz: 'Mock Quizzes',
    paper: 'Question Papers',
    assignment: 'Assignments',
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading usage statistics...</div>
        </div>
      ) : stats.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No daily limits configured for your role
        </div>
      ) : (
        stats.map((stat) => (
          <div key={`${stat.userId}-${stat.type}`} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {typeLabels[stat.type as keyof typeof typeLabels]}
                </h4>
                <p className="text-sm text-gray-600">
                  {stat.used} of {stat.limit} used today
                </p>
              </div>
              <div className={`text-lg font-bold ${
                stat.remaining <= 0 ? 'text-red-600' : 
                stat.remaining <= 1 ? 'text-amber-600' : 
                'text-green-600'
              }`}>
                {stat.remaining} remaining
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  stat.remaining <= 0 ? 'bg-red-500' :
                  stat.remaining <= 1 ? 'bg-amber-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min((stat.used / stat.limit) * 100, 100)}%` }}
              />
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Resets on {new Date(stat.resetAt).toLocaleDateString()} at {new Date(stat.resetAt).toLocaleTimeString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
