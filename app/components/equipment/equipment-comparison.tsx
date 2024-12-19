'use client';

import { useState, useEffect } from 'react';
import { Equipment } from '@/app/lib/types/equipment';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';

interface EquipmentComparisonProps {
  equipment: Equipment[];
}

export function EquipmentComparison({ equipment }: EquipmentComparisonProps) {
  const [leftEquipment, setLeftEquipment] = useState<Equipment | null>(null);
  const [rightEquipment, setRightEquipment] = useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [comparisonData, setComparisonData] = useState<Equipment[]>([]);

  const filteredEquipment = equipment.filter(item =>
    item.productInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.productInfo.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.productInfo.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchComparison = async () => {
      if (!leftEquipment || !rightEquipment) return;

      try {
        const response = await fetch(
          `/api/equipment/compare?ids=${leftEquipment.id},${rightEquipment.id}`
        );
        const data = await response.json();
        
        if (Array.isArray(data) && data.length === 2) {
          const transformedData = data.map(item => ({
            ...item,
            productInfo: item.productInfo || {},
            physicalSpecifications: item.physicalSpecifications || {},
            systemComponents: item.systemComponents || {},
            powerSpecifications: item.powerSpecifications || {},
            environmentalSpecifications: item.environmentalSpecifications || {},
            software: item.software || {},
            operations: item.operations || {},
            logistics: item.logistics || {},
            integration: item.integration || {}
          })) as Equipment[];
          
          setComparisonData(transformedData);
        }
      } catch (error) {
        console.error('Failed to fetch comparison:', error);
      }
    };

    fetchComparison();
  }, [leftEquipment, rightEquipment]);

  const formatValue = (value: any, path?: string[]): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    if (Array.isArray(value)) {
      return value.map(item => 
        typeof item === 'object' ? formatValue(item) : `• ${item}`
      ).join('\n');
    }
    
    if (typeof value === 'object') {
      if ('value' in value && 'unit' in value) {
        return `${value.value} ${value.unit}`;
      }
      
      return Object.entries(value)
        .filter(([_, val]) => val !== null && val !== undefined)
        .map(([key, val]) => {
          const cleanKey = key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .toLowerCase()
            .trim();
          
          return `${cleanKey}: ${formatValue(val)}`;
        })
        .join('\n');
    }
    
    return String(value).replace(/["\[\]{}]/g, '').trim();
  };

  const getNestedValue = (obj: any, path: string[]): any => {
    // Try direct path first
    let value = path.reduce((acc, key) => (acc ? acc[key] : undefined), obj);
    
    if (!value) {
      // Handle system components
      if (path.includes('systemComponents')) {
        const componentType = path[path.length - 1];
        const components = obj?.systemComponents?.[componentType];
        
        if (components) {
          if (typeof components === 'object') {
            return {
              Type: components.type,
              Components: components.components,
              Specifications: components.specifications
            };
          }
          return components;
        }
      }
      
      // Handle power specifications
      if (path.includes('powerSpecifications')) {
        const powerType = path[path.length - 1];
        return obj?.powerSpecifications?.[powerType] || 
               obj?.power?.[powerType];
      }
      
      // Handle operations data
      if (path.includes('operations')) {
        const category = path[1];
        const subcategory = path[2];
        return obj?.operations?.[category]?.[subcategory] ||
               obj?.[category]?.[subcategory];
      }
    }
    
    // Handle environmental specifications
    if (path.includes('environmentalSpecifications')) {
      const envType = path[path.length - 2];
      const envField = path[path.length - 1];
      
      if (envType === 'operationalAltitude') {
        return obj?.environmentalSpecifications?.operationalAltitude?.[envField] ||
               (envField === 'optimal' ? obj?.environmentalSpecifications?.altitude?.operating : 
                envField === 'maximum' ? obj?.environmentalSpecifications?.altitude?.maximum : undefined);
      }
      
      if (envField === 'operationalWindSpeed') {
        return obj?.environmentalSpecifications?.operationalWindSpeed ||
               obj?.environmentalSpecifications?.weather?.wind;
      }
    }
    
    return value;
  };

  const renderComparisonField = (label: string, path: string[]) => {
    if (!comparisonData || comparisonData.length < 2) return null;
    
    const leftValue = formatValue(getNestedValue(comparisonData[0], path), path);
    const rightValue = formatValue(getNestedValue(comparisonData[1], path), path);

    // Skip rendering if both values are N/A
    if (leftValue === 'N/A' && rightValue === 'N/A') return null;

    return (
      <div className="grid grid-cols-[200px_1fr] gap-4 py-4 border-b">
        <div className="font-medium">{label}</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm whitespace-pre-line">
            {leftValue}
          </div>
          <div className="text-sm whitespace-pre-line">
            {rightValue}
          </div>
        </div>
      </div>
    );
  };

  const renderComparisonSection = (title: string, fields: { label: string; path: string[] }[]) => (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      {fields.map(({ label, path }) => (
        <div key={`${title}-${label}`}>
          {renderComparisonField(label, path)}
        </div>
      ))}
    </div>
  );

  const shouldShowSection = (fields: { label: string; path: string[] }[], leftItem: any, rightItem: any): boolean => {
    // If either item doesn't exist, don't show the section
    if (!leftItem || !rightItem) return false;

    // Check each field in the section
    const hasValidComparison = fields.some(field => {
      const leftValue = formatValue(getNestedValue(leftItem, field.path), field.path);
      const rightValue = formatValue(getNestedValue(rightItem, field.path), field.path);
      
      // Only show fields where at least one value is not N/A
      return leftValue !== 'N/A' || rightValue !== 'N/A';
    });

    // Only show sections that have at least one valid comparison
    if (!hasValidComparison) return false;

    // Check if any values are different between the two items
    return fields.some(field => {
      const leftValue = formatValue(getNestedValue(leftItem, field.path), field.path);
      const rightValue = formatValue(getNestedValue(rightItem, field.path), field.path);
      
      // Show field if values are different and at least one is not N/A
      return (leftValue !== rightValue) && (leftValue !== 'N/A' || rightValue !== 'N/A');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="grid grid-cols-2 gap-4">
            {filteredEquipment.map((item) => (
              <Card 
                key={item.id}
                className="cursor-pointer hover:bg-accent"
                onClick={() => 
                  leftEquipment ? setRightEquipment(item) : setLeftEquipment(item)
                }
              >
                <CardContent className="p-4">
                  <h3 className="font-medium">{item.productInfo.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.productInfo.model}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{item.status}</Badge>
                    {item.productInfo.classification && (
                      <Badge variant="secondary">{item.productInfo.classification}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {leftEquipment && rightEquipment && (
        <Card>
          <CardHeader>
            <div className="grid grid-cols-[200px_1fr] gap-4">
              <div></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <CardTitle>{leftEquipment.productInfo.name}</CardTitle>
                  <Button 
                    variant="ghost" 
                    className="mt-2"
                    onClick={() => {
                      setLeftEquipment(null);
                      setComparisonData([]);
                    }}
                  >
                    Clear
                  </Button>
                </div>
                <div>
                  <CardTitle>{rightEquipment.productInfo.name}</CardTitle>
                  <Button 
                    variant="ghost" 
                    className="mt-2"
                    onClick={() => {
                      setRightEquipment(null);
                      setComparisonData([]);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {shouldShowSection([
              { label: 'Name', path: ['productInfo', 'name'] },
              { label: 'Model', path: ['productInfo', 'model'] },
              { label: 'Version', path: ['productInfo', 'version'] },
              { label: 'Type', path: ['productInfo', 'type'] },
              { label: 'Classification', path: ['productInfo', 'classification'] },
              { label: 'Status', path: ['status'] }
            ], comparisonData[0], comparisonData[1]) && renderComparisonSection('Product Information', [
              { label: 'Name', path: ['productInfo', 'name'] },
              { label: 'Model', path: ['productInfo', 'model'] },
              { label: 'Version', path: ['productInfo', 'version'] },
              { label: 'Type', path: ['productInfo', 'type'] },
              { label: 'Classification', path: ['productInfo', 'classification'] },
              { label: 'Status', path: ['status'] }
            ])}

            {shouldShowSection([
              { label: 'Weight', path: ['physicalSpecifications', 'weight'] },
              { label: 'Materials', path: ['physicalSpecifications', 'materials'] },
              { label: 'Dimensions', path: ['dimensions'] },
              { label: 'Power Input', path: ['powerSpecifications', 'input'] },
              { label: 'Power Consumption', path: ['powerSpecifications', 'consumption'] },
              { label: 'Power Management', path: ['powerSpecifications', 'management'] }
            ], comparisonData[0], comparisonData[1]) && renderComparisonSection('Physical & Power', [
              { label: 'Weight', path: ['physicalSpecifications', 'weight'] },
              { label: 'Materials', path: ['physicalSpecifications', 'materials'] },
              { label: 'Dimensions', path: ['dimensions'] },
              { label: 'Power Input', path: ['powerSpecifications', 'input'] },
              { label: 'Power Consumption', path: ['powerSpecifications', 'consumption'] },
              { label: 'Power Management', path: ['powerSpecifications', 'management'] }
            ])}

            {shouldShowSection([
              { label: 'Primary Components', path: ['systemComponents', 'primary'] },
              { label: 'Secondary Components', path: ['systemComponents', 'secondary'] },
              { label: 'Communications', path: ['systemComponents', 'communications'] }
            ], comparisonData[0], comparisonData[1]) && renderComparisonSection('System Components', [
              { label: 'Primary Components', path: ['systemComponents', 'primary'] },
              { label: 'Secondary Components', path: ['systemComponents', 'secondary'] },
              { label: 'Communications', path: ['systemComponents', 'communications'] }
            ])}

            {shouldShowSection([
              { label: 'Features', path: ['systemComponents', 'rfSpecifications', 'features'] },
              { label: 'Processing Capabilities', path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'signalProcessing', 'capabilities'] }
            ], comparisonData[0], comparisonData[1]) && renderComparisonSection('RF Features', [
              { label: 'Features', path: ['systemComponents', 'rfSpecifications', 'features'] },
              { label: 'Processing Capabilities', path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'signalProcessing', 'capabilities'] }
            ])}

            {shouldShowSection([
              { label: 'Frequency Ranges', path: ['systemComponents', 'rfSpecifications', 'frequencies', 'ranges'] },
              { label: 'Frequency Bands', path: ['systemComponents', 'rfSpecifications', 'frequencies', 'bands'] },
              { label: 'Detection Coverage', path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'frequencyCoverage', 'detection'] }
            ], comparisonData[0], comparisonData[1]) && renderComparisonSection('RF Frequencies', [
              { label: 'Frequency Ranges', path: ['systemComponents', 'rfSpecifications', 'frequencies', 'ranges'] },
              { label: 'Frequency Bands', path: ['systemComponents', 'rfSpecifications', 'frequencies', 'bands'] },
              { label: 'Detection Coverage', path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'frequencyCoverage', 'detection'] }
            ])}

            {shouldShowSection([
              { label: 'Transmit Power', path: ['systemComponents', 'rfSpecifications', 'power', 'tx'] },
              { label: 'Receive Power', path: ['systemComponents', 'rfSpecifications', 'power', 'rx'] },
              { label: 'Sensitivity Min', path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'sensitivity', 'min'] },
              { label: 'Sensitivity Max', path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'sensitivity', 'max'] }
            ], comparisonData[0], comparisonData[1]) && renderComparisonSection('RF Power & Sensitivity', [
              { label: 'Transmit Power', path: ['systemComponents', 'rfSpecifications', 'power', 'tx'] },
              { label: 'Receive Power', path: ['systemComponents', 'rfSpecifications', 'power', 'rx'] },
              { label: 'Sensitivity Min', path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'sensitivity', 'min'] },
              { label: 'Sensitivity Max', path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'sensitivity', 'max'] }
            ])}

            {shouldShowSection([
              { label: 'Operational Modes', path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'operationalModes'] },
              { label: 'Processing Modes', path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'signalProcessing', 'modes'] }
            ], comparisonData[0], comparisonData[1]) && renderComparisonSection('RF Modes', [
              { label: 'Operational Modes', path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'operationalModes'] },
              { label: 'Processing Modes', path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'signalProcessing', 'modes'] }
            ])}

            {shouldShowSection([
              { label: 'Control System', path: ['software', 'control'] },
              { label: 'Planning Tools', path: ['software', 'planning'] },
              { label: 'Analysis Tools', path: ['software', 'analysis'] },
              { label: 'Licensing', path: ['software', 'licensing'] }
            ], comparisonData[0], comparisonData[1]) && renderComparisonSection('Software & Control', [
              { label: 'Control System', path: ['software', 'control'] },
              { label: 'Planning Tools', path: ['software', 'planning'] },
              { label: 'Analysis Tools', path: ['software', 'analysis'] },
              { label: 'Licensing', path: ['software', 'licensing'] }
            ])}

            {shouldShowSection([
              { label: 'Deployment Methods', path: ['operations', 'deployment', 'methods'] },
              { label: 'Deployment Requirements', path: ['operations', 'deployment', 'requirements'] },
              { label: 'Deployment Limitations', path: ['operations', 'deployment', 'limitations'] },
              { label: 'Required Training', path: ['operations', 'training', 'required'] },
              { label: 'Optional Training', path: ['operations', 'training', 'optional'] },
              { label: 'Maintenance Schedule', path: ['operations', 'maintenance', 'scheduled'] },
              { label: 'FSR Frequency', path: ['fsrFrequency'] }
            ], comparisonData[0], comparisonData[1]) && renderComparisonSection('Operations', [
              { label: 'Deployment Methods', path: ['operations', 'deployment', 'methods'] },
              { label: 'Deployment Requirements', path: ['operations', 'deployment', 'requirements'] },
              { label: 'Deployment Limitations', path: ['operations', 'deployment', 'limitations'] },
              { label: 'Required Training', path: ['operations', 'training', 'required'] },
              { label: 'Optional Training', path: ['operations', 'training', 'optional'] },
              { label: 'Maintenance Schedule', path: ['operations', 'maintenance', 'scheduled'] },
              { label: 'FSR Frequency', path: ['fsrFrequency'] }
            ])}

            {shouldShowSection([
              { label: 'Acquisition Cost', path: ['acquisitionCost'] },
              { label: 'FSR Support Cost', path: ['fsrSupportCost'] },
              { label: 'Lead Time', path: ['logistics', 'procurement', 'leadTime'] },
              { label: 'Shipping Requirements', path: ['logistics', 'shipping', 'requirements'] },
              { label: 'Shipping Methods', path: ['logistics', 'shipping', 'methods'] }
            ], comparisonData[0], comparisonData[1]) && renderComparisonSection('Costs & Logistics', [
              { label: 'Acquisition Cost', path: ['acquisitionCost'] },
              { label: 'FSR Support Cost', path: ['fsrSupportCost'] },
              { label: 'Lead Time', path: ['logistics', 'procurement', 'leadTime'] },
              { label: 'Shipping Requirements', path: ['logistics', 'shipping', 'requirements'] },
              { label: 'Shipping Methods', path: ['logistics', 'shipping', 'methods'] }
            ])}

            {shouldShowSection([
              { label: 'Refurbishment Options', path: ['logistics', 'refurbishment', 'options'] },
              { label: 'Refurbishment Requirements', path: ['logistics', 'refurbishment', 'requirements'] },
              { label: 'Refurbishment Pricing', path: ['logistics', 'refurbishment', 'pricing'] },
              { label: 'Required Spares', path: ['logistics', 'spares', 'required'] },
              { label: 'Recommended Spares', path: ['logistics', 'spares', 'recommended'] }
            ], comparisonData[0], comparisonData[1]) && renderComparisonSection('Refurbishment & Spares', [
              { label: 'Refurbishment Options', path: ['logistics', 'refurbishment', 'options'] },
              { label: 'Refurbishment Requirements', path: ['logistics', 'refurbishment', 'requirements'] },
              { label: 'Refurbishment Pricing', path: ['logistics', 'refurbishment', 'pricing'] },
              { label: 'Required Spares', path: ['logistics', 'spares', 'required'] },
              { label: 'Recommended Spares', path: ['logistics', 'spares', 'recommended'] }
            ])}

            {shouldShowSection([
              { label: 'Operating Temperature', path: ['environmentalSpecifications', 'temperature', 'operating'] },
              { label: 'Storage Temperature', path: ['environmentalSpecifications', 'temperature', 'storage'] },
              { label: 'Optimal Altitude', path: ['environmentalSpecifications', 'operationalAltitude', 'optimal'] },
              { label: 'Maximum Altitude', path: ['environmentalSpecifications', 'operationalAltitude', 'maximum'] },
              { label: 'Extended Altitude', path: ['environmentalSpecifications', 'operationalAltitude', 'extended'] },
              { label: 'Wind Limitations', path: ['environmentalSpecifications', 'operationalWindSpeed'] },
              { label: 'Flight Duration', path: ['environmentalSpecifications', 'flightDuration'] },
              { label: 'Environmental Certifications', path: ['environmentalSpecifications', 'certifications', 'environmental'] }
            ], comparisonData[0], comparisonData[1]) && renderComparisonSection('Environmental', [
              { label: 'Operating Temperature', path: ['environmentalSpecifications', 'temperature', 'operating'] },
              { label: 'Storage Temperature', path: ['environmentalSpecifications', 'temperature', 'storage'] },
              { label: 'Optimal Altitude', path: ['environmentalSpecifications', 'operationalAltitude', 'optimal'] },
              { label: 'Maximum Altitude', path: ['environmentalSpecifications', 'operationalAltitude', 'maximum'] },
              { label: 'Extended Altitude', path: ['environmentalSpecifications', 'operationalAltitude', 'extended'] },
              { label: 'Wind Limitations', path: ['environmentalSpecifications', 'operationalWindSpeed'] },
              { label: 'Flight Duration', path: ['environmentalSpecifications', 'flightDuration'] },
              { label: 'Environmental Certifications', path: ['environmentalSpecifications', 'certifications', 'environmental'] }
            ])}

            {shouldShowSection([
              { label: 'Location', path: ['location'] },
              { label: 'Serial Number', path: ['serialNumber'] },
              { label: 'Asset Tag', path: ['assetTag'] }
            ], comparisonData[0], comparisonData[1]) && renderComparisonSection('Location & Tracking', [
              { label: 'Location', path: ['location'] },
              { label: 'Serial Number', path: ['serialNumber'] },
              { label: 'Asset Tag', path: ['assetTag'] }
            ])}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 