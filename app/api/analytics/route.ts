import { NextResponse } from 'next/server';
import prisma from '@/app/services/database/prisma';
import { AnalyticsData, MonthlyCost, SystemUsage, CostBreakdown, SystemBreakdown, MonthlyBreakdown } from '@/app/lib/types/analytics';

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
  startDate: Date;
  endDate: Date;
  status: string;
  systems: Array<{
    system: {
      id: string;
      name: string;
      basePrice: number | null;
      logistics?: {
        shipping?: { costs?: number };
        refurbishment?: { pricing?: { estimated?: number } };
        spares?: { required?: Array<{ cost?: number }> };
      };
      operations?: {
        training?: { required?: { cost?: number } };
        maintenance?: { scheduled?: Array<{ cost?: number }> };
      };
    };
    quantity: number;
    fsrSupport: FSRType;
    fsrCost: number | null;
    consumablesCost: number;
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

function calculateMonthlyCosts(costRecords: CostRecord[], startDate: Date): MonthlyCost[] {
  const months = getMonthsBetweenDates(startDate, new Date());
  const monthlyCosts: MonthlyCost[] = [];
  
  for (let i = 0; i <= months; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    
    const monthRecords = costRecords.filter(r => 
      r.date.getMonth() === date.getMonth() && 
      r.date.getFullYear() === date.getFullYear()
    );

    monthlyCosts.push({
      month: date.toLocaleString('default', { month: 'short' }),
      hardware: sumCostsByType(monthRecords, 'ONE_TIME'),
      software: sumCostsByType(monthRecords, 'LICENSE'),
      fsr: sumCostsByType(monthRecords, 'FSR'),
      consumables: sumCostsByType(monthRecords, 'CONSUMABLE'),
      shipping: sumCostsByType(monthRecords, 'SHIPPING'),
      refurbishment: sumCostsByType(monthRecords, 'REFURBISHMENT'),
      spares: sumCostsByType(monthRecords, 'SPARES'),
      training: sumCostsByType(monthRecords, 'TRAINING'),
      maintenance: sumCostsByType(monthRecords, 'MAINTENANCE')
    });
  }
  
  return monthlyCosts;
}

function calculateSystemUsage(exercises: ExerciseWithSystems[]): SystemUsage[] {
  const systemUsage = new Map<string, SystemUsage>();
  
  exercises.forEach(exercise => {
    exercise.systems.forEach(sys => {
      const current = systemUsage.get(sys.system.id) || {
        name: sys.system.name,
        exercises: 0,
        totalCost: 0
      };
      
      current.exercises++;
      current.totalCost += calculateSystemTotalCost(sys);
      systemUsage.set(sys.system.id, current);
    });
  });
  
  return Array.from(systemUsage.values());
}

function calculateSystemTotalCost(sys: ExerciseWithSystems['systems'][0]): number {
  const baseHardwareCost = (sys.system.basePrice || 0) * sys.quantity;
  const monthlyFSRCost = sys.fsrSupport !== 'NONE' ? (sys.fsrCost || 0) : 0;
  const monthlyConsumablesCost = sys.consumablesCost * sys.quantity;
  
  return baseHardwareCost + monthlyFSRCost + monthlyConsumablesCost;
}

function getMonthsBetweenDates(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + 
    (end.getMonth() - start.getMonth());
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

function calculateDetailedCostBreakdown(
  costRecords: CostRecord[],
  exercises: ExerciseWithSystems[],
  startDate: Date
): CostBreakdown[] {
  const costTypes: CostType[] = ['ONE_TIME', 'LICENSE', 'FSR', 'CONSUMABLE'];
  const breakdowns: CostBreakdown[] = [];

  for (const type of costTypes) {
    const typeRecords = costRecords.filter(r => r.type === type);
    const totalValue = calculateTotalSpending(typeRecords);
    const monthlyGroups = groupCostsByMonth(typeRecords);
    
    // Calculate trend
    const trend = (() => {
      if (monthlyGroups.length < 2) return 'stable';
      const lastThreeMonths = monthlyGroups.slice(-3);
      const changes = lastThreeMonths.map((g, i) => 
        i > 0 ? ((g.total - lastThreeMonths[i-1].total) / lastThreeMonths[i-1].total) * 100 : 0
      );
      const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
      if (avgChange > 5) return 'increasing';
      if (avgChange < -5) return 'decreasing';
      return 'stable';
    })();

    // Calculate system breakdown
    const systemBreakdown = exercises.reduce((acc: SystemBreakdown[], exercise) => {
      exercise.systems.forEach(sys => {
        const existingSystem = acc.find(s => s.systemName === sys.system.name);
        let amount = 0;

        switch (type) {
          case 'ONE_TIME':
            amount = (sys.system.basePrice || 0) * sys.quantity;
            break;
          case 'LICENSE':
            // Assuming license costs are included in the cost records
            amount = typeRecords
              .filter(r => r.date >= exercise.startDate && r.date <= exercise.endDate)
              .reduce((sum, r) => sum + r.amount, 0);
            break;
          case 'FSR':
            amount = sys.fsrSupport !== 'NONE' ? (sys.fsrCost || 0) : 0;
            break;
          case 'CONSUMABLE':
            amount = sys.consumablesCost * sys.quantity;
            break;
        }

        if (existingSystem) {
          existingSystem.amount += amount;
        } else {
          acc.push({
            systemName: sys.system.name,
            amount,
            percentage: 0 // Will be calculated after all systems are processed
          });
        }
      });
      return acc;
    }, []);

    // Calculate percentages for system breakdown
    const totalSystemCost = systemBreakdown.reduce((sum, sys) => sum + sys.amount, 0);
    systemBreakdown.forEach(sys => {
      sys.percentage = totalSystemCost > 0 ? (sys.amount / totalSystemCost) * 100 : 0;
    });

    // Calculate monthly breakdown
    const monthlyBreakdown: MonthlyBreakdown[] = monthlyGroups.map((group, index) => ({
      month: group.date.toLocaleString('default', { month: 'short' }),
      amount: group.total,
      change: index > 0 ? 
        ((group.total - monthlyGroups[index - 1].total) / monthlyGroups[index - 1].total) * 100 : 
        0
    }));

    breakdowns.push({
      name: type.toLowerCase(),
      value: totalValue,
      percentageOfTotal: costRecords.length > 0 ? 
        (totalValue / calculateTotalSpending(costRecords)) * 100 : 
        0,
      monthlyAverage: monthlyGroups.reduce((sum, group) => sum + group.total, 0) / monthlyGroups.length,
      trend,
      breakdown: {
        bySystem: systemBreakdown,
        byMonth: monthlyBreakdown
      }
    });
  }

  return breakdowns;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '1y';
    const startDate = getStartDateFromRange(timeRange);

    const [exercises, costRecords] = await Promise.all([
      prisma.exercise.findMany({
        where: {
          startDate: { gte: startDate }
        },
        include: {
          systems: {
            include: { system: true }
          }
        }
      }),
      prisma.costRecord.findMany({
        where: {
          date: { gte: startDate }
        }
      })
    ]);

    const analytics: AnalyticsData = {
      totalSpending: calculateTotalSpending(costRecords),
      activeExercises: exercises.filter((e: ExerciseWithSystems) => e.status === 'IN_PROGRESS').length,
      pendingApproval: exercises.filter((e: ExerciseWithSystems) => e.status === 'PLANNING').length,
      systemsInUse: new Set(exercises.flatMap((e: ExerciseWithSystems) => 
        e.systems.map((s: ExerciseWithSystems['systems'][0]) => s.system.id)
      )).size,
      utilization: calculateUtilization(exercises),
      monthlyAverage: calculateTotalSpending(costRecords) / getMonthsBetweenDates(startDate, new Date()),
      monthlyChange: calculateMonthlyChange(costRecords),
      yearlyChange: calculateYearlyChange(costRecords),
      monthlyCosts: calculateMonthlyCosts(costRecords, startDate),
      systemUsage: calculateSystemUsage(exercises),
      costBreakdown: calculateDetailedCostBreakdown(costRecords, exercises, startDate)
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