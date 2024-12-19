'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { CalculatedResults } from '@/app/lib/types/system';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SystemCost {
  system: string;
  baseHardwareCost: number;
  totalMonthlyRecurring: number;
  totalCost: number;
}

export function CostCalculator({ calculatedResults }: { calculatedResults: CalculatedResults }) {
  const systemCosts: SystemCost[] = calculatedResults.systemCosts.map((cost) => ({
    system: cost.systemName,
    baseHardwareCost: cost.baseHardwareCost,
    totalMonthlyRecurring: cost.totalMonthlyRecurring,
    totalCost: cost.totalForDuration
  }));

  const totalCosts = {
    baseHardware: systemCosts.reduce((acc: number, curr: SystemCost) => acc + curr.baseHardwareCost, 0),
    monthlyRecurring: systemCosts.reduce((acc: number, curr: SystemCost) => acc + curr.totalMonthlyRecurring, 0),
    total: calculatedResults.totalCost
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
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {systemCosts.map((cost) => (
                <tr key={cost.system} className="border-b">
                  <td className="py-2">{cost.system}</td>
                  <td className="text-right">${cost.baseHardwareCost.toLocaleString()}</td>
                  <td className="text-right">${cost.totalMonthlyRecurring.toLocaleString()}</td>
                  <td className="text-right">${cost.totalCost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="py-2">Total</td>
                <td className="text-right">${totalCosts.baseHardware.toLocaleString()}</td>
                <td className="text-right">${totalCosts.monthlyRecurring.toLocaleString()}</td>
                <td className="text-right">${totalCosts.total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}