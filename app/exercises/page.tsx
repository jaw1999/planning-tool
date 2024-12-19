'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Plus, Calendar, Filter, Search } from 'lucide-react';
import { Exercise } from '@/app/lib/types/system';
import { useExercise, isExerciseListHook } from '@/app/lib/hooks/useExercise';
import Link from 'next/link';

export default function ExercisesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const result = useExercise();

  if (!isExerciseListHook(result)) {
    return <div>Invalid hook type for this page</div>;
  }

  const { exercises, isLoading, error } = result;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading exercises...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || exercise.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      'PLANNING': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
      'APPROVED': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
      'IN_PROGRESS': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100',
      'COMPLETED': 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100',
      'CANCELLED': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Exercises</h1>
        <Link 
          href="/exercises/new"
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Exercise
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Search & Filter</CardTitle>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-muted-foreground hover:text-foreground">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background border-input"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-full ${
                  statusFilter === 'all' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                All
              </button>
              {['PLANNING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full ${
                    statusFilter === status 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((exercise) => (
          <Link key={exercise.id} href={`/exercises/${exercise.id}`}>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{exercise.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(exercise.status)}`}>
                    {exercise.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{exercise.description}</p>
                  
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(exercise.startDate).toLocaleDateString()} - {new Date(exercise.endDate).toLocaleDateString()}
                  </div>
                  
                  {exercise.location && (
                    <div className="flex items-center text-muted-foreground">
                      <span className="font-medium">Location:</span>
                      <span className="ml-2">{exercise.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground">No exercises found</h3>
          <p className="mt-2 text-muted-foreground">Create a new exercise to get started</p>
        </div>
      )}
    </div>
  );
}