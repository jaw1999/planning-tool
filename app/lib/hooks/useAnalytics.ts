// app/lib/hooks/useAnalytics.ts
import { useState, useEffect } from 'react';
import { AnalyticsData } from '../types/analytics';

export function useAnalytics(timeRange: string) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [timeRange]);

  return { data, isLoading, error };
}