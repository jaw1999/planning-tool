import { useState, useEffect } from 'react';
import { System } from '../lib/types/system';

interface UseSystemsReturn {
  systems: System[];
  isLoading: boolean;
  error: string | null;
  createSystem: (data: Partial<System>) => Promise<void>;
  updateSystem: (id: string, data: Partial<System>) => Promise<void>;
  deleteSystem: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSystems(): UseSystemsReturn {
  const [systems, setSystems] = useState<System[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystems = async () => {
    try {
      const response = await fetch('/api/systems');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch systems');
      }
      
      setSystems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystems();
  }, []);

  const createSystem = async (data: Partial<System>) => {
    try {
      const response = await fetch('/api/systems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create system');
      }
      
      await fetchSystems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateSystem = async (id: string, data: Partial<System>) => {
    try {
      const response = await fetch(`/api/systems/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update system');
      }
      
      await fetchSystems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const deleteSystem = async (id: string) => {
    try {
      const response = await fetch(`/api/systems/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete system');
      }
      
      setSystems(systems.filter(system => system.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  return {
    systems,
    isLoading,
    error,
    createSystem,
    updateSystem,
    deleteSystem,
    refetch: fetchSystems,
  };
} 