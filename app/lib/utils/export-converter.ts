import Papa from 'papaparse';
import type { System } from '@prisma/client';

export function convertToCSV(systems: System[]): string {
  const flattenedSystems = systems.map(system => ({
    id: system.id,
    name: system.name,
    description: system.description,
    basePrice: system.basePrice,
    hasLicensing: system.hasLicensing,
    licensePrice: system.licensePrice,
    leadTime: system.leadTime,
    specifications: JSON.stringify(system.specifications),
    consumablesRate: system.consumablesRate,
    createdAt: system.createdAt,
    updatedAt: system.updatedAt
  }));

  return Papa.unparse(flattenedSystems);
} 