'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

export function CostFields() {
  const form = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="acquisitionCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Acquisition Cost</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 10000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fsrSupportCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>FSR Support Cost (Annual)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 500" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
} 