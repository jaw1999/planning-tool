import { ExerciseStatus, FSRType } from '@prisma/client';

export interface ExerciseFormData {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  status: ExerciseStatus;
  totalBudget: number;
  launchesPerDay: number;
  systems: Array<{
    systemId: string;
    quantity: number;
    fsrSupport: FSRType;
    fsrCost: number;
    consumablesCost: number;
    launchesPerDay?: number;
    consumablePresets: Array<{
      id: string;
      exerciseSystemId: string;
      presetId: string;
      quantity: number;
      preset: {
        id: string;
        name: string;
        consumableId: string;
      };
    }>;
  }>;
} 