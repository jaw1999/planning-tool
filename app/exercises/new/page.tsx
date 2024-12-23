'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { ExercisePlanner } from '@/app/components/planning/exercise-planner';
import { useSystems } from '@/app/lib/hooks/useSystems';
import { useExercise } from '@/app/lib/hooks/useExercise';
import { ExerciseFormData, isExerciseListHook, Consumable } from '@/app/lib/types/system';
import { useNotificationHelpers } from '@/app/lib/contexts/notifications-context';
import { SystemWithPresets } from '@/app/lib/types/system';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumb } from '@/app/components/ui/breadcrumb';

export default function NewExercisePage() {
  const router = useRouter();
  const { notifySuccess, notifyError } = useNotificationHelpers();
  const result = useExercise();
  const { systems, isLoading: systemsLoading } = useSystems();
  const [systemsWithPresets, setSystemsWithPresets] = useState<SystemWithPresets[]>([]);
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [systemsResponse, consumablesResponse] = await Promise.all([
          fetch('/api/systems?include=consumablePresets'),
          fetch('/api/consumables')
        ]);
        
        const [systemsData, consumablesData] = await Promise.all([
          systemsResponse.json(),
          consumablesResponse.json()
        ]);
        
        setSystemsWithPresets(systemsData);
        setConsumables(consumablesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        notifyError('Error', 'Failed to load required data');
      }
    };
    fetchData();
  }, [notifyError]);

  const fetchConsumables = async () => {
    try {
      const response = await fetch('/api/consumables');
      const data = await response.json();
      setConsumables(data);
    } catch (error) {
      console.error('Failed to fetch consumables:', error);
      notifyError('Error', 'Failed to load consumables');
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchConsumables, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isExerciseListHook(result)) {
    return <div>Invalid hook type for this page</div>;
  }

  const { createExercise } = result;

  const handleSave = async (data: ExerciseFormData) => {
    try {
      setIsSubmitting(true);
      const exercise = await createExercise(data);
      notifySuccess('Success', 'Exercise created successfully');
      router.push(`/exercises/${exercise.id}`);
    } catch (error) {
      console.error('Failed to create exercise:', error);
      notifyError('Error', error instanceof Error ? error.message : 'Failed to create exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/exercises');
  };

  if (systemsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading systems...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={handleCancel}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Exercises
        </button>
        
        <Breadcrumb
          items={[
            { label: 'Exercises', href: '/exercises' },
            { label: 'New Exercise' }
          ]}
        />
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">New Exercise</h1>
        <p className="text-gray-600 mt-2">
          Create a new exercise by filling out the details below and selecting the required systems.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exercise Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <ExercisePlanner
            availableSystems={systemsWithPresets}
            onSave={handleSave}
            isSubmitting={isSubmitting}
            availableConsumables={consumables}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}