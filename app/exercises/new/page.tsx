'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { ExercisePlanner } from '@/app/components/planning/exercise-planner';
import { useSystems } from '@/app/lib/hooks/useSystems';
import { useExercise } from '@/app/lib/hooks/useExercise';
import { ExerciseFormData, isExerciseListHook } from '@/app/lib/types/system';
import { useNotificationHelpers } from '@/app/lib/contexts/notifications-context';
import { SystemWithPresets } from '@/app/lib/types/system';

export default function NewExercisePage() {
  const router = useRouter();
  const { notifySuccess, notifyError } = useNotificationHelpers();
  const result = useExercise();
  const { systems, isLoading: systemsLoading } = useSystems();
  const [systemsWithPresets, setSystemsWithPresets] = useState<SystemWithPresets[]>([]);

  useEffect(() => {
    const fetchSystems = async () => {
      const response = await fetch('/api/systems?include=consumablePresets');
      const data = await response.json();
      setSystemsWithPresets(data);
    };
    fetchSystems();
  }, []);

  if (!isExerciseListHook(result)) {
    return <div>Invalid hook type for this page</div>;
  }

  const { createExercise } = result;

  const handleSave = async (data: ExerciseFormData) => {
    try {
      const exercise = await createExercise(data);
      notifySuccess('Success', 'Exercise created successfully');
      router.push(`/exercises/${exercise.id}`);
    } catch (error) {
      notifyError('Error', 'Failed to create exercise');
    }
  };

  if (systemsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Exercise</h1>
      <ExercisePlanner
        availableSystems={systemsWithPresets}
        onSave={handleSave}
      />
    </div>
  );
}