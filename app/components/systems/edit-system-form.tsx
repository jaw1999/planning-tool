import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { System } from '@/app/lib/types/system';
import { AlertCircle } from 'lucide-react';

interface EditSystemFormProps {
  system: System;
  onSave: (updatedSystem: Partial<System>) => Promise<void>;
  onCancel: () => void;
}

export function EditSystemForm({ system, onSave, onCancel }: EditSystemFormProps) {
  const [formData, setFormData] = useState<Partial<System>>({
    name: system.name,
    description: system.description,
    basePrice: system.basePrice,
    hasLicensing: system.hasLicensing,
    licensePrice: system.licensePrice,
    leadTime: system.leadTime,
    consumablesRate: system.consumablesRate,
    specifications: system.specifications
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.basePrice || formData.basePrice <= 0) {
      newErrors.basePrice = 'Base price must be greater than 0';
    }

    if (!formData.leadTime || formData.leadTime < 0) {
      newErrors.leadTime = 'Lead time cannot be negative';
    }

    if (formData.hasLicensing && (!formData.licensePrice || formData.licensePrice <= 0)) {
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
      setIsSubmitting(true);
      await onSave(formData);
    } catch (error) {
      console.error('Failed to update system:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to update system. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpecificationChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value
      }
    }));
  };

  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        ['New Field']: ''
      }
    }));
  };

  const removeSpecification = (key: string) => {
    if (!formData.specifications) return;
    
    const { [key]: _, ...rest } = formData.specifications;
    setFormData(prev => ({
      ...prev,
      specifications: rest
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Base Price</label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={e => setFormData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) }))}
                className={`w-full p-2 border rounded ${errors.basePrice ? 'border-red-500' : ''}`}
              />
              {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operating Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Lead Time (days)</label>
              <input
                type="number"
                value={formData.leadTime}
                onChange={e => setFormData(prev => ({ ...prev, leadTime: parseInt(e.target.value) }))}
                className={`w-full p-2 border rounded ${errors.leadTime ? 'border-red-500' : ''}`}
              />
              {errors.leadTime && <p className="text-red-500 text-sm mt-1">{errors.leadTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Monthly Consumables Rate</label>
              <input
                type="number"
                value={formData.consumablesRate}
                onChange={e => setFormData(prev => ({ ...prev, consumablesRate: parseFloat(e.target.value) }))}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={formData.hasLicensing}
                onChange={e => setFormData(prev => ({ ...prev, hasLicensing: e.target.checked }))}
                className="mr-2"
              />
              <label className="text-sm font-medium">Requires Licensing</label>
            </div>

            {formData.hasLicensing && (
              <div>
                <label className="block text-sm font-medium mb-1">License Price (per month)</label>
                <input
                  type="number"
                  value={formData.licensePrice}
                  onChange={e => setFormData(prev => ({ ...prev, licensePrice: parseFloat(e.target.value) }))}
                  className={`w-full p-2 border rounded ${errors.licensePrice ? 'border-red-500' : ''}`}
                />
                {errors.licensePrice && <p className="text-red-500 text-sm mt-1">{errors.licensePrice}</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Specifications</span>
            <button
              type="button"
              onClick={addSpecification}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Field
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.specifications && Object.entries(formData.specifications).map(([key, value]) => (
              <div key={key} className="flex gap-4">
                <input
                  type="text"
                  value={key}
                  onChange={e => {
                    if (formData.specifications) {
                      const { [key]: value, ...rest } = formData.specifications;
                      setFormData(prev => ({
                        ...prev,
                        specifications: {
                          ...rest,
                          [e.target.value]: value
                        }
                      }));
                    }
                  }}
                  className="w-1/3 p-2 border rounded"
                  placeholder="Field name"
                />
                <input
                  type="text"
                  value={value as string}
                  onChange={e => handleSpecificationChange(key, e.target.value)}
                  className="flex-1 p-2 border rounded"
                  placeholder="Value"
                />
                <button
                  type="button"
                  onClick={() => removeSpecification(key)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {errors.submit && (
        <div className="flex items-center p-4 bg-red-50 text-red-600 rounded">
          <AlertCircle className="w-5 h-5 mr-2" />
          {errors.submit}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}