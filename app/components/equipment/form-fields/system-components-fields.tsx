'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Equipment } from '@/app/lib/types/equipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { FormTextarea } from '@/app/components/ui/form-textarea';

type ArrayComponentField = 
  | 'primary.components'
  | 'avionics.navigation'
  | 'avionics.control'
  | 'avionics.termination'
  | 'avionics.optional'
  | 'communications.backup'
  | 'communications.protocols'
  | 'tracking.features';

export function SystemComponentsFields() {
  const form = useFormContext<Equipment>();
  const [newItem, setNewItem] = useState('');

  const addItem = (field: ArrayComponentField) => {
    if (!newItem) return;
    
    const currentValues = form.getValues(`systemComponents.${field}`) || [];
    form.setValue(`systemComponents.${field}`, [...currentValues, newItem]);
    setNewItem('');
  };

  const removeItem = (field: ArrayComponentField, index: number) => {
    const currentValues = form.getValues(`systemComponents.${field}`) || [];
    form.setValue(
      `systemComponents.${field}`,
      currentValues.filter((_, i) => i !== index)
    );
  };

  const renderArrayField = (
    title: string,
    field: ArrayComponentField,
    placeholder: string
  ) => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <Button type="button" onClick={() => addItem(field)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {form.watch(`systemComponents.${field}`)?.map((item: string, index: number) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-2">
            {item}
            <X 
              className="w-3 h-3 cursor-pointer" 
              onClick={() => removeItem(field, index)}
            />
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Primary Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="systemComponents.primary.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Component Type</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter component type" />
                </FormControl>
              </FormItem>
            )}
          />
          {renderArrayField(
            'Components',
            'primary.components',
            'Add primary component'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avionics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Navigation Systems',
            'avionics.navigation',
            'Add navigation system'
          )}
          {renderArrayField(
            'Control Systems',
            'avionics.control',
            'Add control system'
          )}
          {renderArrayField(
            'Termination Systems',
            'avionics.termination',
            'Add termination system'
          )}
          {renderArrayField(
            'Optional Systems',
            'avionics.optional',
            'Add optional system'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="systemComponents.communications.primary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Communication System</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter primary communication system details"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {renderArrayField(
            'Backup Systems',
            'communications.backup',
            'Add backup communication system'
          )}
          {renderArrayField(
            'Communication Protocols',
            'communications.protocols',
            'Add communication protocol'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Systems</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="systemComponents.tracking.primary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Tracking System</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter primary tracking system details"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="systemComponents.tracking.backup"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Backup Tracking System</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter backup tracking system details"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {renderArrayField(
            'Tracking Features',
            'tracking.features',
            'Add tracking feature'
          )}
        </CardContent>
      </Card>
    </div>
  );
} 