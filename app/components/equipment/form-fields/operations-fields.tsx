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

type ArrayOperationsField = 
  | 'deployment.methods'
  | 'deployment.requirements'
  | 'deployment.limitations'
  | 'maintenance.scheduled'
  | 'maintenance.unscheduled'
  | 'maintenance.requirements'
  | 'support.documentation'
  | 'training.certification';

export function OperationsFields() {
  const form = useFormContext<Equipment>();
  const [newItem, setNewItem] = useState('');

  const addItem = (field: ArrayOperationsField) => {
    if (!newItem) return;
    
    const currentValues = form.getValues(`operations.${field}`) || [];
    form.setValue(`operations.${field}`, [...currentValues, newItem]);
    setNewItem('');
  };

  const removeItem = (field: ArrayOperationsField, index: number) => {
    const currentValues = form.getValues(`operations.${field}`) || [];
    form.setValue(
      `operations.${field}`,
      currentValues.filter((_, i) => i !== index)
    );
  };

  const renderArrayField = (
    title: string,
    field: ArrayOperationsField,
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
        {form.watch(`operations.${field}`)?.map((item: string, index: number) => (
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
          <CardTitle>Deployment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Deployment Methods',
            'deployment.methods',
            'Add deployment method'
          )}
          {renderArrayField(
            'Deployment Requirements',
            'deployment.requirements',
            'Add deployment requirement'
          )}
          {renderArrayField(
            'Deployment Limitations',
            'deployment.limitations',
            'Add deployment limitation'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="operations.training.required"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required Training</FormLabel>
                <FormControl>
                  <FormTextarea {...field} placeholder="Enter required training details" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="operations.training.optional"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Optional Training</FormLabel>
                <FormControl>
                  <FormTextarea {...field} placeholder="Enter optional training details" />
                </FormControl>
              </FormItem>
            )}
          />
          {renderArrayField(
            'Training Certifications',
            'training.certification',
            'Add training certification'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Scheduled Maintenance',
            'maintenance.scheduled',
            'Add scheduled maintenance item'
          )}
          {renderArrayField(
            'Unscheduled Maintenance',
            'maintenance.unscheduled',
            'Add unscheduled maintenance item'
          )}
          {renderArrayField(
            'Maintenance Requirements',
            'maintenance.requirements',
            'Add maintenance requirement'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="operations.support.onsite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Onsite Support</FormLabel>
                <FormControl>
                  <FormTextarea {...field} placeholder="Enter onsite support details" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="operations.support.remote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remote Support</FormLabel>
                <FormControl>
                  <FormTextarea {...field} placeholder="Enter remote support details" />
                </FormControl>
              </FormItem>
            )}
          />
          {renderArrayField(
            'Support Documentation',
            'support.documentation',
            'Add support documentation'
          )}
        </CardContent>
      </Card>
    </div>
  );
} 