'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft, Trash } from 'lucide-react';
import { useExercise, isSingleExerciseHook } from '@/app/lib/hooks/useExercise';
import { useNotificationHelpers } from '@/app/lib/contexts/notifications-context';
import { ExerciseOverview } from '@/app/components/exercises/exercise-overview';
import { SystemCostAnalysis } from '@/app/components/exercises/system-cost-analysis';
import { SystemSupportDetails } from '@/app/components/exercises/system-support-details';
import { Exercise, ExerciseSystem, System, ExerciseStatus } from '@/app/lib/types/system';
import { isBalloonGas } from '@/app/lib/utils/consumables';

const getDurationInMonths = (startDate: string | Date, endDate: string | Date): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
};

export default function ExercisePage() {
  const params = useParams();
  const router = useRouter();
  const { notifySuccess, notifyError } = useNotificationHelpers();
  const result = useExercise(params.id as string);

  if (!isSingleExerciseHook(result)) {
    return <div>Invalid hook type for this page</div>;
  }

  const { exercise, updateExercise, isLoading, error } = result;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !exercise) {
    return <div>Error loading exercise</div>;
  }

  const handleBack = () => {
    router.push('/exercises');
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/exercises/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete exercise');
      notifySuccess('Success', 'Exercise deleted successfully');
      router.push('/exercises');
    } catch (error) {
      notifyError('Error', 'Failed to delete exercise');
    }
  };

  const handleStatusChange = async (newStatus: ExerciseStatus) => {
    try {
      await updateExercise(exercise.id, { status: newStatus });
    } catch (error) {
      console.error('Error updating exercise status:', error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" className="gap-2" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4" />
          Back to Exercises
        </Button>
        
        <Button variant="destructive" className="gap-2" onClick={handleDelete}>
          <Trash className="w-4 h-4" />
          Delete Exercise
        </Button>
      </div>

      <ExerciseOverview 
        exercise={exercise}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}