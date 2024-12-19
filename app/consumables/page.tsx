'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ConsumablesList } from '../components/consumables/consumables-list';
import { ConsumableLegend } from '../components/consumables/consumable-legend';
import { Consumable } from '@/app/lib/types/system';
import { useNotificationHelpers } from '../lib/contexts/notifications-context';

export default function ConsumablesPage() {
  const { notifySuccess, notifyError } = useNotificationHelpers();
  const [consumables, setConsumables] = useState<Consumable[]>([]);

  useEffect(() => {
    fetchConsumables();
  }, []);

  const fetchConsumables = async () => {
    try {
      const response = await fetch('/api/consumables');
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch consumables');
      }
      const data = await response.json();
      setConsumables(data);
    } catch (error) {
      notifyError('Failed to Load', error instanceof Error ? error.message : 'Could not fetch consumables');
    }
  };

  const handleAdd = async () => {
    try {
      const response = await fetch('/api/consumables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Consumable',
          unit: 'units',
          currentUnitCost: 0
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to add consumable');
      }
      notifySuccess('Added Successfully', 'New consumable has been created');
      fetchConsumables();
    } catch (error) {
      notifyError('Failed to Add', error instanceof Error ? error.message : 'Could not add consumable');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Consumable>) => {
    try {
      const response = await fetch(`/api/consumables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update consumable');
      }
      notifySuccess('Updated Successfully', 'Consumable has been updated');
      fetchConsumables();
    } catch (error) {
      notifyError('Failed to Update', error instanceof Error ? error.message : 'Could not update consumable');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/consumables/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete consumable');
      }
      notifySuccess('Deleted Successfully', 'Consumable has been removed');
      fetchConsumables();
    } catch (error) {
      notifyError('Failed to Delete', error instanceof Error ? error.message : 'Could not delete consumable');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Consumables</h1>
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="legend">Legend</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <ConsumablesList
            consumables={consumables}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="legend">
          <ConsumableLegend
            consumables={consumables}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 