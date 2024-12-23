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
      const text = await response.text();
      
      if (!response.ok) {
        throw new Error(text || response.statusText);
      }
      
      const data = JSON.parse(text);
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
      
      const text = await response.text();
      
      if (!response.ok) {
        throw new Error(text || 'Failed to create system');
      }
      
      const newSystem = JSON.parse(text);
      setSystems(prev => [...prev, newSystem]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create system';
      setError(message);
      throw new Error(message);
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
      
      const text = await response.text();
      
      if (!response.ok) {
        throw new Error(text || 'Failed to update system');
      }
      
      await fetchSystems();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update system';
      setError(message);
      throw new Error(message);
    }
  };

  const deleteSystem = async (id: string) => {
    try {
      const response = await fetch(`/api/systems/${id}`, {
        method: 'DELETE',
      });
      
      const text = await response.text();
      
      if (!response.ok) {
        throw new Error(text || 'Failed to delete system');
      }
      
      setSystems(systems.filter(system => system.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete system';
      setError(message);
      throw new Error(message);
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