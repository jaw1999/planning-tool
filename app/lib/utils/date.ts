import { differenceInDays, differenceInMonths } from 'date-fns';

export function getDurationInDays(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil(differenceInDays(end, start));
}

export function getDurationInMonths(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil(differenceInMonths(end, start));
} 