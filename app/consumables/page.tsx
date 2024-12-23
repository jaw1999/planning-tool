'use client';

import { useState, useEffect } from 'react';
import { ConsumablesList } from '@/app/components/consumables/consumables-list';
import { Consumable } from '@/app/lib/types/system';
import { useNotificationHelpers } from '@/app/lib/contexts/notifications-context';

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

  const handleAdd = async (consumable: Consumable) => {
    try {
      const response = await fetch('/api/consumables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consumable),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to add consumable');
      }

      notifySuccess('Added', 'Consumable added successfully');
      fetchConsumables();
    } catch (error) {
      notifyError('Failed to Add', error instanceof Error ? error.message : 'Could not add consumable');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Consumable>) => {
    try {
      const response = await fetch(`/api/consumables/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update consumable');
      }

      notifySuccess('Updated', 'Consumable updated successfully');
      fetchConsumables();
    } catch (error) {
      notifyError('Failed to Update', error instanceof Error ? error.message : 'Could not update consumable');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/consumables/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete consumable');
      }

      notifySuccess('Deleted', 'Consumable deleted successfully');
      fetchConsumables();
    } catch (error) {
      notifyError('Failed to Delete', error instanceof Error ? error.message : 'Could not delete consumable');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Consumables Reference</h1>
      </div>
      <ConsumablesList
        consumables={consumables}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
} 