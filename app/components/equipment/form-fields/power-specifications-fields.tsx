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

type ArrayPowerField = 
  | 'input.options'
  | 'management.features';

export function PowerSpecificationsFields() {
  const form = useFormContext<Equipment>();
  const [newItem, setNewItem] = useState('');

  const renderArrayField = (label: string, fieldName: ArrayPowerField, placeholder: string) => {
    const items = form.watch(`powerSpecifications.${fieldName}`) as string[];

    const handleAdd = () => {
      if (newItem.trim()) {
        form.setValue(
          `powerSpecifications.${fieldName}`,
          [...items, newItem.trim()]
        );
        setNewItem('');
      }
    };

    const handleRemove = (index: number) => {
      form.setValue(
        `powerSpecifications.${fieldName}`,
        items.filter((_, i) => i !== index)
      );
    };

    return (
      <div className="space-y-2">
        <FormLabel>{label}</FormLabel>
        <div className="flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button type="button" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {items?.map((item, index) => (
            <Badge key={index} variant="secondary">
              {item}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-2 h-4 w-4"
                onClick={() => handleRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
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
          <CardTitle>Input Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="powerSpecifications.input.requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Power Requirements</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter detailed power requirements (voltage, current, frequency, etc.)"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {renderArrayField(
            'Input Options',
            'input.options',
            'Add power input option'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Power Consumption</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="powerSpecifications.consumption.nominal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nominal Power Consumption</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter nominal power consumption details (watts, duration)"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="powerSpecifications.consumption.peak"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peak Power Consumption</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter peak power consumption details (watts, duration)"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="powerSpecifications.consumption.byMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Power Consumption by Mode</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter power consumption for different operational modes (watts per mode)"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Power Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Management Features',
            'management.features',
            'Add power management feature'
          )}
          <FormField
            control={form.control}
            name="powerSpecifications.management.efficiency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Power Efficiency</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter power efficiency details"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
} 