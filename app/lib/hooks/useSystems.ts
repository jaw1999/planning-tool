import { useState, useEffect } from 'react';
import { System } from '../types/system';

export function useSystems() {
  const [systems, setSystems] = useState<System[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/systems');
      if (!response.ok) throw new Error('Failed to fetch systems');
      const data = await response.json();
      setSystems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch systems');
    } finally {
      setIsLoading(false);
    }
  };

  const createSystem = async (systemData: Partial<System>) => {
    try {
      const response = await fetch('/api/systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemData),
      });
      
      if (!response.ok) throw new Error('Failed to create system');
      
      const newSystem = await response.json();
      setSystems(prev => [...prev, newSystem]);
      return newSystem;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create system');
    }
  };

  const updateSystem = async (id: string, systemData: Partial<System>) => {
    try {
      const response = await fetch('/api/systems', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...systemData }),
      });
      
      if (!response.ok) throw new Error('Failed to update system');
      
      const updatedSystem = await response.json();
      setSystems(prev =>
        prev.map(system => system.id === id ? updatedSystem : system)
      );
      return updatedSystem;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update system');
    }
  };

  useEffect(() => {
    fetchSystems();
  }, []);

  return {
    systems,
    isLoading,
    error,
    createSystem,
    updateSystem,
    refetch: fetchSystems
  };
}