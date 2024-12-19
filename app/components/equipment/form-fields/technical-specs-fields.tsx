'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { Equipment } from '@/app/lib/types/equipment';

interface FieldProps {
  onChange: (value: any) => void;
  value: any;
  name: string;
}

export function TechnicalSpecsFields() {
  const form = useFormContext<Equipment>();
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const specifications = form.watch('specifications') || {};

  const addSpecification = () => {
    if (newSpecKey && newSpecValue) {
      const updatedSpecs = {
        ...specifications,
        [newSpecKey]: newSpecValue
      };
      form.setValue('specifications', updatedSpecs);
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const removeSpecification = (key: string) => {
    const { [key]: _, ...rest } = specifications;
    form.setValue('specifications', rest);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dimensions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dimensions.length"
            render={({ field }: { field: FieldProps }) => (
              <FormItem>
                <FormLabel>Length</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dimensions.width"
            render={({ field }: { field: FieldProps }) => (
              <FormItem>
                <FormLabel>Width</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dimensions.height"
            render={({ field }: { field: FieldProps }) => (
              <FormItem>
                <FormLabel>Height</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dimensions.unit"
            render={({ field }: { field: FieldProps }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., cm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weight</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weight.value"
            render={({ field }: { field: FieldProps }) => (
              <FormItem>
                <FormLabel>Weight</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 75" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight.unit"
            render={({ field }: { field: FieldProps }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., kg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Specification name"
              value={newSpecKey}
              onChange={(e) => setNewSpecKey(e.target.value)}
            />
            <Input
              placeholder="Value"
              value={newSpecValue}
              onChange={(e) => setNewSpecValue(e.target.value)}
            />
            <Button type="button" onClick={addSpecification}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {Object.entries(specifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium">{key}: </span>
                  <span>{value}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSpecification(key)}
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 