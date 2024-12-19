'use client';

import { useFormContext } from 'react-hook-form';
import { Equipment } from '@/app/lib/types/equipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl } from '@/app/components/ui/form';
import { FormTextarea } from '@/app/components/ui/form-textarea';

export function EnvironmentalSpecificationsFields() {
  const form = useFormContext<Equipment>();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Temperature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="environmentalSpecifications.temperature.operating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operating Temperature Range</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter operating temperature range (e.g., -20°C to +50°C)" 
                    value={field.value || ''}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="environmentalSpecifications.temperature.storage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Temperature Range</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter storage temperature range (e.g., -40°C to +70°C)"
                    value={field.value || ''}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weather Protection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="environmentalSpecifications.weather.wind"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wind Resistance</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter wind resistance specifications"
                    value={field.value || ''}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="environmentalSpecifications.weather.precipitation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precipitation Protection</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter precipitation protection specifications"
                    value={field.value || ''}
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