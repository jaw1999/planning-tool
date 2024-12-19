'use client';

import React from 'react';
import { Card } from '@/app/components/ui/card';
import { LeadTimes } from '@/app/components/settings/lead-times';
import { useLeadTimes } from '@/app/contexts/lead-times-context';
import { toast } from '@/app/components/ui/use-toast';
import { LeadTimeItem } from '@/app/contexts/lead-times-context';

export default function ExerciseSettingsPage() {
  const { leadTimes, addLeadTime, updateLeadTime, deleteLeadTime } = useLeadTimes();

  const handleAdd = async (leadTime: Omit<LeadTimeItem, 'id'>) => {
    try {
      await addLeadTime(leadTime);
      toast({
        title: 'Success',
        description: 'Lead time added successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add lead time',
        variant: 'destructive'
      });
    }
  };

  const handleUpdate = async (id: string, data: Partial<LeadTimeItem>) => {
    try {
      await updateLeadTime(id, data);
      toast({
        title: 'Success',
        description: 'Lead time updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update lead time',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLeadTime(id);
      toast({
        title: 'Success',
        description: 'Lead time deleted successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete lead time',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Exercise Settings</h1>
      <LeadTimes 
        leadTimes={leadTimes}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
} 