import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface ArrayFieldProps {
  label: string;
  path: string;
  placeholder: string;
}

export function ArrayField({ label, path, placeholder }: ArrayFieldProps) {
  const form = useFormContext();
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (!newItem) return;
    
    const currentValues = form.getValues(path) || [];
    form.setValue(path, [...currentValues, newItem]);
    setNewItem('');
  };

  const removeItem = (index: number) => {
    const currentValues = form.getValues(path) || [];
    form.setValue(
      path,
      currentValues.filter((_: string, i: number) => i !== index)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button type="button" onClick={addItem}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {form.watch(path)?.map((item: string, index: number) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-2">
            {item}
            <X 
              className="w-3 h-3 cursor-pointer" 
              onClick={() => removeItem(index)}
            />
          </Badge>
        ))}
      </div>
    </div>
  );
} 