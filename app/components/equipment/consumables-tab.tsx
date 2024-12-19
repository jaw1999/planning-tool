'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { ConsumableLegendDialog } from '../consumables/consumable-legend-dialog';
import { ConsumablePreset, Consumable } from '@/app/lib/types/system';
import { Button } from '../ui/button';

interface ConsumablesTabProps {
  equipmentId: string;
  presets: ConsumablePreset[];
  consumables: Consumable[];
  onAddPreset: (equipmentId: string, preset: Partial<ConsumablePreset>) => void;
  onUpdatePreset: (equipmentId: string, presetId: string, updates: Partial<ConsumablePreset>) => void;
  onDeletePreset: (equipmentId: string, presetId: string) => void;
  onAddConsumable: () => void;
  onUpdateConsumable: (id: string, updates: Partial<Consumable>) => void;
  onDeleteConsumable: (id: string) => void;
}

export function ConsumablesTab({
  equipmentId,
  presets,
  consumables,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset,
  onAddConsumable,
  onUpdateConsumable,
  onDeleteConsumable
}: ConsumablesTabProps) {
  const handleAddPreset = () => {
    const newConsumable: Consumable = {
      id: crypto.randomUUID(),
      name: '',
      unit: '',
      currentUnitCost: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newPreset: Partial<ConsumablePreset> = {
      name: 'New Preset',
      quantity: 1,
      consumable: newConsumable
    };

    onAddPreset(equipmentId, newPreset);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle>Consumable Presets</CardTitle>
            <ConsumableLegendDialog
              consumables={consumables}
              onAdd={onAddConsumable}
              onUpdate={onUpdateConsumable}
              onDelete={onDeleteConsumable}
            />
          </div>
          <Button onClick={handleAddPreset} variant="default">
            <Plus className="w-4 h-4 mr-2" /> Add Preset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {presets.map((preset) => (
            <div key={preset.id} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Preset Name</label>
                <input
                  type="text"
                  value={preset.name}
                  onChange={(e) => onUpdatePreset(equipmentId, preset.id, { name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  value={preset.quantity}
                  onChange={(e) => onUpdatePreset(equipmentId, preset.id, { quantity: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit Cost</label>
                <input
                  type="number"
                  value={preset.consumable.currentUnitCost}
                  onChange={(e) => onUpdatePreset(equipmentId, preset.id, {
                    consumable: {
                      ...preset.consumable,
                      currentUnitCost: parseFloat(e.target.value)
                    }
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
              No consumable presets defined
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 