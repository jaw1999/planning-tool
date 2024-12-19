import { FSRType } from './system';
import { ConsumablePreset } from './system';
import { Consumable } from './system';

export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED'
}

export enum FSRFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUAL = 'SEMIANNUAL',
  ANNUAL = 'ANNUAL',
  AS_NEEDED = 'AS_NEEDED'
}

export type Classification = 'UNCLASSIFIED' | 'UNCLASSIFIED//FOUO' | 'CONFIDENTIAL' | 'SECRET' | 'TOP SECRET';

export interface Dimensions {
  height: string;
  width: string;
  length: string;
  unit?: string;
}

export interface Weight {
  baseUnit: string;
  withAddons?: Record<string, string>;
  payload?: {
    capacity: string;
    configurations: string[];
  };
  shipping?: string;
  unit: string;
}

export interface RFSpecifications {
  frequencies: {
    ranges: string[];
    bands: string[];
  };
  power: {
    tx: Record<string, any>;
    rx: Record<string, any>;
  };
  features: string[];
  
  // New EW-specific fields
  ewCapabilities?: {
    operationalModes: string[];
    frequencyCoverage: {
      detection: string[];
      jamming?: string[];
    };
    signalProcessing: {
      capabilities: string[];
      modes: string[];
    };
    antenna?: {
      type: string;
      gain: string;
      coverage: string;
    };
    sensitivity?: {
      min: string;
      max: string;
      unit: string;
    };
  };
}

interface MaintenanceRecord {
  date: Date;
  type: string;
  description: string;
  technician: string;
  cost: number;
  notes?: string;
}

export interface FSRRequirements {
  staffing?: string;
  specializations?: string[];
  certifications?: string[];
  tools?: string[];
}

interface Attachment {
  name: string;
  type: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

interface EnvironmentalSpecifications {
  temperature?: {
    operating: Record<string, any>;
    storage: Record<string, any>;
  };
  altitude?: {
    operating: string;
    maximum: string;
    restrictions: string[];
  };
  weather?: {
    wind: Record<string, any>;
    precipitation: Record<string, any>;
    restrictions: string[];
  };
  certifications?: {
    environmental: string[];
    safety: string[];
    compliance: string[];
  };
  operationalAltitude?: {
    optimal: string;
    maximum: string;
    extended: string;
  };
  operationalWindSpeed?: string;
  flightDuration?: string;
}

export interface Equipment {
  id: string;
  productInfo: {
    name: string;
    model: string;
    version: string;
    classification: Classification;
    type: string;
    description: string;
    status: string;
    partNumber: string;
    configuration: {
      type: string;
      variants: string[];
      specifications: Record<string, any>;
    };
    useRestrictions: {
      disclosure: string;
      export: string;
      handling: string;
    };
  };
  physicalSpecifications: {
    dimensions: {
      baseUnit: Dimensions;
      deployed?: Dimensions;
      shipping?: Dimensions;
    };
    weight: Weight;
    materials: {
      primary: string;
      special: string[];
      treatments: string[];
    };
  };
  systemComponents: {
    primary: {
      type: string;
      components: string[];
      specifications: Record<string, any>;
    };
    avionics?: {
      navigation: string[];
      control: string[];
      termination: string[];
      optional: string[];
    };
    communications: {
      primary: {
        type: string;
        specifications: Record<string, any>;
      };
      backup: string[];
      protocols: string[];
    };
    tracking?: {
      primary: Record<string, any>;
      backup: Record<string, any>;
      features: string[];
    };
    rfSpecifications?: RFSpecifications;
  };
  interfaces: {
    mechanical: {
      connections: string[];
      mounts: string[];
      payload: string[];
    };
    electrical: {
      power: Record<string, any>;
      signals: Record<string, any>;
      connectors: string[];
    };
    data: {
      types: string[];
      protocols: string[];
      ports: string[];
    };
    control: {
      methods: string[];
      interfaces: string[];
    };
  };
  powerSpecifications: {
    input: {
      requirements: Record<string, any>;
      options: string[];
    };
    consumption: {
      nominal: Record<string, any>;
      peak: string;
      byMode: Record<string, any>;
    };
    management: {
      features: string[];
      efficiency: Record<string, any>;
    };
  };
  environmentalSpecifications: EnvironmentalSpecifications;
  software?: {
    features: string[];
    gui: {
      capabilities: string[];
    };
    control: {
      primary: string;
      interfaces: string[];
      features: string[];
    };
    planning: {
      tools: string[];
      capabilities: string[];
    };
    analysis: {
      realtime: string[];
      postMission: string[];
    };
    licensing: {
      type: string;
      terms: Record<string, any>;
      restrictions: string[];
    };
  };
  operations: {
    deployment: {
      methods: string[];
      requirements: string[];
      limitations: string[];
    };
    training: {
      required: Record<string, any>;
      optional: Record<string, any>;
      certification: string[];
    };
    maintenance: {
      scheduled: string[];
      unscheduled: string[];
      requirements: string[];
    };
    support: {
      staffing?: string;
      specializations?: string[];
      tools?: string[];
      onsite?: Record<string, any>;
      remote?: Record<string, any>;
      documentation?: string[];
    };
  };
  logistics: {
    procurement: {
      leadTime: Record<string, any>;
      pricing: Record<string, any>;
      terms: Record<string, any>;
    };
    shipping: {
      methods: string[];
      restrictions: string[];
      requirements: string[];
    };
    refurbishment: {
      options: string[];
      requirements: string[];
      pricing: Record<string, any>;
    };
    spares: {
      required: string[];
      recommended: string[];
      availability: Record<string, any>;
    };
  };
  integration: {
    platforms: {
      compatible: string[];
      restricted: string[];
      requirements: string[];
    };
    payloads: {
      compatible: string[];
      restrictions: string[];
      interfaces: string[];
    };
    infrastructure: {
      required: string[];
      optional: string[];
      specifications: Record<string, any>;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  status: EquipmentStatus;
  
  // Costs
  acquisitionCost?: number;
  fsrSupportCost?: number;
  
  // Technical Specifications
  specifications?: Record<string, any>;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  weight?: {
    value?: number;
    unit?: string;
  };
  powerRequirements?: {
    voltage?: number;
    amperage?: number;
    frequency?: string;
  };
  
  // FSR Support Details
  fsrRequirements?: FSRRequirements;
  fsrFrequency: FSRFrequency;
  
  // Maintenance
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  maintenanceHistory?: any[];
  
  // Documentation
  manuals?: any[];
  certifications?: string[];
  safetyProtocols?: string[];
  
  // Location and Tracking
  location?: string;
  serialNumber?: string;
  assetTag?: string;
  
  // Additional Info
  notes?: string;
  attachments?: any[];
  customFields?: Record<string, any>;
  
  // Metadata
  createdBy?: string;
  updatedBy?: string;
  
  // Relations
  relatedSystems?: Array<{
    id: string;
    name: string;
  }>;
  consumablePresets?: ConsumablePreset[];
  consumables?: Consumable[];
} 