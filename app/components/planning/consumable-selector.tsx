'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Plus, Search } from 'lucide-react';
import { Consumable } from '@/app/lib/types/system';

interface ConsumableSelectorProps {
  availableConsumables: Consumable[];
  selectedConsumables: Array<{ id: string; quantity: number }>;
  onConsumablesChange: (consumables: Array<{ id: string; quantity: number }>) => void;
}

export function ConsumableSelector({ 
  availableConsumables, 
  selectedConsumables, 
  onConsumablesChange 
}: ConsumableSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleQuantityChange = (consumableId: string, quantity: number) => {
    const updated = selectedConsumables.map(c => 
      c.id === consumableId ? { ...c, quantity } : c
    );
    onConsumablesChange(updated);
  };

  const handleAddConsumable = (consumable: Consumable) => {
    if (selectedConsumables.some(c => c.id === consumable.id)) return;
    
    onConsumablesChange([
      ...selectedConsumables,
      { id: consumable.id, quantity: 1 }
    ]);
    setOpen(false);
  };

  const handleRemoveConsumable = (consumableId: string) => {
    onConsumablesChange(selectedConsumables.filter(c => c.id !== consumableId));
  };

  // Group consumables by category
  const groupedConsumables = availableConsumables.reduce((acc, item) => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return acc;
    }
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, Consumable[]>);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Exercise Consumables</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Consumable
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Consumables</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search consumables..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                {Object.entries(groupedConsumables).map(([category, items]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {item.unit}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ${item.currentUnitCost}/{item.unit}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddConsumable(item)}
                              disabled={selectedConsumables.some(c => c.id === item.id)}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {selectedConsumables.map((selected) => {
          const consumable = availableConsumables.find(c => c.id === selected.id);
          if (!consumable) return null;

          return (
            <div
              key={selected.id}
              className="flex items-center gap-4 p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{consumable.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {consumable.unit}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  ${consumable.currentUnitCost * selected.quantity} total
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={selected.quantity}
                  onChange={(e) => handleQuantityChange(selected.id, parseInt(e.target.value) || 0)}
                  className="w-20"
                  min="1"
                />
                <span className="text-sm text-muted-foreground">{consumable.unit}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleRemoveConsumable(selected.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 