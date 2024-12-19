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

type ArrayIntegrationField = keyof {
  [K in keyof Equipment['integration']]: K extends 'platforms' | 'payloads' | 'infrastructure'
    ? Equipment['integration'][K] extends { compatible?: string[] }
      ? `integration.${K}.compatible`
      : never
    : never;
}[keyof Equipment['integration']];

export function IntegrationFields() {
  const form = useFormContext<Equipment>();
  const [newItem, setNewItem] = useState('');

  const addItem = (field: ArrayIntegrationField) => {
    if (!newItem) return;
    const currentValues = form.getValues(field as any) || [];
    form.setValue(field as any, [...currentValues, newItem]);
    setNewItem('');
  };

  const removeItem = (field: ArrayIntegrationField, index: number) => {
    const currentValues = form.getValues(field as any) || [];
    form.setValue(
      field as any,
      currentValues.filter((_: string, i: number) => i !== index)
    );
  };

  const renderArrayField = (
    label: string,
    field: ArrayIntegrationField,
    placeholder: string
  ) => {
    const values = form.watch(field as any) || [];

    return (
      <div className="space-y-2">
        <FormLabel>{label}</FormLabel>
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <Button type="button" onClick={() => addItem(field)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {values.map((item: string, index: number) => (
            <Badge key={index} variant="secondary">
              {item}
              <button
                type="button"
                onClick={() => removeItem(field, index)}
                className="ml-2"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Platform Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="integration.platforms.requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform Requirements</FormLabel>
                <FormControl>
                  <FormTextarea {...field} placeholder="Enter platform requirements" />
                </FormControl>
              </FormItem>
            )}
          />
          {renderArrayField(
            'Compatible Platforms',
            'integration.platforms.compatible' as ArrayIntegrationField,
            'Add compatible platform'
          )}
        </CardContent>
      </Card>

      {/* Similar cards for payloads and infrastructure */}
    </div>
  );
} 