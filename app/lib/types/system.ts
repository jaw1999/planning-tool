// app/lib/types/system.ts

// Enum Types
export type FSRType = 'NONE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
export type ExerciseStatus = 'PLANNING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type CostType = 'ONE_TIME' | 'RECURRING' | 'CONSUMABLE' | 'LICENSE' | 'FSR' | 'OTHER';
export type SystemStatus = 'AVAILABLE' | 'MAINTENANCE' | 'DEPLOYED' | 'RETIRED';

// Base Interfaces
export interface SystemSpecifications {
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  weight: {
    base: number;
    loaded: number;
    unit: string;
  };
  power: {
    voltage: number;
    amperage: number;
    frequency: number;
  };
  environmental: {
    temperature: {
      min: number;
      max: number;
      unit: string;
    };
    humidity: {
      min: number;
      max: number;
      unit: string;
    };
  };
  customFields: Record<string, string>;
}

export interface SystemOperations {
  deployment: {
    methods: string[];
    requirements: string[];
    limitations: string[];
  };
  training: {
    required: {
      days: number;
      costPerDay: number;
      prerequisites: string[];
    };
    certification: string[];
  };
  maintenance: {
    scheduled: string[];
    requirements: string[];
  };
  support: {
    onsite: {
      available: boolean;
      staffing: string;
      specializations: string[];
      certifications: string[];
      tools: string[];
    };
    remote: {
      available: boolean;
      methods: string[];
      response?: {
        time: number;
        unit: string;
      };
      annualCost: number;
    };
  };
}

export interface System {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  hasLicensing: boolean;
  licensePrice?: number;
  leadTime: number;
  consumablesRate: number;
  status: SystemStatus;
  location?: string;
  serialNumber?: string;
  assetTag?: string;
  maintenanceLevels: {
    basic: number;
    standard: number;
    premium: number;
  };
  technicalSupportCost: number;
  sparePartsPackageCost: number;
  fsrSupport: {
    available: boolean;
    monthlyCost: number;
    weeklyMultiplier: number;
    biweeklyMultiplier: number;
  };
  specifications: {
    dimensions: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
    weight: {
      base: number;
      loaded: number;
      unit: string;
    };
    power: {
      voltage: number;
      amperage: number;
      frequency: number;
    };
    environmental: {
      temperature: {
        min: number;
        max: number;
        unit: string;
      };
      humidity: {
        min: number;
        max: number;
        unit: string;
      };
    };
    customFields?: Record<string, string>;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  status: ExerciseStatus;
  totalBudget?: number;
  launchesPerDay?: number;
  systems?: ExerciseSystem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseSystem {
  id: string;
  exerciseId: string;
  systemId: string;
  quantity: number;
  fsrSupport: FSRType;
  fsrCost: number;
  launchesPerDay?: number;
  consumablePresets: ExerciseConsumablePreset[];
  createdAt: Date;
  updatedAt: Date;
  system?: System;
  exercise?: Exercise;
}

export interface ExerciseConsumablePreset {
  id: string;
  exerciseSystemId: string;
  presetId: string;
  quantity: number;
  preset: ConsumablePreset;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsumablePreset {
  id: string;
  name: string;
  description?: string;
  consumableId: string;
  consumable: Consumable;
  quantity: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Consumable {
  id: string;
  name: string;
  description?: string;
  unit: string;
  currentUnitCost: number;
  category?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostRecord {
  id: string;
  exerciseId?: string;
  systemId?: string;
  type: CostType;
  amount: number;
  date: Date;
  description?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  system?: System;
  exercise?: Exercise;
}

// Extended Interfaces
export interface SystemWithCosts extends System {
  totalCost: number;
  monthlyCosts: {
    licensing?: number;
    consumables?: number;
    fsr?: number;
  };
}

// Form Data Interfaces
export interface ExerciseSystemFormData {
  systemId: string;
  quantity: number;
  fsrSupport: FSRType;
  fsrCost?: number;
  launchesPerDay?: number;
  consumablePresets?: {
    presetId: string;
    quantity: number;
  }[];
}

export interface ExerciseFormData {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  status: ExerciseStatus;
  totalBudget?: number;
  launchesPerDay?: number;
  systems: ExerciseSystemFormData[];
}

// API Operation Types
export type ExerciseUpdateData = {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  status?: ExerciseStatus;
  totalBudget?: number;
  requirements?: Record<string, any>;
  systems: {
    systemId: string;
    quantity: number;
    fsrSupport: FSRType;
    fsrCost?: number;
    consumablesCost: number;
  }[];
};

// Hook Types
export interface SingleExerciseHook {
  type: 'single';
  exercise: Exercise | null;
  isLoading: boolean;
  error: string | null;
  updateExerciseStatus: (id: string, status: ExerciseStatus) => Promise<void>;
  updateExercise: (id: string, exerciseData: ExerciseUpdateData) => Promise<void>;
}

export interface ExerciseListHook {
  type: 'list';
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;
  createExercise: (exerciseData: ExerciseFormData) => Promise<Exercise>;
  refetch: () => Promise<void>;
}

// Type Guards
export function isSingleExerciseHook(hook: SingleExerciseHook | ExerciseListHook): hook is SingleExerciseHook {
  return hook.type === 'single';
}

export function isExerciseListHook(hook: SingleExerciseHook | ExerciseListHook): hook is ExerciseListHook {
  return hook.type === 'list';
}

// Add this with the other interfaces
export interface CalculatedResults {
  totalCost: number;
  monthlyRecurring: number;
  oneTimeCosts: number;
  systemCosts: Array<{
    systemName: string;
    baseHardwareCost: number;
    fsrCost: number;
    consumablesCost: number;
    totalMonthlyRecurring: number;
    totalForDuration: number;
    duration: number;
  }>;
  additionalCosts: Array<{
    description: string;
    amount: number;
    isRecurring: boolean;
    totalForDuration: number;
  }>;
}

export interface SystemWithPresets extends System {
  consumablePresets: ConsumablePreset[];
}