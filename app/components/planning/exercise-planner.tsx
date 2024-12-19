'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Exercise, System, FSRType, ExerciseFormData, ExerciseConsumablePreset, SystemWithPresets } from '@/app/lib/types/system';
import { ExerciseStatus } from '@/app/lib/types/system';
import { ConsumablePresetSelector } from '@/app/components/planning/consumable-preset-selector';
import { ConsumableLegendDialog } from '../consumables/consumable-legend-dialog';
import { Button } from '../ui/button';
import { BookOpen } from 'lucide-react';
import { useLeadTimes, LeadTimeItem } from '../../contexts/lead-times-context';
import { addDays, format } from 'date-fns';

interface ExercisePlannerProps {
  availableSystems: SystemWithPresets[];
  initialExercise?: Exercise;
  onSave: (exerciseData: ExerciseFormData) => Promise<void>;
}

interface SelectedSystem {
  systemId: string;
  quantity: number;
  fsrSupport: FSRType;
  fsrCost: number;
  system: System;
  consumablePresets: Array<{
    presetId: string;
    quantity: number;
  }>;
}

interface ExerciseSystem {
  id?: string;
  systemId: string;
  quantity: number;
  fsrSupport: FSRType;
  fsrCost: number;
  system: System;
  consumablePresets: Array<{
    presetId: string;
    quantity: number;
  }>;
}

interface RequiredDate {
  name: string;
  description: string;
  dueDate: string;
  type: LeadTimeItem['type'];
}

export function ExercisePlanner({ availableSystems, initialExercise, onSave }: ExercisePlannerProps) {
  const { leadTimes } = useLeadTimes();
  const [selectedSystems, setSelectedSystems] = useState<SelectedSystem[]>(
    initialExercise?.systems?.map(s => ({
      systemId: s.systemId,
      quantity: s.quantity,
      fsrSupport: s.fsrSupport,
      fsrCost: s.fsrCost || 0,
      system: s.system,
      consumablePresets: s.consumablePresets?.map(cp => ({
        presetId: cp.preset.id,
        quantity: cp.quantity
      }))
    })) || []
  );
  const [exerciseData, setExerciseData] = useState<{
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    totalBudget: number;
    status: ExerciseStatus;
  }>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    totalBudget: 0,
    status: 'PLANNING'
  });

  // Initialize with initial exercise data if provided
  useEffect(() => {
    if (initialExercise) {
      setExerciseData({
        name: initialExercise.name,
        description: initialExercise.description || '',
        startDate: new Date(initialExercise.startDate).toISOString().split('T')[0],
        endDate: new Date(initialExercise.endDate).toISOString().split('T')[0],
        location: initialExercise.location || '',
        totalBudget: initialExercise.totalBudget || 0,
        status: initialExercise.status
      });

      if (initialExercise.systems) {
        setSelectedSystems(
          initialExercise.systems.map(sys => ({
            systemId: sys.systemId,
            quantity: sys.quantity,
            fsrSupport: sys.fsrSupport,
            fsrCost: sys.fsrCost || 0,
            system: sys.system,
            consumablePresets: sys.consumablePresets?.map(cp => ({
              presetId: cp.preset.id,
              quantity: cp.quantity
            })) || []
          }))
        );
      }
    }
  }, [initialExercise]);

  const handleSystemSelect = (system: System) => {
    const existingSystem = selectedSystems.find(s => s.systemId === system.id);
    if (existingSystem) return;

    setSelectedSystems([
      ...selectedSystems,
      {
        systemId: system.id,
        quantity: 1,
        fsrSupport: 'NONE',
        fsrCost: 0,
        system,
        consumablePresets: []
      }
    ]);
  };

  const updateSystemQuantity = (systemId: string, quantity: number) => {
    setSelectedSystems(systems =>
      systems.map(s =>
        s.systemId === systemId
          ? { ...s, quantity: Math.max(1, quantity) }
          : s
      )
    );
  };

  const updateSystemFSR = (systemId: string, fsrType: FSRType, fsrCost: number) => {
    setSelectedSystems(systems =>
      systems.map(s =>
        s.systemId === systemId
          ? { ...s, fsrSupport: fsrType, fsrCost }
          : s
      )
    );
  };

  const removeSystem = (systemId: string) => {
    setSelectedSystems(systems => systems.filter(s => s.systemId !== systemId));
  };

  const updateSystemConsumablePresets = (
    systemId: string, 
    presets: { presetId: string; quantity: number; }[]
  ) => {
    setSelectedSystems(systems =>
      systems.map(s =>
        s.systemId === systemId
          ? { ...s, consumablePresets: presets }
          : s
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData: ExerciseFormData = {
      name: exerciseData.name,
      description: exerciseData.description,
      startDate: new Date(exerciseData.startDate),
      endDate: new Date(exerciseData.endDate),
      location: exerciseData.location,
      status: exerciseData.status,
      totalBudget: exerciseData.totalBudget,
      systems: selectedSystems.map(({ system, ...rest }) => ({
        systemId: rest.systemId,
        quantity: rest.quantity,
        fsrSupport: rest.fsrSupport,
        fsrCost: rest.fsrCost,
        consumablePresets: rest.consumablePresets
      }))
    };

    await onSave(formData);
  };

  // Calculate all required dates based on start date
  const getRequiredDates = (startDate: string): RequiredDate[] => {
    if (!startDate) return [];
    
    const start = new Date(startDate);
    return leadTimes.map((lt: LeadTimeItem) => ({
      name: lt.name,
      description: lt.description,
      dueDate: format(addDays(start, -lt.daysInAdvance), 'yyyy-MM-dd'),
      type: lt.type
    }));
  };

  const requiredDates = getRequiredDates(exerciseData.startDate);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Plan Exercise</h2>
        <ConsumableLegendDialog
          consumables={availableSystems.flatMap(system => 
            system.consumablePresets?.map(preset => preset.consumable) || []
          )}
          onAdd={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Exercise Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={exerciseData.name}
                  onChange={e => setExerciseData(d => ({ ...d, name: e.target.value }))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={exerciseData.location}
                  onChange={e => setExerciseData(d => ({ ...d, location: e.target.value }))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={exerciseData.startDate}
                  onChange={e => setExerciseData(d => ({ ...d, startDate: e.target.value }))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={exerciseData.endDate}
                  onChange={e => setExerciseData(d => ({ ...d, endDate: e.target.value }))}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={exerciseData.description}
                onChange={e => setExerciseData(d => ({ ...d, description: e.target.value }))}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Selected Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedSystems.map(({ system, quantity, fsrSupport, fsrCost }) => (
                <div key={system.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{system.name}</h4>
                      <p className="text-sm text-gray-600">{system.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSystem(system.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={e => updateSystemQuantity(system.id, parseInt(e.target.value))}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">FSR Support</label>
                      <select
                        value={fsrSupport}
                        onChange={e => updateSystemFSR(system.id, e.target.value as FSRType, fsrCost)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="NONE">None</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="BIWEEKLY">Bi-weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </div>
                    {fsrSupport !== 'NONE' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">FSR Cost</label>
                        <input
                          type="number"
                          min="0"
                          value={fsrCost}
                          onChange={e => updateSystemFSR(system.id, fsrSupport, parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    )}
                  </div>
                  <ConsumablePresetSelector
                    systemId={system.id}
                    availablePresets={system.consumablePresets || []}
                    selectedPresets={
                      selectedSystems.find(s => s.systemId === system.id)?.consumablePresets || []
                    }
                    onPresetsChange={updateSystemConsumablePresets}
                  />
                </div>
              ))}
            </div>
            {selectedSystems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No systems selected. Choose systems from the catalog below.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSystems
                .filter(sys => !selectedSystems.some(s => s.systemId === sys.id))
                .map(system => (
                  <div
                    key={system.id}
                    onClick={() => handleSystemSelect(system)}
                    className="border p-4 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <h4 className="font-medium">{system.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{system.description}</p>
                    <div className="mt-2 text-sm">
                      <div className="text-gray-500">Base Price: ${system.basePrice.toLocaleString()}</div>
                      {system.hasLicensing && (
                        <div className="text-gray-500">License: ${system.licensePrice?.toLocaleString()}/mo</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Required Lead Times</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requiredDates.map((date: RequiredDate, index: number) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${
                    new Date(date.dueDate) < new Date() ? 'border-red-500 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{date.name}</h3>
                      <p className="text-sm text-gray-600">{date.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        Due by: {format(new Date(date.dueDate), 'MMM d, yyyy')}
                      </div>
                      <div className={`text-sm ${
                        new Date(date.dueDate) < new Date() ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {new Date(date.dueDate) < new Date() ? 'Overdue' : date.type}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {requiredDates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No lead times configured. Add them in Settings.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={selectedSystems.length === 0}
          >
            Create Exercise
          </button>
        </div>
      </form>
    </div>
  );
}