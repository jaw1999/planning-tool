'use client';

import { useFormContext } from 'react-hook-form';
import { Equipment } from '@/app/lib/types/equipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl } from '@/app/components/ui/form';

export function PhysicalSpecsFields() {
  const form = useFormContext<Equipment>();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Base Unit Dimensions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="physicalSpecifications.dimensions.baseUnit.height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Height" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="physicalSpecifications.dimensions.baseUnit.width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Width" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="physicalSpecifications.dimensions.baseUnit.length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Length" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="physicalSpecifications.dimensions.baseUnit.unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Unit (e.g., cm, in)" />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>      
      <Card>
        <CardHeader>
          <CardTitle>Weight Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="physicalSpecifications.weight.baseUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Weight</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Base weight" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="physicalSpecifications.weight.unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight Unit</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Unit (e.g., kg, lbs)" />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
} 