import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { System } from '@/app/lib/types/system';

interface SystemFormProps {
  system?: System;
  onSubmit: (data: Partial<System>) => void;
}

export function SystemForm({ system, onSubmit }: SystemFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: Partial<System> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      basePrice: parseFloat(formData.get('basePrice') as string),
      hasLicensing: formData.get('hasLicensing') === 'true',
      licensePrice: parseFloat(formData.get('licensePrice') as string) || undefined,
      maintenanceLevels: {
        basic: parseFloat(formData.get('maintenanceBasic') as string),
        standard: parseFloat(formData.get('maintenanceStandard') as string),
        premium: parseFloat(formData.get('maintenancePremium') as string),
      },
      trainingDaysRequired: parseInt(formData.get('trainingDays') as string),
      trainingCostPerDay: parseFloat(formData.get('trainingCost') as string),
      consumablesRate: parseFloat(formData.get('consumablesRate') as string),
      technicalSupportCost: parseFloat(formData.get('technicalSupportCost') as string),
      sparePartsPackageCost: parseFloat(formData.get('sparePartsPackageCost') as string),
      fsrSupport: {
        available: formData.get('fsrAvailable') === 'true',
        monthlyCost: parseFloat(formData.get('fsrMonthlyCost') as string),
        weeklyMultiplier: parseFloat(formData.get('fsrWeeklyMultiplier') as string),
        biweeklyMultiplier: parseFloat(formData.get('fsrBiweeklyMultiplier') as string),
      },
      specifications: JSON.parse(formData.get('specifications') as string),
      status: formData.get('status') as System['status'],
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="name"
              defaultValue={system?.name}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              defaultValue={system?.description}
              rows={3}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Base Price</label>
            <input
              name="basePrice"
              type="number"
              defaultValue={system?.basePrice}
              required
              min="0"
              className="w-full p-2 border rounded"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recurring Costs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="hasLicensing"
              defaultChecked={system?.hasLicensing}
            />
            <label>Has Licensing Cost</label>
          </div>

          {system?.hasLicensing && (
            <div>
              <label className="block text-sm font-medium mb-1">Monthly License Cost</label>
              <input
                name="licensePrice"
                type="number"
                defaultValue={system?.licensePrice}
                min="0"
                className="w-full p-2 border rounded"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Monthly Consumables Rate</label>
            <input
              name="consumablesRate"
              type="number"
              defaultValue={system?.consumablesRate}
              min="0"
              className="w-full p-2 border rounded"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Basic (Monthly Cost)</label>
            <input
              name="maintenanceBasic"
              type="number"
              defaultValue={system?.maintenanceLevels.basic}
              min="0"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Standard (Monthly Cost)</label>
            <input
              name="maintenanceStandard"
              type="number"
              defaultValue={system?.maintenanceLevels.standard}
              min="0"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Premium (Monthly Cost)</label>
            <input
              name="maintenancePremium"
              type="number"
              defaultValue={system?.maintenanceLevels.premium}
              min="0"
              className="w-full p-2 border rounded"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>FSR Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="fsrAvailable"
              defaultChecked={system?.fsrSupport.available}
            />
            <label>FSR Support Available</label>
          </div>

          {system?.fsrSupport.available && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Base Cost</label>
                <input
                  name="fsrMonthlyCost"
                  type="number"
                  defaultValue={system?.fsrSupport.monthlyCost}
                  min="0"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Weekly Multiplier</label>
                <input
                  name="fsrWeeklyMultiplier"
                  type="number"
                  defaultValue={system?.fsrSupport.weeklyMultiplier}
                  min="1"
                  step="0.1"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bi-weekly Multiplier</label>
                <input
                  name="fsrBiweeklyMultiplier"
                  type="number"
                  defaultValue={system?.fsrSupport.biweeklyMultiplier}
                  min="1"
                  step="0.1"
                  className="w-full p-2 border rounded"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Save System
        </button>
      </div>
    </form>
  );
} 