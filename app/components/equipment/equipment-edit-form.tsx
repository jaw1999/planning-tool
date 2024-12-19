'use client';

import React from 'react';
import { Equipment } from '@/app/lib/types/equipment';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface EquipmentEditFormProps {
  equipment: Equipment;
  onSubmit: (data: Partial<Equipment>) => void;
  onCancel: () => void;
}

const equipmentEditFormSchema = z.object({
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']),
  fsrFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'AS_NEEDED']),
});

export function EquipmentEditForm({ equipment, onSubmit, onCancel }: EquipmentEditFormProps) {
  const form = useForm<Partial<Equipment>>({
    resolver: zodResolver(equipmentEditFormSchema),
    defaultValues: {
      status: equipment.status,
      fsrFrequency: equipment.fsrFrequency,
      location: equipment.location,
      serialNumber: equipment.serialNumber,
      assetTag: equipment.assetTag,
    },
  });

  const handleSubmit = (data: Partial<Equipment>) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit Equipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...form.register('status')}
                className="w-full p-2 border rounded"
              >
                <option value="AVAILABLE">Available</option>
                <option value="IN_USE">In Use</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fsrFrequency">FSR Frequency</Label>
              <select
                id="fsrFrequency"
                {...form.register('fsrFrequency')}
                className="w-full p-2 border rounded"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
                <option value="AS_NEEDED">As Needed</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...form.register('location')}
                defaultValue={equipment.location || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                {...form.register('serialNumber')}
                defaultValue={equipment.serialNumber || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetTag">Asset Tag</Label>
              <Input
                id="assetTag"
                {...form.register('assetTag')}
                defaultValue={equipment.assetTag || ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
} 