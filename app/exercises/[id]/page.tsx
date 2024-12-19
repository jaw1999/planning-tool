'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { CostCalculator } from '@/app/components/finance/cost-calculator';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { useExercise, isSingleExerciseHook } from '@/app/lib/hooks/useExercise';
import { Exercise, ExerciseSystem, System } from '@/app/lib/types/system';

const EXERCISE_STATUSES = ['PLANNING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
type ExerciseStatus = typeof EXERCISE_STATUSES[number];

export default function ExerciseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const result = useExercise(params.id as string);

  if (!isSingleExerciseHook(result)) {
    return <div>Invalid hook type for this page</div>;
  }

  const { exercise, updateExerciseStatus, isLoading, error } = result;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading exercise details...</div>
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

  const handleStatusChange = async (newStatus: ExerciseStatus) => {
    try {
      setIsUpdating(true);
      await updateExerciseStatus(exercise.id, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: ExerciseStatus) => {
    const colors = {
      'PLANNING': 'bg-blue-100 text-blue-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.PLANNING;
  };

  const exerciseWithSystems: Exercise & { systems: (ExerciseSystem & { system: System; })[] } = {
    ...exercise,
    systems: exercise.systems || []
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{exercise.name}</h1>
          <p className="text-gray-600 mt-1">{exercise.description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={exercise.status}
            onChange={(e) => handleStatusChange(e.target.value as ExerciseStatus)}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(exercise.status as ExerciseStatus)}`}
          >
            {EXERCISE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          <button
            onClick={() => router.push(`/exercises/${exercise.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit Exercise
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Date Range</div>
                <div className="font-medium">
                  {new Date(exercise.startDate).toLocaleDateString()} - 
                  {new Date(exercise.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Location</div>
                <div className="font-medium">{exercise.location || 'Not specified'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Duration</div>
                <div className="font-medium">
                  {Math.ceil(
                    (new Date(exercise.endDate).getTime() - new Date(exercise.startDate).getTime()) / 
                    (1000 * 60 * 60 * 24)
                  )} days
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Systems</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exerciseWithSystems.systems.map(({ system, quantity, fsrSupport, fsrCost, consumablesCost }) => (
              <div key={system.id} className="border p-4 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{system.name}</h3>
                    <p className="text-sm text-gray-600">{system.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">Quantity: {quantity}</div>
                    <div className="text-sm text-gray-600">
                      FSR Support: {fsrSupport.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {exerciseWithSystems.systems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No systems added to this exercise
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CostCalculator exercise={exerciseWithSystems} />
    </div>
  );
}