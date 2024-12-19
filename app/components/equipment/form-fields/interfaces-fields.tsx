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

type ArrayInterfaceField = 
  | 'interfaces.mechanical.connections'
  | 'interfaces.mechanical.mounts'
  | 'interfaces.mechanical.payload'
  | 'interfaces.electrical.connectors'
  | 'interfaces.data.protocols'
  | 'interfaces.data.types'
  | 'interfaces.data.ports'
  | 'interfaces.control.methods';

export function InterfacesFields() {
  const form = useFormContext<Equipment>();
  const [newItem, setNewItem] = useState('');

  const addItem = (field: ArrayInterfaceField) => {
    if (!newItem) return;
    const currentValues = form.getValues(field) || [];
    form.setValue(field, [...currentValues, newItem]);
    setNewItem('');
  };

  const removeItem = (field: ArrayInterfaceField, index: number) => {
    const currentValues = form.getValues(field) || [];
    form.setValue(
      field,
      currentValues.filter((_: string, i: number) => i !== index)
    );
  };

  const renderArrayField = (
    label: string,
    field: ArrayInterfaceField,
    placeholder: string
  ) => {
    const values = form.watch(field) || [];

    return (
      <div className="space-y-2">
        <FormLabel>{label}</FormLabel>
        <div className="flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={placeholder}
            onKeyPress={(e) => e.key === 'Enter' && addItem(field)}
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
          <CardTitle>Mechanical Interfaces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Connections',
            'interfaces.mechanical.connections',
            'Add mechanical connection'
          )}
          {renderArrayField(
            'Mounts',
            'interfaces.mechanical.mounts',
            'Add mount type'
          )}
          {renderArrayField(
            'Payload Interfaces',
            'interfaces.mechanical.payload',
            'Add payload interface'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Electrical Interfaces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="interfaces.electrical.power"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Power Specifications</FormLabel>
                <FormControl>
                  <FormTextarea {...field} placeholder="Enter power interface specifications" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="interfaces.electrical.signals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Signal Specifications</FormLabel>
                <FormControl>
                  <FormTextarea {...field} placeholder="Enter signal interface specifications" />
                </FormControl>
              </FormItem>
            )}
          />
          {renderArrayField(
            'Connectors',
            'interfaces.electrical.connectors',
            'Add electrical connector'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Interfaces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Data Types',
            'interfaces.data.types',
            'Add data type'
          )}
          {renderArrayField(
            'Protocols',
            'interfaces.data.protocols',
            'Add protocol'
          )}
          {renderArrayField(
            'Ports',
            'interfaces.data.ports',
            'Add data port'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Control Interfaces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Control Methods',
            'interfaces.control.methods',
            'Add control method'
          )}
        </CardContent>
      </Card>
    </div>
  );
} 