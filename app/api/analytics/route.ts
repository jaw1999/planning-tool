import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AnalyticsData, CostBreakdown, SystemBreakdown, MonthlyBreakdown } from '@/app/lib/types/analytics';
import { calculateSystemCosts } from '@/app/lib/utils/cost';
import { getDurationInMonths } from '@/app/lib/utils/date';
import { System, ConsumablePreset, ExerciseStatus } from '@/app/lib/types/system';
import { ExerciseSystem } from '@/app/lib/types/system';
import { isBalloonGas } from '@/app/lib/utils/consumables';

type CostType = 
  | 'ONE_TIME'
  | 'LICENSE'
  | 'FSR'
  | 'CONSUMABLE'
  | 'SHIPPING'
  | 'REFURBISHMENT'
  | 'SPARES'
  | 'TRAINING'
  | 'MAINTENANCE'
  | 'RECURRING'
  | 'OTHER';
type FSRType = 'NONE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

interface MonthlyGroup {
  total: number;
  date: Date;
}

interface CostRecord {
  date: Date;
  amount: number;
  type: CostType;
}

interface ExerciseWithSystems {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  status: ExerciseStatus;
  totalBudget?: number;
  systems: Array<{
    id: string;
    system: {
      id: string;
      name: string;
      basePrice: number;
    };
    quantity: number;
    fsrSupport: FSRType;
    fsrCost: number | null;
    consumablePresets: Array<{
      id: string;
      quantity: number;
      preset: ConsumablePreset;
    }>;
    launchesPerDay?: number;
  }>;
}

function calculateTotalSpending(records: CostRecord[]): number {
  return records.reduce((total, record) => total + record.amount, 0);
}

function calculateMonthlyChange(costRecords: CostRecord[]): number {
  const monthlyGroups = groupCostsByMonth(costRecords);
  if (monthlyGroups.length < 2) return 0;
  
  const [previous, current] = monthlyGroups.slice(-2);
  return previous.total > 0 ? ((current.total - previous.total) / previous.total) * 100 : 0;
}

function groupCostsByMonth(records: CostRecord[]): MonthlyGroup[] {
  const groups = new Map<string, MonthlyGroup>();
  
  records.forEach(record => {
    const key = `${record.date.getFullYear()}-${record.date.getMonth()}`;
    const current = groups.get(key) || { total: 0, date: record.date };
    current.total += record.amount;
    groups.set(key, current);
  });
  
  return Array.from(groups.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

interface MonthlyCost {
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
  total: number;
}

function calculateMonthlyCosts(exercises: ExerciseWithSystems[]): MonthlyCost[] {
  const monthlyData = new Map<string, MonthlyCost>();

  exercises.forEach(exercise => {
    const startDate = new Date(exercise.startDate);
    const endDate = new Date(exercise.endDate);
    const months = getMonthsBetweenDates(startDate, endDate);
    const startKey = startDate.toISOString().slice(0, 7);

    // Add hardware costs only to the starting month
    exercise.systems.forEach(sys => {
      if (!sys.system) return;
      const baseHardware = (sys.system.basePrice || 0) * (sys.quantity || 1);
      const existing = monthlyData.get(startKey) || createEmptyMonthlyCost(startKey);
      monthlyData.set(startKey, {
        ...existing,
        hardware: existing.hardware + baseHardware,
        total: existing.total + baseHardware
      });
    });

    // Add recurring costs to each month
    months.forEach(month => {
      const monthKey = month.toISOString().slice(0, 7);
      const existing = monthlyData.get(monthKey) || createEmptyMonthlyCost(monthKey);

      exercise.systems.forEach(sys => {
        if (!sys.system) return;
        const monthlyFSR = sys.fsrSupport !== 'NONE' ? (sys.fsrCost || 0) : 0;
        const monthlyConsumables = calculateMonthlyConsumables(sys);

        monthlyData.set(monthKey, {
          ...existing,
          fsr: existing.fsr + monthlyFSR,
          consumables: existing.consumables + monthlyConsumables,
          total: existing.total + monthlyFSR + monthlyConsumables
        });
      });
    });
  });

  // Ensure we have a continuous series of months with no gaps
  const sortedData = Array.from(monthlyData.entries())
    .sort(([a], [b]) => a.localeCompare(b));
  
  if (sortedData.length > 1) {
    const firstMonth = new Date(sortedData[0][0]);
    const lastMonth = new Date(sortedData[sortedData.length - 1][0]);
    const allMonths = getMonthsBetweenDates(firstMonth, lastMonth);
    
    allMonths.forEach(month => {
      const monthKey = month.toISOString().slice(0, 7);
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, createEmptyMonthlyCost(monthKey));
      }
    });
  }

  return Array.from(monthlyData.values())
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
}

function createEmptyMonthlyCost(monthKey: string): MonthlyCost {
  return {
    month: formatMonthLabel(monthKey),
    hardware: 0,
    software: 0,
    fsr: 0,
    consumables: 0,
    shipping: 0,
    refurbishment: 0,
    spares: 0,
    training: 0,
    maintenance: 0,
    total: 0
  };
}

interface SystemUsage {
  name: string;
  exercises: number;
  totalCost: number;
  totalDuration: number;
}

function calculateSystemUsage(exercises: ExerciseWithSystems[]): SystemUsage[] {
  const systemUsage = new Map<string, SystemUsage>();
  
  exercises.forEach(exercise => {
    exercise.systems.forEach(sys => {
      const current = systemUsage.get(sys.system.id) || {
        name: sys.system.name,
        exercises: 0,
        totalCost: 0,
        totalDuration: 0
      };
      
      const duration = getDurationInMonths(
        new Date(exercise.startDate), 
        new Date(exercise.endDate)
      );
      
      current.exercises++;
      current.totalCost += calculateSystemTotalCost(sys, new Date(exercise.startDate), new Date(exercise.endDate));
      current.totalDuration += Number(duration);
      systemUsage.set(sys.system.id, current);
    });
  });
  
  return Array.from(systemUsage.values());
}

function calculateSystemTotalCost(sys: ExerciseWithSystems['systems'][0], startDate: Date, endDate: Date): number {
  const duration = getDurationInMonths(startDate, endDate);
  const baseHardwareCost = (sys.system.basePrice || 0) * sys.quantity;
  const monthlyFSRCost = sys.fsrSupport !== 'NONE' ? (sys.fsrCost || 0) : 0;
  
  const monthlyConsumablesCost = sys.consumablePresets?.reduce((total: number, preset) => {
    let quantity = preset.quantity;
    if (isBalloonGas(preset.preset.consumable?.name)) {
      quantity = quantity * (sys.launchesPerDay || 1) * 30;
    }
    return total + ((preset.preset.consumable?.currentUnitCost || 0) * quantity);
  }, 0) || 0;

  const totalMonthlyRecurring = monthlyFSRCost + monthlyConsumablesCost;
  return baseHardwareCost + (totalMonthlyRecurring * duration);
}

function getMonthsBetweenDates(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  const current = new Date(start);
  current.setDate(1); // Normalize to first of month

  while (current <= end) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

function formatMonthLabel(monthStr: string): string {
  return new Date(monthStr + '-01').toLocaleString('en-US', { month: 'short', year: '2-digit' });
}

function sumCostsByType(records: CostRecord[], type: CostType): number {
  return records
    .filter(r => r.type === type)
    .reduce((sum, r) => sum + r.amount, 0);
}

function getStartDateFromRange(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case '1m':
      return new Date(now.setMonth(now.getMonth() - 1));
    case '3m':
      return new Date(now.setMonth(now.getMonth() - 3));
    case '6m':
      return new Date(now.setMonth(now.getMonth() - 6));
    case '1y':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case 'all':
      return new Date(0); // Beginning of time
    default:
      return new Date(now.setFullYear(now.getFullYear() - 1));
  }
}

function calculateUtilization(exercises: ExerciseWithSystems[]): number {
  const activeExercises = exercises.filter(e => e.status === 'IN_PROGRESS');
  if (activeExercises.length === 0) return 0;
  
  const totalSystemDays = activeExercises.reduce((total, exercise) => {
    const duration = Math.ceil((exercise.endDate.getTime() - exercise.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return total + (exercise.systems.length * duration);
  }, 0);
  
  const maxPossibleDays = exercises.length * 365; // Assuming max 1 year per exercise
  return (totalSystemDays / maxPossibleDays) * 100;
}

function calculateYearlyChange(costRecords: CostRecord[]): number {
  const thisYear = costRecords.filter(r => 
    r.date.getFullYear() === new Date().getFullYear()
  );
  
  const lastYear = costRecords.filter(r => 
    r.date.getFullYear() === new Date().getFullYear() - 1
  );
  
  const thisYearTotal = calculateTotalSpending(thisYear);
  const lastYearTotal = calculateTotalSpending(lastYear);
  
  return lastYearTotal > 0 ? ((thisYearTotal - lastYearTotal) / lastYearTotal) * 100 : 0;
}

function calculateMonthlyBreakdown(exercises: ExerciseWithSystems[]): MonthlyBreakdown[] {
  const monthlyData = new Map<string, MonthlyBreakdown>();
  
  exercises.forEach(exercise => {
    const startDate = new Date(exercise.startDate);
    const endDate = new Date(exercise.endDate);
    const months = getMonthsBetweenDates(startDate, endDate);
    
    months.forEach(month => {
      const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
      const current = monthlyData.get(monthKey) || {
        month: new Date(month),
        totalCost: 0,
        exerciseCount: 0,
        systemCount: 0
      };

      exercise.systems.forEach(sys => {
        if (!sys.system) return;
        
        const monthlyFSRCost = sys.fsrSupport !== 'NONE' ? (sys.fsrCost || 0) : 0;
        const monthlyConsumablesCost = calculateMonthlyConsumables(sys);
        const baseHardwareCostPerMonth = ((sys.system.basePrice || 0) * sys.quantity) / months.length;
        
        current.totalCost += baseHardwareCostPerMonth + monthlyFSRCost + monthlyConsumablesCost;
        current.systemCount = exercise.systems.length;
      });
      
      current.exerciseCount++;
      monthlyData.set(monthKey, current);
    });
  });
  
  return Array.from(monthlyData.values())
    .sort((a, b) => a.month.getTime() - b.month.getTime());
}

function calculateCostBreakdown(exercises: ExerciseWithSystems[]): CostBreakdown[] {
  const breakdown: CostBreakdown[] = [];

  exercises.forEach(exercise => {
    const durationInMonths = getDurationInMonths(
      new Date(exercise.startDate),
      new Date(exercise.endDate)
    );

    exercise.systems.forEach(sys => {
      if (!sys.system) return;

      const baseHardware = (sys.system.basePrice || 0) * (sys.quantity || 1);
      const monthlyFSR = sys.fsrSupport !== 'NONE' ? (sys.fsrCost || 0) : 0;
      const monthlyConsumables = calculateMonthlyConsumables(sys);
      const totalMonthly = monthlyFSR + monthlyConsumables;
      const total = baseHardware + (totalMonthly * durationInMonths);

      const existingBreakdown = breakdown.find(b => b.system === sys.system.name);
      
      if (existingBreakdown) {
        existingBreakdown.hardware += baseHardware;
        existingBreakdown.fsr += monthlyFSR * durationInMonths;
        existingBreakdown.consumables += monthlyConsumables * durationInMonths;
        existingBreakdown.total += total;
        existingBreakdown.count += 1;
        existingBreakdown.monthlyAverage = existingBreakdown.total / existingBreakdown.count;
      } else {
        breakdown.push({
          system: sys.system.name,
          name: sys.system.name,
          hardware: baseHardware,
          fsr: monthlyFSR * durationInMonths,
          consumables: monthlyConsumables * durationInMonths,
          total,
          value: total,
          count: 1,
          monthlyAverage: total,
          percentageOfTotal: 0, // Will be calculated after all systems are processed
          trend: 'stable',
          breakdown: {
            byMonth: [], // Will be populated later
            bySystem: [] // Will be populated later
          }
        });
      }
    });
  });

  // Calculate percentages and trends
  const totalCost = breakdown.reduce((sum, b) => sum + b.total, 0);
  breakdown.forEach(b => {
    b.percentageOfTotal = (b.total / totalCost) * 100;
  });

  return breakdown;
}

function calculateMonthlyConsumables(sys: ExerciseWithSystems['systems'][0]): number {
  if (!sys.consumablePresets || sys.consumablePresets.length === 0) {
    return 0;
  }

  return sys.consumablePresets.reduce((total, preset) => {
    if (!preset.preset?.consumable) return total;
    
    let quantity = preset.quantity || 0;
    const unitCost = preset.preset.consumable.currentUnitCost || 0;
    
    if (isBalloonGas(preset.preset.consumable.name)) {
      quantity = sys.launchesPerDay ? quantity * sys.launchesPerDay * 30 : 0;
    }
    
    return total + (unitCost * quantity);
  }, 0);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '1y';
    const startDate = getStartDateFromRange(timeRange);

    const exercises = await prisma.exercise.findMany({
      include: {
        systems: {
          include: {
            system: true,
            consumablePresets: {
              include: {
                preset: {
                  include: {
                    consumable: true
                  }
                }
              }
            }
          }
        }
      },
      where: {
        startDate: { gte: startDate }
      }
    }) as unknown as ExerciseWithSystems[];

    const costRecords = await prisma.costRecord.findMany({
      where: {
        date: { gte: startDate }
      }
    });

    const analytics: AnalyticsData = {
      totalSpending: calculateTotalSpending(costRecords),
      activeExercises: exercises.filter((e: ExerciseWithSystems) => e.status === 'IN_PROGRESS').length,
      pendingApproval: exercises.filter((e: ExerciseWithSystems) => e.status === 'PLANNING').length,
      systemsInUse: new Set(exercises.flatMap((e: ExerciseWithSystems) => 
        e.systems.map((s: ExerciseWithSystems['systems'][0]) => s.system.id)
      )).size,
      utilization: calculateUtilization(exercises),
      monthlyAverage: calculateTotalSpending(costRecords) / getMonthsBetweenDates(startDate, new Date()).length,
      monthlyChange: calculateMonthlyChange(costRecords),
      yearlyChange: calculateYearlyChange(costRecords),
      monthlyCosts: calculateMonthlyCosts(exercises),
      systemUsage: calculateSystemUsage(exercises),
      costBreakdown: calculateCostBreakdown(exercises)
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}