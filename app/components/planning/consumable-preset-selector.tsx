import React from 'react';
import { ConsumablePreset, Consumable } from '@/app/lib/types/system';
import { ConsumableLegendDialog } from '@/app/components/consumables/consumable-legend-dialog';
import { useNotificationHelpers } from '@/app/lib/contexts/notifications-context';

interface ConsumablePresetSelectorProps {
  systemId: string;
  availablePresets: ConsumablePreset[];
  selectedPresets: Array<{
    presetId: string;
    quantity: number;
  }>;
  onPresetsChange: (systemId: string, presets: Array<{ presetId: string; quantity: number; }>) => void;
}

export function ConsumablePresetSelector({
  systemId,
  availablePresets,
  selectedPresets,
  onPresetsChange
}: ConsumablePresetSelectorProps) {
  const { notifyError } = useNotificationHelpers();

  const handlePresetSelect = (presetId: string) => {
    if (selectedPresets.some(p => p.presetId === presetId)) return;
    
    onPresetsChange(systemId, [
      ...selectedPresets,
      { presetId, quantity: 1 }
    ]);
  };

  const handleQuantityChange = (presetId: string, quantity: number) => {
    onPresetsChange(
      systemId,
      selectedPresets.map(p =>
        p.presetId === presetId
          ? { ...p, quantity: Math.max(1, quantity) }
          : p
      )
    );
  };

  const handleRemovePreset = (presetId: string) => {
    onPresetsChange(
      systemId,
      selectedPresets.filter(p => p.presetId !== presetId)
    );
  };

  const handleAddConsumable = async (newConsumable: Consumable): Promise<void> => {
    try {
      const response = await fetch('/api/consumables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConsumable),
      });
      
      if (!response.ok) throw new Error('Failed to add consumable');
      
      return Promise.resolve();
    } catch (error) {
      notifyError('Error', 'Failed to add consumable');
      return Promise.reject(error);
    }
  };

  const handleUpdateConsumable = async (id: string, updates: Partial<Consumable>): Promise<void> => {
    try {
      const response = await fetch(`/api/consumables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update consumable');
      
      return Promise.resolve();
    } catch (error) {
      notifyError('Error', 'Failed to update consumable');
      return Promise.reject(error);
    }
  };

  const handleDeleteConsumable = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/consumables/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete consumable');
      
      return Promise.resolve();
    } catch (error) {
      notifyError('Error', 'Failed to delete consumable');
      return Promise.reject(error);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium">Consumable Presets</h4>
        <ConsumableLegendDialog
          consumables={availablePresets.map(p => p.consumable)}
          onAdd={handleAddConsumable}
          onUpdate={handleUpdateConsumable}
          onDelete={handleDeleteConsumable}
        />
      </div>
      
      <div className="space-y-2">
        {selectedPresets.map(({ presetId, quantity }) => {
          const preset = availablePresets.find(p => p.id === presetId);
          if (!preset) return null;

          return (
            <div key={presetId} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-1">
                <div className="font-medium">{preset.name}</div>
                <div className="text-sm text-gray-500">
                  {preset.consumable.name} ({preset.consumable.unit}) - ${preset.consumable.currentUnitCost}/unit
                </div>
              </div>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => handleQuantityChange(presetId, parseInt(e.target.value))}
                className="w-20 p-1 border rounded"
              />
              <button
                onClick={() => handleRemovePreset(presetId)}
                className="p-1 text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="mt-2">
        <select
          onChange={e => handlePresetSelect(e.target.value)}
          value=""
          className="w-full p-2 border rounded"
        >
          <option value="">Add consumable preset...</option>
          {availablePresets
            .filter(p => !selectedPresets.some(sp => sp.presetId === p.id))
            .map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name} - {preset.consumable.name} ({preset.consumable.unit})
              </option>
            ))}
        </select>
      </div>
    </div>
  );
} 