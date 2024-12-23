import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/app/components/ui/table';
import { ExerciseSystem, ConsumablePreset, System } from '@/app/lib/types/system';
import { ExerciseSystemWithDetails } from '@/app/lib/types/system-cost';
import { calculateSystemCosts } from '@/app/lib/utils/cost';
import { isBalloonGas } from '@/app/lib/utils/consumables';

interface SystemSupportDetailsProps {
  systems: (ExerciseSystem & {
    system: System;
    consumablePresets: Array<{
      id: string;
      exerciseSystemId: string;
      presetId: string;
      quantity: number;
      preset: ConsumablePreset & {
        consumable: {
          currentUnitCost: number;
          name: string;
          unit: string;
        };
      };
    }>;
  })[];
  startDate: string;
  endDate: string;
  onUpdateSystem?: (systemId: string, updates: Partial<ExerciseSystem>) => void;
}

export function SystemSupportDetails({ systems, startDate, endDate, onUpdateSystem }: SystemSupportDetailsProps) {
  return (
    <div className="space-y-6">
      {systems.map(sys => {
        if (!sys.system) return null;
        
        return (
          <div key={sys.id} className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead className="text-right">Monthly Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sys.consumablePresets.map((preset) => {
                  let displayQuantity = preset.quantity;
                  if (isBalloonGas(preset.preset.consumable.name)) {
                    displayQuantity = (sys.launchesPerDay || 0) * preset.quantity * 30;
                  }

                  const monthlyCost = preset.preset.consumable.currentUnitCost * displayQuantity;

                  return (
                    <TableRow key={preset.id}>
                      <TableCell>{preset.preset.consumable.name}</TableCell>
                      <TableCell>
                        {displayQuantity} {preset.preset.consumable.unit}/
                        {isBalloonGas(preset.preset.consumable.name) ? 'launch' : 'month'}
                      </TableCell>
                      <TableCell>
                        ${preset.preset.consumable.currentUnitCost?.toLocaleString()}/
                        {preset.preset.consumable.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        ${monthlyCost.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
} 