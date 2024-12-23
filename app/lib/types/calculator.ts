import { System } from '@/app/lib/types/system';

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

export interface CalculatedResults {
  totalCost: number;
  monthlyRecurring: number;
  oneTimeCosts: number;
  systemCosts: SystemCost[];
  additionalCosts: any[];
} 