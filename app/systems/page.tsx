'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { useEquipment } from '@/app/hooks/use-equipment';
import { useSystems } from '@/app/hooks/use-systems';
import { Equipment } from '@/app/lib/types/equipment';
import { System } from '@/app/lib/types/system';
import { useNotificationHelpers } from '@/app/lib/contexts/notifications-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EquipmentImportModal } from '@/app/components/systems/equipment-import-modal';

export default function SystemsPage() {
  const { equipment = [], isLoading: equipmentLoading } = useEquipment();
  const { systems = [], createSystem, deleteSystem } = useSystems();
  const { notifySuccess, notifyError } = useNotificationHelpers();
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleImportEquipment = async (equipment: Equipment) => {
    const systemData: Partial<System> = {
      name: `${equipment.productInfo?.name || 'Unknown'} ${Date.now()}`,
      description: equipment.productInfo?.description || '',
      basePrice: equipment.acquisitionCost || 0,
      hasLicensing: Boolean(equipment.software?.licensing?.type),
      licensePrice: equipment.software?.licensing?.terms?.monthlyFee || 0,
      leadTime: equipment.logistics?.procurement?.leadTime?.standard || 30,
      consumablesRate: equipment.logistics?.spares?.availability?.monthlyRate || 500,
      specifications: {
        dimensions: {
          length: equipment.dimensions?.length || 0,
          width: equipment.dimensions?.width || 0,
          height: equipment.dimensions?.height || 0,
          unit: equipment.dimensions?.unit || 'mm'
        },
        weight: {
          base: equipment.weight?.value || 0,
          loaded: equipment.weight?.value || 0,
          unit: equipment.weight?.unit || 'kg'
        },
        power: {
          voltage: equipment.powerRequirements?.voltage || 0,
          amperage: equipment.powerRequirements?.amperage || 0,
          frequency: Number(equipment.powerRequirements?.frequency) || 0
        },
        environmental: {
          temperature: { min: 0, max: 50, unit: 'C' },
          humidity: { min: 0, max: 95, unit: '%' },
          ipRating: equipment.environmentalSpecifications?.certifications?.environmental?.find(
            cert => cert.toLowerCase().startsWith('ip')
          ) || undefined
        }
      }
    };

    console.log('Sending system data:', JSON.stringify(systemData, null, 2));

    try {
      await createSystem(systemData);
      notifySuccess('Success', 'System imported successfully');
      setIsImportOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Detailed error creating system:', error.message);
        notifyError('Error', `Failed to import system: ${error.message}`);
      } else {
        console.error('Unknown error creating system:', error);
        notifyError('Error', 'Failed to import system');
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await deleteSystem(id);
      notifySuccess('Success', 'System deleted successfully');
    } catch (error) {
      console.error('Error deleting system:', error);
      notifyError('Error', 'Failed to delete system');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Systems</h1>
        <button 
          onClick={() => setIsImportOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
        >
          Import Equipment
        </button>
      </div>

      <div className="grid gap-4">
        {systems.map((system) => (
          <div 
            key={system.id} 
            className="bg-card p-4 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <h2 className="text-lg font-semibold">{system.name}</h2>
              <p className="text-muted-foreground">{system.description}</p>
              <p className="text-sm">Base Price: ${system.basePrice.toLocaleString()}</p>
            </div>
            <button
              onClick={() => handleDelete(system.id, system.name)}
              className="bg-destructive text-destructive-foreground px-3 py-1 rounded-md hover:bg-destructive/90"
            >
              Delete
            </button>
          </div>
        ))}
        {systems.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No systems found. Import equipment to create systems.
          </p>
        )}
      </div>

      <EquipmentImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportEquipment}
      />
    </div>
  );
}