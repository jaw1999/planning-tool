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
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-600">{system.description}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Base Price:</span>
                  <span className="ml-2">${system.basePrice.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium">Lead Time:</span>
                  <span className="ml-2">{system.leadTime} days</span>
                </div>
                {system.hasLicensing && (
                  <div>
                    <span className="font-medium">License:</span>
                    <span className="ml-2">${system.licensePrice?.toLocaleString()}/mo</span>
                  </div>
                )}
                {system.consumablesRate && (
                  <div>
                    <span className="font-medium">Consumables:</span>
                    <span className="ml-2">${system.consumablesRate.toLocaleString()}/mo</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}