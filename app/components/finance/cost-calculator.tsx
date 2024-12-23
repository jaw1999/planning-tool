'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { CalculatedResults } from '@/app/lib/types/calculator';
import { SystemCost as SystemCostType } from '@/app/lib/utils/cost';

interface CostBreakdown {
  system: string;
  baseHardwareCost: number;
  monthlyRecurring: number;
  totalForDuration: number;
  duration: number;
  launchesPerDay?: number;
  consumablesCost: number;
  fsrCost: number;
}

export function CostCalculator({ calculatedResults }: { calculatedResults: CalculatedResults }) {
  if (!calculatedResults || !calculatedResults.systemCosts) {
    return null;
  }

  const systemCosts: CostBreakdown[] = calculatedResults.systemCosts.map((cost) => {
    const monthlyConsumables = cost.monthlyConsumablesCost || 0;
    const monthlyFSR = cost.fsrCost || 0;
    const totalMonthly = cost.totalMonthlyRecurring;
    const duration = cost.duration || 1;
    const totalForDuration = cost.baseHardwareCost + (totalMonthly * duration);

    return {
      system: cost.systemName,
      baseHardwareCost: cost.baseHardwareCost,
      monthlyRecurring: totalMonthly,
      totalForDuration: totalForDuration,
      duration: duration,
      launchesPerDay: cost.launchesPerDay,
      consumablesCost: monthlyConsumables,
      fsrCost: monthlyFSR
    };
  });

  const totalCosts = {
    baseHardware: systemCosts.reduce((acc, curr) => acc + curr.baseHardwareCost, 0),
    monthlyRecurring: systemCosts.reduce((acc, curr) => acc + curr.monthlyRecurring, 0),
    monthlyConsumables: systemCosts.reduce((acc, curr) => acc + curr.consumablesCost, 0),
    totalConsumables: systemCosts.reduce((acc, curr) => acc + (curr.consumablesCost * curr.duration), 0),
    totalLaunches: systemCosts.reduce((acc, curr) => {
      if (!curr.launchesPerDay) return acc;
      return acc + (curr.launchesPerDay * curr.duration * 30);
    }, 0),
    total: systemCosts.reduce((acc, curr) => acc + curr.totalForDuration, 0)
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">System</th>
                <th className="text-right py-2">Hardware</th>
                <th className="text-right py-2">Monthly</th>
                <th className="text-right py-2">Launches/Day</th>
                <th className="text-right py-2">Total for Duration</th>
              </tr>
            </thead>
            <tbody>
              {systemCosts.map((cost) => (
                <tr key={cost.system} className="border-b">
                  <td className="py-2">
                    {cost.system}
                    <div className="text-sm text-gray-500">
                      ({cost.duration} month{cost.duration !== 1 ? 's' : ''})
                    </div>
                  </td>
                  <td className="text-right">${cost.baseHardwareCost.toLocaleString()}</td>
                  <td className="text-right">
                    ${cost.monthlyRecurring.toLocaleString()}/mo
                    <div className="text-sm text-gray-500">
                      (incl. ${cost.consumablesCost.toLocaleString()} consumables)
                    </div>
                  </td>
                  <td className="text-right">{cost.launchesPerDay}</td>
                  <td className="text-right">${cost.totalForDuration.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="font-bold border-t">
                <td>Total</td>
                <td className="text-right">${totalCosts.baseHardware.toLocaleString()}</td>
                <td className="text-right">${totalCosts.monthlyRecurring.toLocaleString()}/mo</td>
                <td className="text-right">-</td>
                <td className="text-right">${totalCosts.total.toLocaleString()}</td>
              </tr>
              <tr className="text-sm text-gray-500">
                <td colSpan={5} className="pt-4">
                  <div className="flex justify-between">
                    <span>Total Consumables for Exercise:</span>
                    <span>${totalCosts.totalConsumables.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Launches for Exercise:</span>
                    <span>{totalCosts.totalLaunches.toLocaleString()}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}