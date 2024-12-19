import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { System } from '@/app/lib/types/system';
import { X } from 'lucide-react';

interface AddSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (system: Partial<System>) => Promise<void>;
}

type SystemFormData = Required<Pick<System, 'name' | 'description' | 'basePrice' | 'hasLicensing' | 'licensePrice' | 'leadTime' | 'consumablesRate'>>;

export function AddSystemModal({ isOpen, onClose, onAdd }: AddSystemModalProps) {
  const [systemData, setSystemData] = useState<SystemFormData>({
    name: '',
    description: '',
    basePrice: 0,
    hasLicensing: false,
    licensePrice: 0,
    leadTime: 0,
    consumablesRate: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!systemData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (systemData.basePrice <= 0) {
      newErrors.basePrice = 'Base price must be greater than 0';
    }

    if (systemData.leadTime < 0) {
      newErrors.leadTime = 'Lead time cannot be negative';
    }

    if (systemData.hasLicensing && (!systemData.licensePrice || systemData.licensePrice <= 0)) {
      newErrors.licensePrice = 'License price is required when licensing is enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onAdd(systemData);
      onClose();
    } catch (error) {
      console.error('Failed to add system:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Add New System</CardTitle>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={systemData.name}
                  onChange={e => setSystemData(d => ({ ...d, name: e.target.value }))}
                  className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Base Price</label>
                <input
                  type="number"
                  value={systemData.basePrice}
                  onChange={e => setSystemData(d => ({ ...d, basePrice: parseFloat(e.target.value) || 0 }))}
                  className={`w-full p-2 border rounded ${errors.basePrice ? 'border-red-500' : ''}`}
                />
                {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Lead Time (days)</label>
                <input
                  type="number"
                  value={systemData.leadTime}
                  onChange={e => setSystemData(d => ({ ...d, leadTime: parseInt(e.target.value) || 0 }))}
                  className={`w-full p-2 border rounded ${errors.leadTime ? 'border-red-500' : ''}`}
                />
                {errors.leadTime && <p className="text-red-500 text-sm mt-1">{errors.leadTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Monthly Consumables Rate</label>
                <input
                  type="number"
                  value={systemData.consumablesRate}
                  onChange={e => setSystemData(d => ({ ...d, consumablesRate: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={systemData.description}
                onChange={e => setSystemData(d => ({ ...d, description: e.target.value }))}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={systemData.hasLicensing}
                  onChange={e => setSystemData(d => ({ ...d, hasLicensing: e.target.checked }))}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Requires Licensing</label>
              </div>

              {systemData.hasLicensing && (
                <div>
                  <label className="block text-sm font-medium mb-1">License Price (per month)</label>
                  <input
                    type="number"
                    value={systemData.licensePrice}
                    onChange={e => setSystemData(d => ({ ...d, licensePrice: parseFloat(e.target.value) || 0 }))}
                    className={`w-full p-2 border rounded ${errors.licensePrice ? 'border-red-500' : ''}`}
                  />
                  {errors.licensePrice && <p className="text-red-500 text-sm mt-1">{errors.licensePrice}</p>}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add System
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}