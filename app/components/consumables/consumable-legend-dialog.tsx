'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { BookOpen } from 'lucide-react';
import { ConsumableLegend } from './consumable-legend';
import { Consumable } from '@/app/lib/types/system';

interface ConsumableLegendDialogProps {
  consumables: Consumable[];
  onAdd: (consumable: Consumable) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Consumable>) => void;
  onDelete: (id: string) => void;
}

export function ConsumableLegendDialog({ consumables, onAdd, onUpdate, onDelete }: ConsumableLegendDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="ml-2">
          <BookOpen className="h-4 w-4 mr-2" />
          Reference
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Consumables Reference</DialogTitle>
        </DialogHeader>
        <ConsumableLegend
          consumables={consumables}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </DialogContent>
    </Dialog>
  );
} 