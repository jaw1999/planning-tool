export interface SystemBreakdown {
  systemName: string;
  amount: number;
  percentage: number;
}

export interface MonthlyBreakdown {
  month: string;
  amount: number;
  change: number;
}

export interface CostBreakdown {
  name: string;
  value: number;
  percentageOfTotal: number;
  monthlyAverage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  breakdown: {
    bySystem: SystemBreakdown[];
    byMonth: MonthlyBreakdown[];
  };
}

export interface SystemUsage {
  name: string;
  exercises: number;
  totalCost: number;
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
  activeExercises: number;
  pendingApproval: number;
  systemsInUse: number;
  utilization: number;
  monthlyAverage: number;
  monthlyChange: number;
  yearlyChange: number;
  monthlyCosts: MonthlyCost[];
  systemUsage: SystemUsage[];
  costBreakdown: CostBreakdown[];
} 