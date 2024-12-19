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

type ArrayRFField = 
  | 'frequencies.ranges'
  | 'frequencies.bands'
  | 'features';

export function RFSpecificationsFields() {
  const form = useFormContext<Equipment>();
  const [newItem, setNewItem] = useState('');

  const addItem = (field: ArrayRFField) => {
    if (!newItem) return;
    
    const currentValues = form.getValues(`systemComponents.rfSpecifications.${field}`) || [];
    form.setValue(`systemComponents.rfSpecifications.${field}`, [...currentValues, newItem]);
    setNewItem('');
  };

  const removeItem = (field: ArrayRFField, index: number) => {
    const currentValues = form.getValues(`systemComponents.rfSpecifications.${field}`) || [];
    form.setValue(
      `systemComponents.rfSpecifications.${field}`,
      currentValues.filter((_, i) => i !== index)
    );
  };

  const renderArrayField = (
    title: string,
    field: ArrayRFField,
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
        {form.watch(`systemComponents.rfSpecifications.${field}`)?.map((item: string, index: number) => (
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
          <CardTitle>Frequencies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Frequency Ranges',
            'frequencies.ranges',
            'Add frequency range'
          )}
          {renderArrayField(
            'Frequency Bands',
            'frequencies.bands',
            'Add frequency band'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Power</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="systemComponents.rfSpecifications.power.tx"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transmit Power</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter transmit power specifications (frequency ranges, power levels, modes)"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="systemComponents.rfSpecifications.power.rx"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receive Power</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter receive power specifications (sensitivity, dynamic range, modes)"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RF Features</CardTitle>
        </CardHeader>
        <CardContent>
          {renderArrayField(
            'RF Features',
            'features',
            'Add RF feature'
          )}
        </CardContent>
      </Card>
    </div>
  );
} 