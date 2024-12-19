'use client';

import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Consumable } from '@/app/lib/types/system';

interface ConsumableSelectorProps {
  availableConsumables: Consumable[];
  selectedConsumables: Array<{ consumableId: string; quantity: number }>;
  onChange: (selected: Array<{ consumableId: string; quantity: number }>) => void;
}

export function ConsumableSelector({
  availableConsumables,
  selectedConsumables,
  onChange
}: ConsumableSelectorProps) {
  return (
    <div className="space-y-2">
      {availableConsumables.map(consumable => {
        const isSelected = selectedConsumables.some(sc => sc.consumableId === consumable.id);
        const selectedItem = selectedConsumables.find(sc => sc.consumableId === consumable.id);

        return (
          <div key={consumable.id} className="flex items-center gap-4 p-2 border rounded">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  onChange([...selectedConsumables, { consumableId: consumable.id, quantity: 1 }]);
                } else {
                  onChange(selectedConsumables.filter(sc => sc.consumableId !== consumable.id));
                }
              }}
            />
            <div className="flex-1">
              <div>{consumable.name}</div>
              <div className="text-sm text-muted-foreground">
                ${consumable.currentUnitCost}/{consumable.unit}
              </div>
            </div>
            {isSelected && (
              <Input
                type="number"
                min={1}
                value={selectedItem?.quantity || 1}
                onChange={(e) => {
                  onChange(
                    selectedConsumables.map(sc =>
                      sc.consumableId === consumable.id
                        ? { ...sc, quantity: parseInt(e.target.value) || 1 }
                        : sc
                    )
                  );
                }}
                className="w-24"
              />
            )}
          </div>
        );
      })}
    </div>
  );
} 