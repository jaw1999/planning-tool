'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ConsumablesTab } from './consumables-tab';
import { Equipment } from '@/app/lib/types/equipment';
import { ConsumablePreset } from '@/app/lib/types/system';

interface EquipmentDetailProps {
  equipment: Equipment;
  onUpdate: (id: string, updates: Partial<Equipment>) => Promise<void>;
}

export function EquipmentDetail({ equipment, onUpdate }: EquipmentDetailProps) {
  const handleAddPreset = async (equipmentId: string, preset: Partial<ConsumablePreset>) => {
    const newPreset: ConsumablePreset = {
      id: crypto.randomUUID(),
      name: preset.name || '',
      description: preset.description,
      consumableId: crypto.randomUUID(),
      consumable: {
        id: crypto.randomUUID(),
        name: preset.consumable?.name || '',
        unit: preset.consumable?.unit || '',
        currentUnitCost: preset.consumable?.currentUnitCost || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      quantity: preset.quantity || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await onUpdate(equipmentId, {
      consumablePresets: [...(equipment.consumablePresets || []), newPreset]
    });
  };

  const handleUpdatePreset = async (
    equipmentId: string,
    presetId: string,
    updates: Partial<ConsumablePreset>
  ) => {
    const updatedPresets = equipment.consumablePresets?.map(preset =>
      preset.id === presetId ? { ...preset, ...updates } : preset
    ) || [];

    await onUpdate(equipmentId, { consumablePresets: updatedPresets });
  };

  const handleDeletePreset = async (equipmentId: string, presetId: string) => {
    const updatedPresets = equipment.consumablePresets?.filter(
      preset => preset.id !== presetId
    ) || [];

    await onUpdate(equipmentId, { consumablePresets: updatedPresets });
  };

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="list">List View</TabsTrigger>
        <TabsTrigger value="compare">Compare</TabsTrigger>
        <TabsTrigger value="consumables">Consumables</TabsTrigger>
      </TabsList>

      {/* Reference to existing content */}
      <TabsContent value="details">
        {/* Your existing details content */}
      </TabsContent>

      <TabsContent value="consumables">
        <ConsumablesTab
          equipmentId={equipment.id}
          presets={equipment.consumablePresets || []}
          consumables={equipment.consumables || []}
          onAddPreset={handleAddPreset}
          onUpdatePreset={handleUpdatePreset}
          onDeletePreset={handleDeletePreset}
        />
      </TabsContent>
    </Tabs>
  );
}