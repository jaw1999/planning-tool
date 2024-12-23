import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { System } from '@/app/lib/types/system';
import { Edit } from 'lucide-react';

interface SystemDetailsProps {
  system: System;
  onEdit?: () => void;
}

export function SystemDetails({ system, onEdit }: SystemDetailsProps) {
  const calculateFirstYearCost = (system: System) => {
    const baseCosts = system.basePrice;
    const annualLicensing = system.hasLicensing && system.licensePrice ? system.licensePrice * 12 : 0;
    const annualConsumables = system.consumablesRate * 12;
    const standardMaintenance = system.maintenanceLevels.standard * 12;
    return baseCosts + annualLicensing + annualConsumables + standardMaintenance;
  };

  const calculateMonthlyOperatingCost = (system: System) => {
    const monthlyLicensing = system.hasLicensing && system.licensePrice ? system.licensePrice : 0;
    const monthlyConsumables = system.consumablesRate;
    const standardMaintenance = system.maintenanceLevels.standard;
    return monthlyLicensing + monthlyConsumables + standardMaintenance;
  };

  const calculateFiveYearCost = (system: System) => {
    const firstYear = calculateFirstYearCost(system);
    const yearlyOperating = calculateMonthlyOperatingCost(system) * 12;
    return firstYear + (yearlyOperating * 4); // First year + 4 more years
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>System Details</CardTitle>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 hover:bg-muted rounded-full"
            >
              <Edit className="h-5 w-5" />
            </button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">{system.name}</h3>
            <p className="text-sm text-muted-foreground">{system.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Base Price</label>
              <div className="font-medium">${system.basePrice.toLocaleString()}</div>
            </div>
            {system.hasLicensing && (
              <div>
                <label className="text-sm text-muted-foreground">Monthly License</label>
                <div className="font-medium">${system.licensePrice?.toLocaleString()}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">First Year Total Cost</div>
              <div className="text-xl font-bold">
                ${calculateFirstYearCost(system).toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Monthly Operating Cost</div>
              <div className="text-xl font-bold">
                ${calculateMonthlyOperatingCost(system).toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">5-Year Total Cost</div>
              <div className="text-xl font-bold">
                ${calculateFiveYearCost(system).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">Basic</h4>
              <div className="text-lg font-bold mt-1">
                ${system.maintenanceLevels.basic.toLocaleString()}/mo
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-muted">
              <h4 className="font-medium">Standard</h4>
              <div className="text-lg font-bold mt-1">
                ${system.maintenanceLevels.standard.toLocaleString()}/mo
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">Premium</h4>
              <div className="text-lg font-bold mt-1">
                ${system.maintenanceLevels.premium.toLocaleString()}/mo
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FSR Support */}
      {system.fsrSupport.available && (
        <Card>
          <CardHeader>
            <CardTitle>Field Service Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Monthly</h4>
                <div className="text-lg font-bold mt-1">
                  ${system.fsrSupport.monthlyCost.toLocaleString()}/mo
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Bi-weekly</h4>
                <div className="text-lg font-bold mt-1">
                  ${(system.fsrSupport.monthlyCost * system.fsrSupport.biweeklyMultiplier).toLocaleString()}/mo
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Weekly</h4>
                <div className="text-lg font-bold mt-1">
                  ${(system.fsrSupport.monthlyCost * system.fsrSupport.weeklyMultiplier).toLocaleString()}/mo
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">Support Packages</h4>
              <div className="mt-2 space-y-2">
                <div>
                  <div className="text-sm">Technical Support</div>
                  <div className="font-medium">${system.technicalSupportCost.toLocaleString()}/year</div>
                </div>
                <div>
                  <div className="text-sm">Spare Parts Package</div>
                  <div className="font-medium">${system.sparePartsPackageCost.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div>{JSON.stringify(system.specifications, null, 2)}</div>
        </CardContent>
      </Card>
    </div>
  );
}