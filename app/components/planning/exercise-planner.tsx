'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Exercise, FSRType, ExerciseFormData, ExerciseConsumablePreset, SystemWithPresets, Consumable, ConsumablePreset } from '@/app/lib/types/system';
import { ExerciseSystem, System, ExerciseStatus } from '@/app/lib/types/system';
import { ConsumablePresetSelector } from '@/app/components/planning/consumable-preset-selector';
import { ConsumableLegendDialog } from '../consumables/consumable-legend-dialog';
import { Button } from '../ui/button';
import { BookOpen } from 'lucide-react';
import { useLeadTimes, LeadTimeItem } from '../../contexts/lead-times-context';
import { addDays, format, subDays } from 'date-fns';
import { CostCalculator } from '../finance/cost-calculator';
import { CalculatedResults } from '@/app/lib/types/calculator';
import { ConsumableSelector } from './consumable-selector';
import { calculateSystemCosts } from '@/app/lib/utils/cost';
import { isBalloonGas } from '@/app/lib/utils/consumables';

interface ExercisePlannerProps {
  availableSystems: SystemWithPresets[];
  initialExercise?: Exercise;
  onSave: (data: ExerciseFormData) => Promise<void>;
  isSubmitting: boolean;
  availableConsumables: Consumable[];
  onCancel: () => void;
}

interface SelectedSystem {
  systemId: string;
  fsrType: FSRType;
  quantity: number;
  fsrCost: number;
  system: SystemWithPresets;
  consumablePresets: Array<{
    id: string;
    exerciseSystemId: string;
    presetId: string;
    quantity: number;
    preset: ConsumablePreset;
    createdAt: Date;
    updatedAt: Date;
  }>;
  consumables: Array<{
    id: string;
    quantity: number;
  }>;
  launchesPerDay?: number;
}

interface ExerciseConsumable {
  id: string;
  consumableId: string;
  quantity: number;
  systemId?: string;
}

interface RequiredDate {
  name: string;
  description: string;
  dueDate: string;
  type: LeadTimeItem['type'];
}

interface ConsumableDetail {
  name: string;
  quantity: number;
  unitCost: number;
  monthlyCost: number;
  isPerLaunch: boolean;
  launchesPerDay: number;
}

export function ExercisePlanner({ 
  availableSystems, 
  initialExercise, 
  onSave, 
  isSubmitting, 
  availableConsumables,
  onCancel 
}: ExercisePlannerProps) {
  const { leadTimes } = useLeadTimes();
  const [selectedSystems, setSelectedSystems] = useState<SelectedSystem[]>([]);

  // Add debug logging
  useEffect(() => {
    console.debug('[ExercisePlanner] Props changed:', {
      systemsCount: availableSystems?.length,
      hasInitialExercise: !!initialExercise,
      isSubmitting
    });
  }, [availableSystems, initialExercise, isSubmitting]);

  const [exerciseConsumables, setExerciseConsumables] = useState<ExerciseConsumable[]>(
    initialExercise?.systems?.flatMap(sys => 
      (sys.consumablePresets || []).map(cp => ({
        id: crypto.randomUUID(),
        consumableId: cp.presetId,
        quantity: cp.quantity,
        systemId: sys.systemId
      }))
    ) || []
  );

  const [exerciseData, setExerciseData] = useState<{
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    totalBudget: number;
    status: ExerciseStatus;
    launchesPerDay?: number;
  }>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    totalBudget: 0,
    status: 'PLANNING'
  });

  useEffect(() => {
    if (!initialExercise) return;

    const updates = {
      exerciseData: {
        name: initialExercise.name,
        description: initialExercise.description || '',
        startDate: new Date(initialExercise.startDate).toISOString().split('T')[0],
        endDate: new Date(initialExercise.endDate).toISOString().split('T')[0],
        location: initialExercise.location || '',
        totalBudget: initialExercise.totalBudget || 0,
        status: initialExercise.status,
        launchesPerDay: initialExercise.launchesPerDay
      },
      systems: initialExercise.systems?.map(sys => ({
        systemId: sys.systemId,
        fsrType: sys.fsrSupport,
        quantity: sys.quantity,
        fsrCost: sys.fsrCost || 0,
        system: availableSystems.find(s => s.id === sys.systemId) as SystemWithPresets,
        consumablePresets: sys.consumablePresets || [],
        consumables: sys.consumablePresets?.map(preset => ({
          id: preset.presetId,
          quantity: preset.quantity
        })) || [],
        ...(sys.launchesPerDay ? { launchesPerDay: sys.launchesPerDay } : {})
      })) || []
    };

    setExerciseData(updates.exerciseData);
    setSelectedSystems(updates.systems);
  }, [initialExercise, availableSystems]);

  const handleSystemSelect = (system: SystemWithPresets) => {
    const existingSystem = selectedSystems.find(s => s.systemId === system.id);
    if (existingSystem) return;

    setSelectedSystems([
      ...selectedSystems,
      {
        systemId: system.id,
        fsrType: 'NONE',
        quantity: 1,
        fsrCost: 0,
        system,
        consumablePresets: [],
        consumables: []
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
          ? { ...s, fsrType, fsrCost }
          : s
      )
    );
  };

  const removeSystem = (systemId: string) => {
    setSelectedSystems(systems => systems.filter(s => s.systemId !== systemId));
  };

  const updateSystemConsumablePresets = (
    systemId: string,
    presets: Array<{ presetId: string; quantity: number }>
  ) => {
    setSelectedSystems(systems =>
      systems.map(s =>
        s.systemId === systemId
          ? {
              ...s,
              consumables: presets.map(p => ({
                id: p.presetId,
                quantity: p.quantity
              })),
              consumablePresets: presets.map(p => {
                const preset = availableConsumables.find(c => c.id === p.presetId);
                if (!preset) return null;
                
                const now = new Date();
                return {
                  id: crypto.randomUUID(),
                  exerciseSystemId: systemId,
                  presetId: p.presetId,
                  quantity: p.quantity,
                  preset: {
                    id: preset.id,
                    name: preset.name,
                    description: preset.description,
                    consumableId: preset.id,
                    quantity: p.quantity,
                    consumable: preset,
                    notes: preset.notes,
                    createdAt: now,
                    updatedAt: now
                  },
                  createdAt: now,
                  updatedAt: now
                };
              }).filter((p): p is NonNullable<typeof p> => p !== null)
            }
          : s
      )
    );
  };

  const getDurationInMonths = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
  };

  const calculateSystemCosts = (selectedSystem: SelectedSystem) => {
    const baseHardwareCost = (selectedSystem.system.basePrice || 0) * selectedSystem.quantity;
    const monthlyFSRCost = selectedSystem.fsrType !== 'NONE' ? (selectedSystem.fsrCost || 0) : 0;
    
    const hasBalloonGas = selectedSystem.consumables.some(consumable => {
      const fullConsumable = availableConsumables.find(c => c.id === consumable.id);
      return fullConsumable && isBalloonGas(fullConsumable.name);
    });
    
    const monthlyConsumablesCost = selectedSystem.consumables.reduce((total, systemConsumable) => {
      const consumable = availableConsumables.find(c => c.id === systemConsumable.id);
      if (!consumable) return total;
      
      let quantity = systemConsumable.quantity;
      if (isBalloonGas(consumable.name)) {
        quantity = selectedSystem.launchesPerDay !== undefined ? quantity * selectedSystem.launchesPerDay * 30 : 0;
      }
      
      return total + (consumable.currentUnitCost * quantity);
    }, 0);

    const totalMonthlyRecurring = monthlyFSRCost + monthlyConsumablesCost;
    const duration = getDurationInMonths(exerciseData.startDate, exerciseData.endDate);
    const totalForDuration = baseHardwareCost + (totalMonthlyRecurring * duration);

    return {
      system: selectedSystem.system.name,
      baseHardwareCost,
      monthlyRecurring: totalMonthlyRecurring,
      totalForDuration,
      duration,
      ...(hasBalloonGas ? { launchesPerDay: selectedSystem.launchesPerDay } : {}),
      consumablesCost: monthlyConsumablesCost,
      fsrCost: monthlyFSRCost
    };
  };

  const [calculatedCosts, setCalculatedCosts] = useState<CalculatedResults>({
    totalCost: 0,
    monthlyRecurring: 0,
    oneTimeCosts: 0,
    systemCosts: [],
    additionalCosts: []
  });

  useEffect(() => {
    if (!exerciseData.startDate || !exerciseData.endDate || selectedSystems.length === 0) {
      setCalculatedCosts({
        totalCost: 0,
        monthlyRecurring: 0,
        oneTimeCosts: 0,
        systemCosts: [],
        additionalCosts: []
      });
      return;
    }

    const duration = getDurationInMonths(exerciseData.startDate, exerciseData.endDate);
    
    const systemCosts = selectedSystems.map(sys => {
      const baseHardwareCost = (sys.system.basePrice || 0) * sys.quantity;
      const monthlyFSRCost = sys.fsrType !== 'NONE' ? (sys.fsrCost || 0) : 0;
      const launchesPerDay = sys.launchesPerDay;
      
      const monthlyConsumablesCost = sys.consumables.reduce((total, systemConsumable) => {
        const consumable = availableConsumables.find(c => c.id === systemConsumable.id);
        if (!consumable) return total;
        
        let quantity = systemConsumable.quantity;
        if (consumable.name.toLowerCase().includes('helium') || 
            consumable.name.toLowerCase().includes('hydrogen')) {
          quantity = launchesPerDay !== undefined ? quantity * launchesPerDay * 30 : 0;
        }
        
        return total + (consumable.currentUnitCost * quantity);
      }, 0);

      const totalMonthlyRecurring = monthlyFSRCost + monthlyConsumablesCost;
      const totalForDuration = baseHardwareCost + (totalMonthlyRecurring * duration);

      return {
        systemName: sys.system.name,
        system: sys.system,
        baseHardwareCost,
        fsrCost: monthlyFSRCost,
        consumablesCost: monthlyConsumablesCost,
        monthlyConsumablesCost,
        totalMonthlyRecurring,
        totalForDuration,
        totalCost: totalForDuration,
        duration,
        ...(launchesPerDay !== undefined ? { launchesPerDay } : {}),
        consumableBreakdown: []
      };
    });

    const monthlyRecurring = systemCosts.reduce((acc, cost) => acc + cost.totalMonthlyRecurring, 0);
    const oneTimeCosts = systemCosts.reduce((acc, cost) => acc + cost.baseHardwareCost, 0);
    const totalCost = systemCosts.reduce((acc, cost) => acc + cost.totalForDuration, 0);

    setCalculatedCosts({
      totalCost,
      monthlyRecurring,
      oneTimeCosts,
      systemCosts,
      additionalCosts: []
    });
  }, [selectedSystems, exerciseData.startDate, exerciseData.endDate, exerciseData.launchesPerDay, availableConsumables]);

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
      launchesPerDay: exerciseData.launchesPerDay,
      systems: selectedSystems.map(sys => ({
        systemId: sys.systemId,
        quantity: sys.quantity,
        fsrSupport: sys.fsrType,
        fsrCost: sys.fsrCost,
        ...(sys.launchesPerDay ? { launchesPerDay: sys.launchesPerDay } : {}),
        consumablePresets: sys.consumables.map(consumable => {
          const preset = availableConsumables.find(c => c.id === consumable.id);
          if (!preset) return null;
          
          return {
            presetId: preset.id,
            quantity: consumable.quantity
          };
        }).filter((p): p is NonNullable<typeof p> => p !== null)
      }))
    };

    await onSave(formData);
  };

  // Calculate all required dates based on start date
  const requiredDates = useMemo(() => {
    if (!exerciseData.startDate || selectedSystems.length === 0) return [];
    
    return selectedSystems.flatMap(sys => 
      leadTimes.map(lt => ({
        name: `${sys.system.name} - ${lt.name}`,
        description: lt.description,
        dueDate: format(subDays(new Date(exerciseData.startDate), lt.daysInAdvance), 'yyyy-MM-dd'),
        type: lt.type
      }))
    );
  }, [leadTimes, selectedSystems, exerciseData.startDate]);

  const handleAddConsumable = async (consumable: Consumable): Promise<void> => {
    try {
      const response = await fetch('/api/consumables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consumable),
      });
      
      if (!response.ok) throw new Error('Failed to add consumable');
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to add consumable:', error);
      return Promise.reject(error);
    }
  };

  const handleUpdateConsumable = async (id: string, updates: Partial<Consumable>): Promise<void> => {
    try {
      const response = await fetch(`/api/consumables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update consumable');
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to update consumable:', error);
      return Promise.reject(error);
    }
  };

  const handleDeleteConsumable = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/consumables/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete consumable');
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to delete consumable:', error);
      return Promise.reject(error);
    }
  };

  const handleConsumablesChange = (consumables: Array<{ id: string; quantity: number }>, systemId?: string) => {
    if (systemId) {
      setSelectedSystems(systems =>
        systems.map(s =>
          s.systemId === systemId
            ? { ...s, consumables }
            : s
        )
      );
    } else {
      setExerciseConsumables(consumables.map(c => ({
        id: c.id,
        consumableId: c.id,
        quantity: c.quantity
      })));
    }
  };

  const updateSystem = (systemId: string, updates: Partial<SelectedSystem>) => {
    setSelectedSystems(systems =>
      systems.map(s =>
        s.systemId === systemId
          ? { ...s, ...updates }
          : s
      )
    );
  };

  const updateSystemLaunches = (systemId: string, launches: number) => {
    setSelectedSystems(systems =>
      systems.map(s =>
        s.systemId === systemId
          ? { ...s, launchesPerDay: launches }
          : s
      )
    );
  };

  const handleSave = async () => {
    const systems = selectedSystems.map(sys => ({
      systemId: sys.systemId,
      quantity: sys.quantity,
      fsrSupport: sys.fsrType,
      fsrCost: sys.fsrCost,
      ...(sys.launchesPerDay ? { launchesPerDay: sys.launchesPerDay } : {}),
      consumablePresets: sys.consumables.map(consumable => {
        const preset = availableConsumables.find(c => c.id === consumable.id);
        if (!preset) return null;
        
        return {
          presetId: preset.id,
          quantity: consumable.quantity
        };
      }).filter((p): p is NonNullable<typeof p> => p !== null)
    }));

    await onSave({
      ...exerciseData,
      startDate: new Date(exerciseData.startDate),
      endDate: new Date(exerciseData.endDate),
      systems
    });
  };

  const handleConsumableAdd = (systemId: string, consumableId: string, quantity: number) => {
    const consumable = availableConsumables.find(c => c.id === consumableId);
    const hasBalloonGas = consumable && isBalloonGas(consumable.name);

    setSelectedSystems(prev => prev.map(sys => {
      if (sys.systemId !== systemId) return sys;

      const needsLaunches = hasBalloonGas && 
        !sys.consumables.some(c => {
          const existing = availableConsumables.find(ac => ac.id === c.id);
          return existing && isBalloonGas(existing.name);
        });

      return {
        ...sys,
        consumables: [...sys.consumables, { id: consumableId, quantity }],
        ...(needsLaunches ? { launchesPerDay: 1 } : {})
      };
    }));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Exercise Details</CardTitle>
              <ConsumableLegendDialog
                consumables={availableConsumables}
                onAdd={handleAddConsumable}
                onUpdate={handleUpdateConsumable}
                onDelete={handleDeleteConsumable}
              />
            </div>
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
              {selectedSystems.map((selectedSystem) => (
                <div key={selectedSystem.systemId} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{selectedSystem.system.name}</h4>
                      <p className="text-sm text-gray-600">{selectedSystem.system.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSystem(selectedSystem.systemId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedSystem.quantity}
                      onChange={(e) => updateSystemQuantity(selectedSystem.systemId, parseInt(e.target.value))}
                      className="w-24 p-2 border rounded"
                    />
                  </div>
                  <div className="mt-4">
                    <ConsumableSelector
                      availableConsumables={availableConsumables}
                      selectedConsumables={selectedSystem.consumables || []}
                      onConsumablesChange={(consumables) => {
                        updateSystem(selectedSystem.systemId, {
                          consumables,
                          consumablePresets: consumables.map(c => {
                            const preset = availableConsumables.find(ac => ac.id === c.id);
                            if (!preset) return null;
                            const now = new Date();
                            return {
                              id: crypto.randomUUID(),
                              exerciseSystemId: selectedSystem.systemId,
                              presetId: c.id,
                              quantity: c.quantity,
                              preset: {
                                id: preset.id,
                                name: preset.name,
                                consumableId: preset.id,
                                quantity: c.quantity,
                                consumable: preset,
                                createdAt: now,
                                updatedAt: now
                              },
                              createdAt: now,
                              updatedAt: now
                            };
                          }).filter((p): p is NonNullable<typeof p> => p !== null)
                        });
                      }}
                    />
                  </div>
                  {selectedSystem.consumables.some(c => {
                    const consumable = availableConsumables.find(ac => ac.id === c.id);
                    return consumable?.name.toLowerCase().includes('helium') || 
                           consumable?.name.toLowerCase().includes('hydrogen');
                  }) && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-1">
                        Launches per Day
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={selectedSystem.launchesPerDay ?? 0}
                        onChange={(e) => {
                          const launches = Math.max(0, parseInt(e.target.value) || 0);
                          updateSystemLaunches(selectedSystem.systemId, launches);
                        }}
                        className="w-24 p-2 border rounded"
                      />
                    </div>
                  )}
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
            <CardTitle>Exercise Consumables Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableConsumables
                .filter(consumable => 
                  selectedSystems.some(sys => 
                    sys.consumables.some(c => c.id === consumable.id)
                  )
                )
                .map(consumable => {
                  const totalQuantity = selectedSystems.reduce((sum, sys) => {
                    const systemConsumable = sys.consumables.find(c => c.id === consumable.id);
                    if (!systemConsumable) return sum;
                    
                    let quantity = systemConsumable.quantity;
                    if (consumable.name.toLowerCase().includes('helium') || 
                        consumable.name.toLowerCase().includes('hydrogen')) {
                      quantity = sys.launchesPerDay ? quantity * sys.launchesPerDay * 30 : 0;
                    }
                    return sum + quantity;
                  }, 0);

                  if (totalQuantity === 0) return null;

                  const duration = getDurationInMonths(exerciseData.startDate, exerciseData.endDate);
                  const monthlyTotal = totalQuantity * consumable.currentUnitCost;
                  const totalForDuration = monthlyTotal * duration;

                  return (
                    <div key={consumable.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <span className="font-medium">{consumable.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          (Monthly Usage)
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {totalQuantity} {consumable.unit}
                        </div>
                        <div className="text-sm text-gray-500">
                          Monthly: ${monthlyTotal.toLocaleString()}
                        </div>
                        {duration > 1 && (
                          <div className="text-sm text-gray-500">
                            Total: ${totalForDuration.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
                .filter(Boolean)}
            </div>
            {!selectedSystems.some(sys => sys.consumables.length > 0) && (
              <div className="text-center py-4 text-gray-500">
                No consumables added to any systems yet.
              </div>
            )}
          </CardContent>
        </Card>

        <CostCalculator calculatedResults={calculatedCosts} />

        <Card>
          <CardHeader>
            <CardTitle>Available Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSystems
                .filter(sys => !selectedSystems.some(s => s.systemId === sys.id))
                .map(system => {
                  const hasBalloonGas = system.consumablePresets?.some(preset => {
                    const consumable = availableConsumables.find(c => c.id === preset.consumableId);
                    return consumable?.name.toLowerCase().includes('helium') || 
                           consumable?.name.toLowerCase().includes('hydrogen');
                  });

                  return (
                    <div
                      key={system.id}
                      className="border p-4 rounded-lg hover:bg-gray-50"
                    >
                      <h4 className="font-medium">{system.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{system.description}</p>
                      <div className="mt-2 text-sm">
                        <div className="text-gray-500">Base Price: ${system.basePrice.toLocaleString()}</div>
                        {system.hasLicensing && (
                          <div className="text-gray-500">License: ${system.licensePrice?.toLocaleString()}/mo</div>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleSystemSelect(system)}
                        className="mt-4 w-full"
                      >
                        Add System
                      </Button>
                    </div>
                  );
                })}
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

        <div className="flex justify-between space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={selectedSystems.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : initialExercise ? 'Save Changes' : 'Create Exercise'}
          </button>
        </div>
      </form>
    </div>
  );
}