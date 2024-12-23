import { startOfWeek, startOfMonth, startOfQuarter, startOfYear, format } from 'date-fns';

export type TimeGrouping = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface CostData {
  date: Date;
  hardware: number;
  fsr: number;
  consumables: number;
  monthlyTotal: number;
}

export function groupCostsByPeriod(costs: CostData[], grouping: TimeGrouping) {
  const groupedCosts = new Map<string, {
    hardware: number;
    fsr: number;
    consumables: number;
    monthlyTotal: number;
    count: number;
  }>();

  costs.forEach(cost => {
    let periodKey: string;
    const date = new Date(cost.date);

    switch (grouping) {
      case 'daily':
        periodKey = format(date, 'yyyy-MM-dd');
        break;
      case 'weekly':
        periodKey = format(startOfWeek(date), 'yyyy-MM-dd');
        break;
      case 'monthly':
        periodKey = format(startOfMonth(date), 'yyyy-MM');
        break;
      case 'quarterly':
        periodKey = `${format(startOfQuarter(date), 'yyyy')}-Q${Math.floor(date.getMonth() / 3) + 1}`;
        break;
      case 'yearly':
        periodKey = format(startOfYear(date), 'yyyy');
        break;
    }

    const existing = groupedCosts.get(periodKey) || {
      hardware: 0,
      fsr: 0,
      consumables: 0,
      monthlyTotal: 0,
      count: 0
    };

    groupedCosts.set(periodKey, {
      hardware: existing.hardware + cost.hardware,
      fsr: existing.fsr + cost.fsr,
      consumables: existing.consumables + cost.consumables,
      monthlyTotal: existing.monthlyTotal + cost.monthlyTotal,
      count: existing.count + 1
    });
  });

  return Array.from(groupedCosts.entries())
    .map(([period, totals]) => ({
      period,
      hardware: totals.hardware / totals.count,
      fsr: totals.fsr / totals.count,
      consumables: totals.consumables / totals.count,
      monthlyTotal: totals.monthlyTotal / totals.count
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
} 