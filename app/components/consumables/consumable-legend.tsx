'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Package, Info, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Consumable } from '@/app/lib/types/system';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useState } from 'react';

interface ConsumableLegendProps {
  consumables: Consumable[];
  onAdd: (consumable: Consumable) => void;
  onUpdate: (id: string, updates: Partial<Consumable>) => void;
  onDelete: (id: string) => void;
}

export function ConsumableLegend({ consumables, onAdd, onUpdate, onDelete }: ConsumableLegendProps) {
  const [open, setOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Consumable>>({
    name: '',
    unit: '',
    currentUnitCost: 0,
    category: '',
    description: '',
    notes: ''
  });

  const handleAddClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!newItem.name || !newItem.unit) return;
    
    const consumable: Consumable = {
      id: crypto.randomUUID(),
      name: newItem.name,
      unit: newItem.unit,
      currentUnitCost: newItem.currentUnitCost || 0,
      category: newItem.category || 'Uncategorized',
      description: newItem.description,
      notes: newItem.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await onAdd(consumable);
    setNewItem({
      name: '',
      unit: '',
      currentUnitCost: 0,
      category: '',
      description: '',
      notes: ''
    });
    setOpen(false);
  };

  const handleEmptyStateAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const consumable: Consumable = {
      id: crypto.randomUUID(),
      name: 'New Item',
      unit: 'units',
      currentUnitCost: 0,
      category: 'Uncategorized',
      description: '',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    onAdd(consumable);
  };

  // Group consumables by category
  const groupedConsumables = consumables.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, Consumable[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Consumables Reference</h2>
          <p className="text-sm text-muted-foreground">
            Standard consumables catalog for use across systems and equipment
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Add Reference Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Reference Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  placeholder="e.g., Chemicals, Supplies"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="e.g., liters"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost per Unit</Label>
                  <Input
                    type="number"
                    value={newItem.currentUnitCost}
                    onChange={(e) => setNewItem({ ...newItem, currentUnitCost: parseFloat(e.target.value) })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Item description"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
              <Button onClick={handleAddClick} className="w-full">
                Add Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(groupedConsumables).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-muted-foreground" />
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {item.unit}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Base Cost: ${item.currentUnitCost}/{item.unit}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {item.description}
                      </p>
                    )}
                    {item.notes && (
                      <div className="text-sm text-muted-foreground mt-2">
                        <strong>Notes:</strong> {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {consumables.length === 0 && (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <Package className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="font-semibold">No reference items</h3>
              <p className="text-sm text-muted-foreground">Add items to build your consumables catalog.</p>
            </div>
            <Button onClick={handleEmptyStateAdd} variant="secondary" className="mt-4">
              <Package className="h-4 w-4 mr-2" /> Add First Item
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
} 