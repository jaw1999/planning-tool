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

type ArraySoftwareField = 
  | 'control.interfaces'
  | 'control.features'
  | 'planning.tools'
  | 'planning.capabilities'
  | 'analysis.realtime'
  | 'analysis.postMission'
  | 'licensing.restrictions';

export function SoftwareFields() {
  const form = useFormContext<Equipment>();
  const [newItem, setNewItem] = useState('');

  const addItem = (field: ArraySoftwareField) => {
    if (!newItem) return;
    
    const currentValues = form.getValues(`software.${field}`) || [];
    form.setValue(`software.${field}`, [...currentValues, newItem]);
    setNewItem('');
  };

  const removeItem = (field: ArraySoftwareField, index: number) => {
    const currentValues = form.getValues(`software.${field}`) || [];
    form.setValue(
      `software.${field}`,
      currentValues.filter((_, i) => i !== index)
    );
  };

  const renderArrayField = (
    title: string,
    field: ArraySoftwareField,
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
        {form.watch(`software.${field}`)?.map((item: string, index: number) => (
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
          <CardTitle>Control Software</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="software.control.primary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Control Software</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter primary control software" />
                </FormControl>
              </FormItem>
            )}
          />
          {renderArrayField(
            'Control Interfaces',
            'control.interfaces',
            'Add control interface'
          )}
          {renderArrayField(
            'Control Features',
            'control.features',
            'Add control feature'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planning Software</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Planning Tools',
            'planning.tools',
            'Add planning tool'
          )}
          {renderArrayField(
            'Planning Capabilities',
            'planning.capabilities',
            'Add planning capability'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analysis Software</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Real-time Analysis',
            'analysis.realtime',
            'Add real-time analysis capability'
          )}
          {renderArrayField(
            'Post-Mission Analysis',
            'analysis.postMission',
            'Add post-mission analysis capability'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Licensing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="software.licensing.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Type</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter license type" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="software.licensing.terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Terms</FormLabel>
                <FormControl>
                  <FormTextarea 
                    {...field} 
                    placeholder="Enter detailed license terms (duration, users, restrictions, etc.)"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {renderArrayField(
            'License Restrictions',
            'licensing.restrictions',
            'Add license restriction'
          )}
        </CardContent>
      </Card>
    </div>
  );
} 