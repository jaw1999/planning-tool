'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Calculator, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useSystems } from '../lib/hooks/useSystems';
import { CostCalculator } from '../components/finance/cost-calculator';
import { CostConfirmationModal } from './cost-confirmation-modal';
import { System } from '@/app/lib/types/system';

interface FSRSupport {
  available: boolean;
  monthlyCost: number;
  weeklyMultiplier: number;
  biweeklyMultiplier: number;
}

type SystemType = System;

interface SystemInput {
  system: SystemType | null;
  quantity: number;
  duration: number;
  hasFSR: boolean;
  fsrFrequency: 'none' | 'weekly' | 'biweekly' | 'monthly';
  fsrBaseCost: number;
  fsrCostPeriod: 'monthly';
  hasConsumables: boolean;
  consumables: Array<{
    description: string;
    unitCost: number;
    unitsPerMonth: number;
    type: 'BALLOON_GAS' | 'OTHER';
  }>;
  launchesPerDay: number;
}

interface AdditionalCost {
  description: string;
  amount: number;
  isRecurring: boolean;
}

interface CalculatorInputs {
  systems: SystemInput[];
  additionalCosts: AdditionalCost[];
}

interface CalculatedResults {
  totalCost: number;
  monthlyRecurring: number;
  oneTimeCosts: number;
  systemCosts: Array<{
    systemName: string;
    baseHardwareCost: number;
    fsrCost: number;
    consumablesCost: number;
    totalMonthlyRecurring: number;
    totalForDuration: number;
    duration: number;
    launchesPerDay?: number;
    monthlyConsumablesCost: number;
  }>;
  additionalCosts: Array<{
    description: string;
    amount: number;
    isRecurring: boolean;
    totalForDuration: number;
  }>;
}

interface ConfirmationModalState {
  open: boolean;
  fieldName: string;
  systemName: string;
  currentValue: number;
  onConfirm: (value: number) => void;
}

interface FSRConfig {
  frequency: 'none' | 'weekly' | 'biweekly' | 'monthly';
  baseCost: number;
  multipliers: {
    weekly: number;
    biweekly: number;
    monthly: number;
  };
}

interface ConsumableInput {
  description: string;
  unitCost: number;
  unitsPerMonth: number;
  type: 'BALLOON_GAS' | 'OTHER';
}

const defaultInputs: CalculatorInputs = {
  systems: [
    {
      system: null,
      quantity: 1,
      duration: 12,
      hasFSR: false,
      fsrFrequency: 'none',
      fsrBaseCost: 0,
      fsrCostPeriod: 'monthly',
      hasConsumables: false,
      consumables: [],
      launchesPerDay: 1,
    },
  ],
  additionalCosts: [],
};

const defaultFSRConfig: FSRConfig = {
  frequency: 'monthly',
  baseCost: 0,
  multipliers: {
    weekly: 4,
    biweekly: 2,
    monthly: 1
  }
};

// Add helper function to convert FSR costs between frequencies
const convertFSRCost = (
  cost: number,
  fromFrequency: SystemInput['fsrFrequency'],
  toFrequency: SystemInput['fsrFrequency']
): number => {
  if (cost === 0 || !cost || fromFrequency === 'none' || toFrequency === 'none') {
    return 0;
  }

  // Convert everything to monthly first
  let monthlyRate = cost;
  if (fromFrequency === 'weekly') {
    monthlyRate = cost * 4;
  } else if (fromFrequency === 'biweekly') {
    monthlyRate = cost * 2;
  }

  // Then convert to target frequency
  if (toFrequency === 'weekly') {
    return monthlyRate / 4;
  } else if (toFrequency === 'biweekly') {
    return monthlyRate / 2;
  }
  return monthlyRate;
};

const validateCosts = (input: SystemInput): string[] => {
  const errors: string[] = [];
  
  if (input.quantity < 1) {
    errors.push('Quantity must be at least 1');
  }
  
  if (input.duration < 1) {
    errors.push('Duration must be at least 1 month');
  }
  
  if (input.hasFSR && input.fsrBaseCost < 0) {
    errors.push('FSR cost cannot be negative');
  }
  
  return errors;
};

export default function CalculatorPage() {
  const { systems: availableSystems } = useSystems();
  const [inputs, setInputs] = useState<CalculatorInputs>(defaultInputs);
  const [results, setResults] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
    open: false,
    fieldName: '',
    systemName: '',
    currentValue: 0,
    onConfirm: () => {},
  });

  const handleAddSystem = () => {
    setInputs((prev) => ({
      ...prev,
      systems: [
        ...prev.systems,
        {
          system: null,
          quantity: 1,
          duration: 12,
          hasFSR: false,
          fsrFrequency: 'none',
          fsrBaseCost: 0,
          fsrCostPeriod: 'monthly',
          hasConsumables: false,
          consumables: [],
          launchesPerDay: 1,
        },
      ],
    }));
  };

  const handleRemoveSystem = (index: number) => {
    setInputs((prev) => ({
      ...prev,
      systems: prev.systems.filter((_, i) => i !== index),
    }));
  };

  const handleSystemChange = (
    index: number,
    field: keyof SystemInput,
    value: SystemType | null | number | boolean | 'none' | 'weekly' | 'biweekly' | 'monthly'
  ) => {
    setInputs((prev) => {
      const newInputs = { ...prev };
      const system = { ...newInputs.systems[index] };

      if (field === 'system') {
        const equipment = value as SystemType;
        system.system = equipment;
        if (equipment?.fsrSupport?.available) {
          system.hasFSR = true;
          system.fsrFrequency = 'monthly';
          system.fsrBaseCost = equipment.fsrSupport.monthlyCost;
        }
      } else {
        (system[field] as any) = value;
      }

      newInputs.systems[index] = system;
      return newInputs;
    });
  };

  const handleSystemSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSystem = availableSystems.find(
      (s) => s.id === event.target.value
    );
    
    if (!selectedSystem) return;
    
    const index = inputs.systems.length - 1;
    handleSystemChange(index, 'system', selectedSystem);
  };

  const handleAddCost = () => {
    setInputs((prev) => ({
      ...prev,
      additionalCosts: [
        ...prev.additionalCosts,
        {
          description: '',
          amount: 0,
          isRecurring: false,
        },
      ],
    }));
  };

  const handleRemoveCost = (index: number) => {
    setInputs((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts.filter((_, i) => i !== index),
    }));
  };

  const calculateCosts = async () => {
    // Add validation before calculation
    const errors: string[] = [];
    
    inputs.systems.forEach((input, index) => {
      const inputErrors = validateCosts(input);
      if (inputErrors.length > 0) {
        errors.push(`System ${index + 1}: ${inputErrors.join(', ')}`);
      }
    });
    
    if (errors.length > 0) {
      // Show errors to user (implement error display UI)
      return;
    }
    
    // Validate FSR costs if enabled
    for (const input of inputs.systems) {
      if (!input.system || !input.hasFSR) continue;

      const systemName = input.system.name || 'Unknown System';

      if (input.hasFSR && (!input.fsrBaseCost || isNaN(input.fsrBaseCost))) {
        await new Promise<void>((resolve) => {
          setConfirmationModal({
            open: true,
            fieldName: 'FSR Support Cost',
            systemName,
            currentValue: 0,
            onConfirm: (value) => {
              handleSystemChange(inputs.systems.indexOf(input), 'fsrBaseCost', value);
              setConfirmationModal(prev => ({ ...prev, open: false }));
              resolve();
            }
          });
        });
      }
    }

    const calculatedResults: CalculatedResults = {
      totalCost: 0,
      monthlyRecurring: 0,
      oneTimeCosts: 0,
      systemCosts: inputs.systems
        .map((input) => {
          if (!input.system) return null;

          const baseHardwareCost = input.system.basePrice * input.quantity;
          const hasBalloonGas = input.consumables?.some(c => c.type === 'BALLOON_GAS');
          
          let fsrCost = 0;
          if (input.hasFSR && input.system?.fsrSupport?.available) {
            const monthlyCost = input.system.fsrSupport.monthlyCost;
            switch (input.fsrFrequency) {
              case 'weekly':
                fsrCost = monthlyCost * input.system.fsrSupport.weeklyMultiplier;
                break;
              case 'biweekly':
                fsrCost = monthlyCost * input.system.fsrSupport.biweeklyMultiplier;
                break;
              case 'monthly':
                fsrCost = monthlyCost;
                break;
            }
          }

          const monthlyConsumablesCost = input.hasConsumables
            ? input.consumables.reduce((total, consumable: ConsumableInput) => {
                let quantity = consumable.unitsPerMonth;
                if (consumable.type === 'BALLOON_GAS') {
                  quantity = input.launchesPerDay ? quantity * input.launchesPerDay * 30 : 0;
                }
                return total + (consumable.unitCost * quantity);
              }, 0)
            : 0;

          const totalMonthlyRecurring = fsrCost + monthlyConsumablesCost;
          const totalForDuration = baseHardwareCost + (totalMonthlyRecurring * input.duration);

          return {
            systemName: input.system.name,
            baseHardwareCost,
            fsrCost,
            consumablesCost: monthlyConsumablesCost,
            totalMonthlyRecurring,
            totalForDuration,
            duration: input.duration,
            ...(hasBalloonGas ? { launchesPerDay: input.launchesPerDay } : {}),
            monthlyConsumablesCost
          };
        })
        .filter((result): result is NonNullable<typeof result> => result !== null),
      additionalCosts: []
    };

    // Calculate totals
    calculatedResults.monthlyRecurring = calculatedResults.systemCosts.reduce(
      (acc: number, cost) => acc + cost.totalMonthlyRecurring,
      0
    );

    calculatedResults.oneTimeCosts = calculatedResults.systemCosts.reduce(
      (acc: number, cost) => acc + cost.baseHardwareCost,
      0
    );

    calculatedResults.totalCost =
      calculatedResults.systemCosts.reduce(
        (acc: number, cost) => acc + cost.totalForDuration,
        0
      ) +
      calculatedResults.additionalCosts.reduce(
        (acc: number, cost) => acc + cost.totalForDuration,
        0
      );

    setResults(calculatedResults);
    setShowDetails(true);
  };

  const calculateFSRCost = (config: FSRConfig): number => {
    if (config.frequency === 'none') return 0;
    
    const multiplier = config.multipliers[config.frequency];
    return Math.round((config.baseCost * multiplier) * 100) / 100;
  };

  const saveCalculation = () => {
    console.log('Saving calculation:', { inputs, results });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-foreground">Cost Calculator</h1>
        <div className="space-x-4">
          <button
            onClick={calculateCosts}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold shadow-md hover:opacity-90 transition-all"
          >
            Calculate
          </button>
          {results && (
            <button
              onClick={saveCalculation}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold shadow-md hover:opacity-90 transition-all"
            >
              <Save className="w-5 h-5 mr-2 inline-block" /> Save
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* Systems Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Systems</CardTitle>
                <button
                  onClick={handleAddSystem}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow hover:opacity-90"
                >
                  <Plus className="w-4 h-4 inline-block mr-1" /> Add System
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {inputs.systems.map((systemInput, index) => (
                <div
                  key={index}
                  className="p-4 bg-muted rounded-lg border border-border mb-4 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium text-foreground">System {index + 1}</h3>
                    {index > 0 && (
                      <button
                        onClick={() => handleRemoveSystem(index)}
                        className="text-destructive hover:opacity-90"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        System
                      </label>
                      <select
                        value={systemInput.system?.id || ''}
                        onChange={handleSystemSelect}
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring focus:ring-ring"
                      >
                        <option value="">Select a System</option>
                        {availableSystems.map((system) => (
                          <option key={system.id} value={system.id}>
                            {system.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={systemInput.quantity}
                        onChange={(e) =>
                          handleSystemChange(index, 'quantity', parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Duration (months)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={systemInput.duration}
                        onChange={(e) =>
                          handleSystemChange(index, 'duration', parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring focus:ring-ring"
                      />
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center space-x-2 mb-4">
                        <input
                          type="checkbox"
                          checked={systemInput.hasFSR}
                          onChange={(e) =>
                            handleSystemChange(index, 'hasFSR', e.target.checked)
                          }
                          className="rounded border-input"
                        />
                        <label className="text-sm font-medium text-muted-foreground">
                          Requires FSR Support
                        </label>
                      </div>

                      {systemInput.hasFSR && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-muted-foreground mb-1">
                                FSR Support Cost
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={systemInput.fsrBaseCost}
                                onChange={(e) =>
                                  handleSystemChange(index, 'fsrBaseCost', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring focus:ring-ring"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Cost Period
                              </label>
                              <select
                                value={systemInput.fsrFrequency}
                                onChange={(e) =>
                                  handleSystemChange(index, 'fsrFrequency', e.target.value as SystemInput['fsrFrequency'])
                                }
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring focus:ring-ring"
                              >
                                <option value="monthly">Per Month</option>
                                <option value="biweekly">Per 2 Weeks</option>
                                <option value="weekly">Per Week</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {showDetails && results && (
        <CostCalculator calculatedResults={results} />
      )}

      <CostConfirmationModal 
        open={confirmationModal.open}
        onClose={() => setConfirmationModal(prev => ({ ...prev, open: false }))}
        fieldName={confirmationModal.fieldName}
        systemName={confirmationModal.systemName}
        currentValue={confirmationModal.currentValue}
        onConfirm={confirmationModal.onConfirm}
      />
    </div>
  );
}
