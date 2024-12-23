import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { SystemCost } from '@/app/lib/types/calculator';
import { formatCurrency } from '@/app/lib/utils/format';

interface SystemCostAnalysisProps {
  systemCosts: SystemCost[];
  currency: string;
}

export function SystemCostAnalysis({ systemCosts, currency }: SystemCostAnalysisProps) {
  const chartData = systemCosts.map(cost => ({
    name: cost.systemName,
    hardware: cost.baseHardwareCost,
    fsr: cost.fsrCost * cost.duration,
    consumables: cost.monthlyConsumablesCost * cost.duration
  }));

  const totalsBySystem = systemCosts.map(cost => ({
    name: cost.systemName,
    total: cost.totalForDuration,
    monthly: cost.totalMonthlyRecurring || (cost.fsrCost || 0) + (cost.monthlyConsumablesCost || 0),
    launches: cost.launchesPerDay,
    consumables: cost.monthlyConsumablesCost || cost.consumablesCost || 0,
    fsr: cost.fsrCost || 0,
    duration: cost.duration || 1,
    baseHardware: cost.baseHardwareCost || 0
  }));

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>System Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value, currency)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="hardware" name="Hardware" fill="#8884d8" stackId="a" />
              <Bar dataKey="fsr" name="FSR Support" fill="#82ca9d" stackId="a" />
              <Bar dataKey="consumables" name="Consumables" fill="#ffc658" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {totalsBySystem.map((system) => (
            <Card key={system.name}>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">{system.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Cost:</span>
                    <span className="font-medium">{formatCurrency(system.total, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monthly Cost:</span>
                    <span className="font-medium">{formatCurrency(system.monthly, currency)}</span>
                  </div>
                  {system.launches !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Daily Launches:</span>
                      <span className="font-medium">{system.launches}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 