'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { Equipment } from '@/app/lib/types/equipment';

export interface ConsumableItem {
  id: string;
  name: string;
  unit: string;
  currentUnitCost: number;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  category?: string;
  notes?: string;
}

export interface EquipmentWithConsumables {
  id: string;
  name: string;
  consumables?: ConsumableItem[];
}

export interface EquipmentConsumablesProps {
  equipment: EquipmentWithConsumables[];
  onUpdate: (equipmentId: string, consumables: ConsumableItem[]) => void;
}

export function EquipmentConsumables({ equipment: equipmentList, onUpdate }: EquipmentConsumablesProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

  const handleAddConsumable = (equipmentId: string) => {
    const equipmentItem = equipmentList.find(e => e.id === equipmentId);
    if (!equipmentItem) return;

    const newConsumable: ConsumableItem = {
      id: crypto.randomUUID(),
      name: '',
      unit: '',
      currentUnitCost: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onUpdate(equipmentId, [...(equipmentItem.consumables || []), newConsumable]);
  };

  const handleRemoveConsumable = (equipmentId: string, consumableId: string) => {
    const equipmentItem = equipmentList.find(e => e.id === equipmentId);
    if (!equipmentItem) return;

    const updatedConsumables = (equipmentItem.consumables || []).filter(c => c.id !== consumableId);
    onUpdate(equipmentId, updatedConsumables);
  };

  const handleConsumableChange = (
    equipmentId: string,
    consumableId: string,
    field: keyof ConsumableItem,
    value: string | number
  ) => {
    const equipmentItem = equipmentList.find(e => e.id === equipmentId);
    if (!equipmentItem) return;

    const updatedConsumables = (equipmentItem.consumables || []).map(c => {
      if (c.id === consumableId) {
        return {
          ...c,
          [field]: value,
          updatedAt: new Date()
        };
      }
      return c;
    });

    onUpdate(equipmentId, updatedConsumables);
  };

  return (
    <div className="space-y-6">
      {equipmentList.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{item.name}</CardTitle>
              <button
                onClick={() => handleAddConsumable(item.id)}
                className="px-2 py-1 text-sm bg-primary text-primary-foreground rounded-md"
              >
                <Plus className="w-4 h-4 mr-1 inline-block" /> Add Consumable
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {item.consumables?.length ? (
              <div className="space-y-4">
                {item.consumables.map((consumable) => (
                  <div key={consumable.id} className="grid grid-cols-5 gap-4 items-center p-4 border rounded-lg">
                    <input
                      type="text"
                      placeholder="Name"
                      value={consumable.name}
                      onChange={(e) => handleConsumableChange(item.id, consumable.id, 'name', e.target.value)}
                      className="px-2 py-1 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g., liters)"
                      value={consumable.unit}
                      onChange={(e) => handleConsumableChange(item.id, consumable.id, 'unit', e.target.value)}
                      className="px-2 py-1 border rounded"
                    />
                    <input
                      type="number"
                      placeholder="Cost per unit"
                      value={consumable.currentUnitCost}
                      onChange={(e) => handleConsumableChange(item.id, consumable.id, 'currentUnitCost', parseFloat(e.target.value))}
                      className="px-2 py-1 border rounded"
                    />
                    <button
                      onClick={() => handleRemoveConsumable(item.id, consumable.id)}
                      className="text-destructive hover:opacity-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No consumables defined for this equipment
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 