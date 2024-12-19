import { useState, useEffect } from 'react';
import { Equipment } from '@/app/lib/types/equipment';

interface UseEquipmentReturn {
  equipment: Equipment[];
  isLoading: boolean;
  error: string | null;
  createEquipment: (data: Partial<Equipment>) => Promise<void>;
  updateEquipment: (id: string, data: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
}

export function useEquipment(): UseEquipmentReturn {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = async (): Promise<void> => {
    try {
      const response = await fetch('/api/equipment');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch equipment');
      }
      
      setEquipment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const createEquipment = async (data: Partial<Equipment>) => {
    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create equipment');
      }
      
      await fetchEquipment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateEquipment = async (id: string, data: Partial<Equipment>) => {
    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update equipment');
      }
      
      await fetchEquipment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete equipment');
      }
      
      await fetchEquipment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  return {
    equipment,
    isLoading,
    error,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  };
} 