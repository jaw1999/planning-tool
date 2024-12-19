import { useState, useEffect } from 'react';
import { Exercise, ExerciseFormData } from '../types/system';
import { useRouter } from 'next/navigation';

interface ExerciseListHook {
  type: 'list';
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;
  createExercise: (exerciseData: ExerciseFormData) => Promise<Exercise>;
  refetch: () => Promise<void>;
}

interface SingleExerciseHook {
  type: 'single';
  exercise: Exercise | null;
  isLoading: boolean;
  error: string | null;
  updateExerciseStatus: (id: string, status: string) => Promise<void>;
  updateExercise: (id: string, data: any) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export type ExerciseHookResult = ExerciseListHook | SingleExerciseHook;

export function isExerciseListHook(result: ExerciseHookResult): result is ExerciseListHook {
  return result.type === 'list';
}

export function isSingleExerciseHook(result: ExerciseHookResult): result is SingleExerciseHook {
  return result.type === 'single';
}

export function useExercise(exerciseId?: string): ExerciseHookResult {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/exercises');
      if (!response.ok) throw new Error('Failed to fetch exercises');
      const data = await response.json();
      setExercises(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exercises');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSingleExercise = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/exercises/${id}`);
      if (!response.ok) throw new Error('Failed to fetch exercise');
      const data = await response.json();
      setExercise(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exercise');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (exerciseId) {
      fetchSingleExercise(exerciseId);
    } else {
      fetchExercises();
    }
  }, [exerciseId]);

  const createExercise = async (exerciseData: ExerciseFormData) => {
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData),
      });
      
      if (!response.ok) throw new Error('Failed to create exercise');
      
      const newExercise = await response.json();
      setExercises(prev => [...prev, newExercise]);
      return newExercise;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create exercise');
    }
  };

  const updateExerciseStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update exercise status');
      const updatedExercise = await response.json();
      setExercise(updatedExercise);
      router.refresh();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update exercise status');
    }
  };

  const updateExercise = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update exercise');
      const updatedExercise = await response.json();
      setExercise(updatedExercise);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update exercise');
    }
  };

  const deleteExercise = async (id: string) => {
    try {
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete exercise');
      setExercises(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete exercise');
    }
  };

  if (exerciseId) {
    return {
      type: 'single',
      exercise,
      isLoading,
      error,
      updateExerciseStatus,
      updateExercise,
      deleteExercise,
      refetch: () => fetchSingleExercise(exerciseId),
    };
  }

  return {
    type: 'list',
    exercises,
    isLoading,
    error,
    createExercise,
    refetch: fetchExercises,
  };
}