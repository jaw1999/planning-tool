import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { System } from '@/app/lib/types/system';

interface SystemCatalogProps {
  systems: System[];
  onSystemSelect?: (system: System) => void;
}

export function SystemCatalog({ systems, onSystemSelect }: SystemCatalogProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {systems.map((system) => (
        <Card 
          key={system.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onSystemSelect?.(system)}
        >
          <CardHeader>
            <CardTitle>{system.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{system.description}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Price</span>
                <span className="font-medium">${system.basePrice?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lead Time</span>
                <span className="font-medium">{system.leadTime || 0} days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}