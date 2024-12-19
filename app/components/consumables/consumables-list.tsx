'use client';

import { Card, CardContent } from '../ui/card';
import { Consumable } from '@/app/lib/types/system';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface ConsumablesListProps {
  consumables: Consumable[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<Consumable>) => void;
  onDelete: (id: string) => void;
}

export function ConsumablesList({ consumables, onAdd, onUpdate, onDelete }: ConsumablesListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" /> Add Consumable
        </Button>
      </div>
      
      {consumables.map((consumable) => (
        <Card key={consumable.id}>
          <CardContent className="grid grid-cols-5 gap-4 p-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={consumable.name}
                onChange={(e) => onUpdate(consumable.id, { name: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Unit</label>
              <input
                type="text"
                value={consumable.unit}
                onChange={(e) => onUpdate(consumable.id, { unit: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cost per Unit</label>
              <input
                type="number"
                value={consumable.currentUnitCost}
                onChange={(e) => onUpdate(consumable.id, { currentUnitCost: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex items-end justify-end">
              <Button variant="destructive" size="icon" onClick={() => onDelete(consumable.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 