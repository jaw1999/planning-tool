import { ExerciseSystem, System } from '@/app/lib/types/system';
import { getDurationInMonths } from '@/app/lib/utils/date';
import { isBalloonGas } from '@/app/lib/utils/consumables';

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

export function calculateSystemCosts(
  system: ExerciseSystem & { system: System }
): SystemCost {
  const duration = getDurationInMonths(system.createdAt, system.updatedAt);
  const baseHardwareCost = (system.system.basePrice || 0) * system.quantity;
  const monthlyFSRCost = system.fsrSupport !== 'NONE' ? (system.fsrCost || 0) : 0;
  
  const monthlyConsumablesCost = system.consumablePresets?.reduce((total, preset) => {
    let quantity = preset.quantity;
    if (isBalloonGas(preset.preset.name)) {
      quantity = system.launchesPerDay ? quantity * system.launchesPerDay * 30 : 0;
    }
    return total + ((preset.preset.consumable?.currentUnitCost || 0) * quantity);
  }, 0) || 0;

  const totalMonthlyRecurring = monthlyFSRCost + monthlyConsumablesCost;
  const totalForDuration = baseHardwareCost + (totalMonthlyRecurring * duration);

  return {
    systemName: system.system.name,
    system: system.system,
    baseHardwareCost,
    fsrCost: monthlyFSRCost,
    consumablesCost: monthlyConsumablesCost,
    monthlyConsumablesCost,
    totalMonthlyRecurring,
    totalForDuration,
    totalCost: totalForDuration,
    duration,
    ...(system.launchesPerDay ? { launchesPerDay: system.launchesPerDay } : {}),
    consumableBreakdown: system.consumablePresets?.map(preset => {
      let quantity = preset.quantity;
      const isPerLaunch = isBalloonGas(preset.preset.name);
      if (isPerLaunch) {
        quantity = system.launchesPerDay ? quantity * system.launchesPerDay * 30 : 0;
      }
      return {
        name: preset.preset.name,
        monthlyCost: (preset.preset.consumable?.currentUnitCost || 0) * quantity,
        isPerLaunch
      };
    })
  };
} 