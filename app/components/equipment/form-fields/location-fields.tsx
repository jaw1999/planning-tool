'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Equipment } from '@/app/lib/types/equipment';

interface FieldProps {
  onChange: (value: any) => void;
  value: any;
  name: string;
}

export function LocationFields() {
  const form = useFormContext<Equipment>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location & Tracking</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="location"
          render={({ field }: { field: FieldProps }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Warehouse A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="serialNumber"
          render={({ field }: { field: FieldProps }) => (
            <FormItem>
              <FormLabel>Serial Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., SN123456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assetTag"
          render={({ field }: { field: FieldProps }) => (
            <FormItem>
              <FormLabel>Asset Tag</FormLabel>
              <FormControl>
                <Input placeholder="e.g., AT7890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
} 