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

type ArrayLogisticsField = 
  | 'shipping.methods'
  | 'shipping.restrictions'
  | 'shipping.requirements'
  | 'refurbishment.options'
  | 'refurbishment.requirements'
  | 'spares.required'
  | 'spares.recommended';

export function LogisticsFields() {
  const form = useFormContext<Equipment>();
  const [newItem, setNewItem] = useState('');

  const addItem = (field: ArrayLogisticsField) => {
    if (!newItem) return;
    
    const currentValues = form.getValues(`logistics.${field}`) || [];
    form.setValue(`logistics.${field}`, [...currentValues, newItem]);
    setNewItem('');
  };

  const removeItem = (field: ArrayLogisticsField, index: number) => {
    const currentValues = form.getValues(`logistics.${field}`) || [];
    form.setValue(
      `logistics.${field}`,
      currentValues.filter((_, i) => i !== index)
    );
  };

  const renderArrayField = (
    title: string,
    field: ArrayLogisticsField,
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
        {form.watch(`logistics.${field}`)?.map((item: string, index: number) => (
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
          <CardTitle>Procurement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="logistics.procurement.leadTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Time</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter lead time details"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="logistics.procurement.pricing"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pricing</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter pricing details"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="logistics.procurement.terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter procurement terms"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Shipping Methods',
            'shipping.methods',
            'Add shipping method'
          )}
          {renderArrayField(
            'Shipping Restrictions',
            'shipping.restrictions',
            'Add shipping restriction'
          )}
          {renderArrayField(
            'Shipping Requirements',
            'shipping.requirements',
            'Add shipping requirement'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Refurbishment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Refurbishment Options',
            'refurbishment.options',
            'Add refurbishment option'
          )}
          {renderArrayField(
            'Refurbishment Requirements',
            'refurbishment.requirements',
            'Add refurbishment requirement'
          )}
          <FormField
            control={form.control}
            name="logistics.refurbishment.pricing"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Refurbishment Pricing</FormLabel>
                <FormControl>
                  <FormTextarea {...field} placeholder="Enter refurbishment pricing details" />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spare Parts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Required Spares',
            'spares.required',
            'Add required spare part'
          )}
          {renderArrayField(
            'Recommended Spares',
            'spares.recommended',
            'Add recommended spare part'
          )}
          <FormField
            control={form.control}
            name="logistics.spares.availability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spares Availability</FormLabel>
                <FormControl>
                  <FormTextarea {...field} placeholder="Enter spares availability details" />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
} 