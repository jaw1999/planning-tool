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

type ArrayCommunicationField = 
  | 'communications.backup'
  | 'communications.protocols';

export function CommunicationsFields() {
  const form = useFormContext<Equipment>();
  const [newItem, setNewItem] = useState('');

  const addItem = (field: ArrayCommunicationField) => {
    if (!newItem) return;
    
    const currentValues = form.getValues(`systemComponents.${field}`) || [];
    form.setValue(`systemComponents.${field}`, [...currentValues, newItem]);
    setNewItem('');
  };

  const removeItem = (field: ArrayCommunicationField, index: number) => {
    const currentValues = form.getValues(`systemComponents.${field}`) || [];
    form.setValue(
      `systemComponents.${field}`,
      currentValues.filter((_, i) => i !== index)
    );
  };

  const renderArrayField = (
    title: string,
    field: ArrayCommunicationField,
    placeholder: string
  ) => (
    <div className="space-y-4">
      <FormLabel>{title}</FormLabel>
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
    <Card>
      <CardHeader>
        <CardTitle>Communications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="systemComponents.communications.primary.type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Communication System Type</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter communication system type" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="systemComponents.communications.primary.specifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Communication Specifications</FormLabel>
              <FormControl>
                <FormTextarea {...field} placeholder="Enter communication specifications" />
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
  );
} 