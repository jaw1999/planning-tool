'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { ConsumablePreset, Consumable } from '@/app/lib/types/system';
import { Button } from '../ui/button';

interface ConsumablesTabProps {
  equipmentId: string;
  presets: ConsumablePreset[];
  consumables: Consumable[];
  onAddPreset: (equipmentId: string, preset: Partial<ConsumablePreset>) => void;
  onUpdatePreset: (equipmentId: string, presetId: string, updates: Partial<ConsumablePreset>) => void;
  onDeletePreset: (equipmentId: string, presetId: string) => void;
}

export function ConsumablesTab({
  equipmentId,
  presets,
  consumables,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset,
}: ConsumablesTabProps) {
  const handleAddPreset = () => {
    const newPreset: Partial<ConsumablePreset> = {
      name: 'New Preset',
      quantity: 1,
      consumable: {
        id: crypto.randomUUID(),
        name: '',
        unit: '',
        currentUnitCost: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    onAddPreset(equipmentId, newPreset);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Consumables</CardTitle>
          <Button onClick={handleAddPreset} variant="default">
            <Plus className="w-4 h-4 mr-2" /> Add Consumable
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {presets.map((preset) => (
            <div key={preset.id} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={preset.consumable.name}
                  onChange={(e) => onUpdatePreset(equipmentId, preset.id, {
                    consumable: { ...preset.consumable, name: e.target.value }
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  value={preset.quantity}
                  onChange={(e) => onUpdatePreset(equipmentId, preset.id, { 
                    quantity: parseInt(e.target.value) 
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <input
                  type="text"
                  value={preset.consumable.unit}
                  onChange={(e) => onUpdatePreset(equipmentId, preset.id, {
                    consumable: { ...preset.consumable, unit: e.target.value }
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => onDeletePreset(equipmentId, preset.id)}
                  className="p-2 text-destructive hover:opacity-90"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {presets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No consumables defined
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 