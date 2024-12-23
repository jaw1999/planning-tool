import { useState, useEffect, useCallback } from 'react';
import { Consumable } from '@/app/lib/types/system';
import { useNotificationHelpers } from '@/app/lib/contexts/notifications-context';

export function useConsumables(pollingInterval = 30000) {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { notifyError } = useNotificationHelpers();

  const fetchConsumables = useCallback(async (showError = true) => {
    try {
      const response = await fetch('/api/consumables');
      if (!response.ok) {
        throw new Error('Failed to fetch consumables');
      }
      const data = await response.json();
      setConsumables(data);
    } catch (error) {
      console.error('Failed to fetch consumables:', error);
      if (showError) {
        notifyError('Error', 'Failed to load consumables');
      }
    } finally {
      setIsLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchConsumables();

    if (pollingInterval > 0) {
      const interval = setInterval(() => {
        fetchConsumables(false);
      }, pollingInterval);

      return () => clearInterval(interval);
    }
  }, [fetchConsumables, pollingInterval]);

  return {
    consumables,
    isLoading,
    refetch: () => fetchConsumables(true)
  };
} 