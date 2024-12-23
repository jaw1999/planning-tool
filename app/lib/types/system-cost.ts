import { ExerciseSystem, ConsumablePreset, System, FSRType } from './system';

export interface ExerciseSystemWithDetails extends Omit<ExerciseSystem, 'consumablePresets' | 'system'> {
  system: {
    id: string;
    name: string;
    description?: string;
    basePrice: number;
    hasLicensing: boolean;
    licensePrice?: number;
    leadTime?: number;
    consumablesRate?: number;
    createdAt: Date;
    updatedAt: Date;
  };
  consumablePresets: Array<{
    id: string;
    exerciseSystemId: string;
    presetId: string;
    quantity: number;
    preset: ConsumablePreset & {
      consumable: {
        name: string;
        currentUnitCost: number;
        unit: string;
      };
    };
    createdAt: Date;
    updatedAt: Date;
  }>;
  fsrType: FSRType;
  fsrCost: number;
  quantity: number;
  launchesPerDay?: number;
}

export interface SystemCost {
  systemName: string;
  system: System;
  baseHardwareCost: number;
  fsrCost: number;
  consumablesCost: number;
  totalMonthlyRecurring: number;
  totalForDuration: number;
  totalCost: number;
  duration: number;
  monthlyConsumablesCost: number;
  launchesPerDay?: number;
  consumableBreakdown?: Array<{
    name: string;
    monthlyCost: number;
    isPerLaunch: boolean;
  }>;
} 