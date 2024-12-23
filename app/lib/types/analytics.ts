export interface SystemBreakdown {
  systemName: string;
  amount: number;
  percentage: number;
}

export interface MonthlyBreakdown {
  month: Date;
  totalCost: number;
  exerciseCount: number;
  systemCount: number;
}

export interface CostBreakdown {
  system: string;
  name: string;
  hardware: number;
  fsr: number;
  consumables: number;
  total: number;
  value: number;
  count: number;
  monthlyAverage: number;
  percentageOfTotal: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  breakdown: {
    byMonth: Array<{
      month: string;
      amount: number;
    }>;
    bySystem: Array<{
      systemName: string;
      amount: number;
      percentage: number;
    }>;
  };
}

export interface SystemUsage {
  name: string;
  exercises: number;
  totalCost: number;
  totalDuration: number;
}

export interface MonthlyCost {
  month: string;
  hardware: number;
  software: number;
  fsr: number;
  consumables: number;
  shipping: number;
  refurbishment: number;
  spares: number;
  training: number;
  maintenance: number;
}

export interface AnalyticsData {
  totalSpending: number;
  yearlyChange: number;
  monthlyAverage: number;
  monthlyChange: number;
  activeExercises: number;
  pendingApproval: number;
  systemsInUse: number;
  utilization: number;
  monthlyCosts: MonthlyCost[];
  costBreakdown: CostBreakdown[];
  systemUsage: SystemUsage[];
} 