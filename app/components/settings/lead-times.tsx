'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, Trash } from 'lucide-react';
import { LeadTimeItem, LeadTimeType } from '../../contexts/lead-times-context';

interface LeadTimesProps {
  leadTimes: LeadTimeItem[];
  onAdd: (leadTime: Omit<LeadTimeItem, 'id'>) => void;
  onUpdate: (id: string, leadTime: Partial<LeadTimeItem>) => void;
  onDelete: (id: string) => void;
}

export function LeadTimes({ leadTimes, onAdd, onUpdate, onDelete }: LeadTimesProps) {
  const [newLeadTime, setNewLeadTime] = useState<Omit<LeadTimeItem, 'id'>>({
    name: '',
    description: '',
    daysInAdvance: 30,
    type: 'PROCUREMENT'
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Times Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add new lead time form */}
          <div className="grid grid-cols-5 gap-4 p-4 border rounded-lg">
            <input
              className="col-span-1 p-2 border rounded"
              placeholder="Name"
              value={newLeadTime.name}
              onChange={(e) => setNewLeadTime(prev => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="col-span-1 p-2 border rounded"
              placeholder="Description"
              value={newLeadTime.description}
              onChange={(e) => setNewLeadTime(prev => ({ ...prev, description: e.target.value }))}
            />
            <input
              type="number"
              className="col-span-1 p-2 border rounded"
              placeholder="Days Required"
              value={newLeadTime.daysInAdvance}
              onChange={(e) => setNewLeadTime(prev => ({ ...prev, daysInAdvance: parseInt(e.target.value) }))}
            />
            <select
              className="col-span-1 p-2 border rounded"
              value={newLeadTime.type}
              onChange={(e) => setNewLeadTime(prev => ({ ...prev, type: e.target.value as LeadTimeType }))}
            >
              <option value="PROCUREMENT">Procurement</option>
              <option value="LOGISTICS">Logistics</option>
              <option value="TRAINING">Training</option>
              <option value="SETUP">Setup</option>
              <option value="OTHER">Other</option>
            </select>
            <Button 
              className="col-span-1"
              onClick={() => {
                onAdd(newLeadTime);
                setNewLeadTime({ name: '', description: '', daysInAdvance: 30, type: 'PROCUREMENT' });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Lead times list */}
          <div className="space-y-2">
            {leadTimes.map((leadTime) => (
              <div key={leadTime.id} className="grid grid-cols-5 gap-4 p-4 border rounded-lg">
                <input
                  className="col-span-1 p-2 border rounded"
                  value={leadTime.name}
                  onChange={(e) => onUpdate(leadTime.id, { name: e.target.value })}
                />
                <input
                  className="col-span-1 p-2 border rounded"
                  value={leadTime.description}
                  onChange={(e) => onUpdate(leadTime.id, { description: e.target.value })}
                />
                <input
                  type="number"
                  className="col-span-1 p-2 border rounded"
                  value={leadTime.daysInAdvance}
                  onChange={(e) => onUpdate(leadTime.id, { daysInAdvance: parseInt(e.target.value) })}
                />
                <select
                  className="col-span-1 p-2 border rounded"
                  value={leadTime.type}
                  onChange={(e) => onUpdate(leadTime.id, { type: e.target.value as LeadTimeType })}
                >
                  <option value="PROCUREMENT">Procurement</option>
                  <option value="LOGISTICS">Logistics</option>
                  <option value="TRAINING">Training</option>
                  <option value="SETUP">Setup</option>
                  <option value="OTHER">Other</option>
                </select>
                <Button 
                  variant="destructive"
                  onClick={() => onDelete(leadTime.id)}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 