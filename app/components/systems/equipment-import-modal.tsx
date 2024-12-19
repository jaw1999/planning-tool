'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Equipment } from '@/app/lib/types/equipment';
import { System } from '@/app/lib/types/system';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Search } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';

interface EquipmentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (equipment: Equipment) => Promise<void>;
}

export function EquipmentImportModal({ isOpen, onClose, onImport }: EquipmentImportModalProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchEquipment();
    }
  }, [isOpen]);

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment');
      const data = await response.json();
      setEquipment(data);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToSystem = (equipment: Equipment): Partial<System> => {
    return {
      name: equipment.productInfo?.name || '',
      description: equipment.productInfo?.description || '',
      basePrice: equipment.acquisitionCost || 0,
      leadTime: equipment.logistics?.procurement?.leadTime?.standard || 30,
      hasLicensing: Boolean(equipment.software?.licensing?.type),
      licensePrice: equipment.software?.licensing?.terms?.monthlyFee || 0,
      consumablesRate: equipment.logistics?.spares?.availability?.monthlyRate || 0,
      specifications: {
        dimensions: {
          length: equipment.dimensions?.length || 0,
          width: equipment.dimensions?.width || 0,
          height: equipment.dimensions?.height || 0,
          unit: equipment.dimensions?.unit || 'mm'
        },
        weight: {
          base: equipment.weight?.value || 0,
          loaded: equipment.weight?.value || 0,
          unit: equipment.weight?.unit || 'kg'
        },
        power: {
          voltage: equipment.powerRequirements?.voltage || 0,
          amperage: equipment.powerRequirements?.amperage || 0,
          frequency: Number(equipment.powerRequirements?.frequency) || 0
        },
        environmental: {
          temperature: { min: 0, max: 50, unit: 'C' },
          humidity: { min: 0, max: 95, unit: '%' },
          ipRating: equipment.environmentalSpecifications?.certifications?.environmental?.find(
            cert => cert.toLowerCase().startsWith('ip')
          ) || undefined
        }
      }
    };
  };

  const filteredEquipment = equipment.filter(item =>
    item.productInfo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEquipmentClick = (equipment: Equipment) => {
    onImport(equipment);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Equipment as System</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredEquipment.map((item) => (
            <div
              key={item.id}
              className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => handleEquipmentClick(item)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.productInfo.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {item.productInfo.description}
                  </div>
                </div>
                <Badge>{item.status}</Badge>
              </div>
              <div className="mt-2 text-sm grid grid-cols-2 gap-2">
                <div>Base Price: ${item.acquisitionCost?.toLocaleString() || '0'}</div>
                {item.software?.licensing?.type && (
                  <div>License: ${item.software?.licensing?.terms?.monthlyFee?.toLocaleString() || '0'}/mo</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 