'use client';

import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { X } from 'lucide-react';

interface ConsumablePresetFormData {
  name: string;
  description?: string;
  quantity: number;
  consumable: {
    name: string;
    unit: string;
    currentUnitCost: number;
  };
}

interface ConsumablePresetFormProps {
  onSubmit: (data: ConsumablePresetFormData) => void;
}

export function ConsumablePresetForm({ onSubmit }: ConsumablePresetFormProps) {
  const [formData, setFormData] = useState<ConsumablePresetFormData>({
    name: '',
    description: '',
    quantity: 0,
    consumable: {
      name: '',
      unit: '',
      currentUnitCost: 0
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              value={formData.consumable.unit}
              onChange={e => setFormData({
                ...formData,
                consumable: { ...formData.consumable, unit: e.target.value }
              })}
              required
            />
          </div>
          <div>
            <Label htmlFor="currentUnitCost">Cost per Unit</Label>
            <Input
              id="currentUnitCost"
              type="number"
              step="0.01"
              value={formData.consumable.currentUnitCost}
              onChange={e => setFormData({
                ...formData,
                consumable: { ...formData.consumable, currentUnitCost: Number(e.target.value) }
              })}
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit">Add Preset</Button>
        </div>
      </form>
    </Card>
  );
} 