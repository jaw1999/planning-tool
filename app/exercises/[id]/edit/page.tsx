'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { ExercisePlanner } from '@/app/components/planning/exercise-planner';
import { useSystems } from '@/app/lib/hooks/useSystems';
import { useExercise, isSingleExerciseHook } from '@/app/lib/hooks/useExercise';
import { ExerciseFormData } from '@/app/lib/types/system';
import { useNotification } from '@/app/components/ui/notification/provider';

export default function EditExercisePage() {
  const params = useParams();
  const router = useRouter();
  const { systems } = useSystems();
  const result = useExercise(params.id as string);
  const { showNotification } = useNotification();

  if (!isSingleExerciseHook(result)) {
    return <div>Invalid hook type for this page</div>;
  }

  const { exercise, updateExercise, updateExerciseStatus, deleteExercise, isLoading, error } = result;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading exercise...</div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: Exercise not found</div>
      </div>
    );
  }

  const handleSave = async (formData: ExerciseFormData) => {
    try {
      await updateExercise(exercise.id, formData);
      showNotification({
        title: "Success",
        message: "Exercise updated successfully",
        type: "success"
      });
      router.push(`/exercises/${exercise.id}`);
    } catch (error) {
      console.error('Failed to update exercise:', error);
      showNotification({
        title: "Error",
        message: "Failed to update exercise",
        type: "error"
      });
    }
  };

  const handleCancel = () => {
    router.push(`/exercises/${exercise.id}`);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this exercise? This action cannot be undone.')) {
      try {
        await deleteExercise(exercise.id);
        showNotification({
          title: "Success",
          message: "Exercise deleted successfully",
          type: "success"
        });
        router.push('/exercises');
      } catch (error) {
        console.error('Failed to delete exercise:', error);
        showNotification({
          title: "Error",
          message: "Failed to delete exercise",
          type: "error"
        });
      }
    }
  };

  const handleRevertToPlanning = async () => {
    if (confirm('Are you sure you want to revert this exercise to planning status?')) {
      try {
        await updateExerciseStatus(exercise.id, 'PLANNING');
        showNotification({
          title: "Success",
          message: "Exercise reverted to planning status",
          type: "success"
        });
        router.refresh();
      } catch (error) {
        console.error('Failed to revert exercise status:', error);
        showNotification({
          title: "Error",
          message: "Failed to revert exercise status",
          type: "error"
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Edit Exercise</h1>
          <p className="text-gray-600 mt-1">{exercise.name}</p>
        </div>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exercise Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExercisePlanner
            availableSystems={systems}
            onSave={handleSave}
            initialExercise={exercise}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="text-red-800 font-medium">Delete Exercise</h3>
              <p className="text-red-600 mt-1">
                Once you delete an exercise, there is no going back. Please be certain.
              </p>
              <button
                onClick={handleDelete}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Exercise
              </button>
            </div>

            {exercise.status === 'APPROVED' && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-yellow-800 font-medium">Revert to Planning</h3>
                <p className="text-yellow-600 mt-1">
                  This will move the exercise back to planning status and allow for modifications.
                </p>
                <button
                  onClick={handleRevertToPlanning}
                  className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Revert to Planning
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}