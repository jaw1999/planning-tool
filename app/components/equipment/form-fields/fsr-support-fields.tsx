'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Plus, X } from 'lucide-react';
import { FSRFrequency, Equipment } from '@/app/lib/types/equipment';
import { Badge } from '@/app/components/ui/badge';

interface FieldProps {
  onChange: (value: any) => void;
  value: any;
  name: string;
}

type FSRRequirementField = 'specializations' | 'certifications' | 'tools';

export function FSRSupportFields() {
  const form = useFormContext<Equipment>();
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newTool, setNewTool] = useState('');

  const addItem = (field: FSRRequirementField, value: string, setter: (value: string) => void) => {
    if (value) {
      const currentItems = form.getValues(`fsrRequirements.${field}`) || [];
      form.setValue(`fsrRequirements.${field}`, [...currentItems, value]);
      setter('');
    }
  };

  const removeItem = (field: FSRRequirementField, index: number) => {
    const currentItems = form.getValues(`fsrRequirements.${field}`) || [];
    const updatedItems = currentItems.filter((_, i) => i !== index);
    form.setValue(`fsrRequirements.${field}`, updatedItems);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>FSR Support Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="fsrFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Support Frequency</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(FSRFrequency).map((frequency) => (
                      <SelectItem key={frequency} value={frequency}>
                        {frequency.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fsrRequirements.staffing"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required Staffing</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 2 FSRs per visit"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required Specializations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add specialization"
              value={newSpecialization}
              onChange={(e) => setNewSpecialization(e.target.value)}
            />
            <Button 
              type="button"
              onClick={() => addItem('specializations', newSpecialization, setNewSpecialization)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.watch('fsrRequirements.specializations')?.map((spec: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-2">
                {spec}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeItem('specializations', index)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required Certifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add certification"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
            />
            <Button 
              type="button"
              onClick={() => addItem('certifications', newCertification, setNewCertification)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.watch('fsrRequirements.certifications')?.map((cert: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-2">
                {cert}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeItem('certifications', index)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add tool"
              value={newTool}
              onChange={(e) => setNewTool(e.target.value)}
            />
            <Button 
              type="button"
              onClick={() => addItem('tools', newTool, setNewTool)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.watch('fsrRequirements.tools')?.map((tool: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-2">
                {tool}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeItem('tools', index)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 