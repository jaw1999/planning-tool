import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Exercise, ExerciseSystem, System, ExerciseStatus, FSRType } from '@/app/lib/types/system';
import { Calendar, Package2, Users, DollarSign, Activity, Wrench } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { getDurationInDays, getDurationInMonths } from '@/app/lib/utils/date';
import { SystemSupportDetails } from "./system-support-details";
import { isBalloonGas } from '@/app/lib/utils/consumables';
import { SystemCost } from '@/app/lib/utils/cost';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/select';
import { cn } from '@/lib/utils';
import { ExportExerciseButton } from './export-exercise-button';
import { toast } from '@/app/components/ui/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLeadTimes } from '@/app/contexts/lead-times-context';

const STATUS_COLORS = {
  PLANNING: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  APPROVED: 'bg-purple-100 text-purple-800'
} as const;

interface ExerciseOverviewProps {
  exercise: Exercise;
  onStatusChange?: (status: ExerciseStatus) => void;
}

interface RequiredDate {
  name: string;
  description: string;
  dueDate: string;
  type: string;
}

interface LocalExerciseSystem {
  system?: System;
  quantity: number;
  fsrSupport: FSRType;
  fsrCost: number;
  launchesPerDay?: number;
  consumablePresets: Array<{
    preset: {
      name: string;
      consumable?: {
        name: string;
        unit: string;
        currentUnitCost: number;
      };
    };
    quantity: number;
  }>;
}

export function ExerciseOverview({ exercise, onStatusChange }: ExerciseOverviewProps) {
  const activeSystems = exercise.systems?.filter(s => s.fsrSupport !== 'NONE').length || 0;
  const totalSystems = exercise.systems?.length || 0;
  const duration = getDurationInDays(exercise.startDate, exercise.endDate);
  const durationInMonths = getDurationInMonths(exercise.startDate, exercise.endDate);

  const systemCosts = exercise.systems?.map(sys => {
    if (!sys.system) return null;

    const baseHardwareCost = (sys.system.basePrice || 0) * (sys.quantity || 1);
    const monthlyFSRCost = sys.fsrSupport !== 'NONE' ? (sys.fsrCost || 0) : 0;
    
    const monthlyConsumablesCost = sys.consumablePresets?.reduce((total, preset) => {
      let quantity = preset.quantity;
      if (preset.preset?.consumable && isBalloonGas(preset.preset.consumable.name)) {
        quantity = sys.launchesPerDay !== undefined ? quantity * sys.launchesPerDay * 30 : 0;
      }
      return total + ((preset.preset.consumable?.currentUnitCost || 0) * quantity);
    }, 0) || 0;

    const totalMonthlyRecurring = monthlyFSRCost + monthlyConsumablesCost;
    const totalForDuration = baseHardwareCost + (totalMonthlyRecurring * durationInMonths);

    const systemData = {
      systemName: sys.system.name,
      system: sys.system,
      baseHardwareCost,
      fsrCost: monthlyFSRCost,
      consumablesCost: monthlyConsumablesCost,
      monthlyConsumablesCost,
      totalMonthlyRecurring,
      totalForDuration,
      totalCost: totalForDuration,
      duration: durationInMonths,
      consumableBreakdown: sys.consumablePresets?.map(preset => ({
        name: preset.preset.name,
        monthlyCost: (preset.preset.consumable?.currentUnitCost || 0) * preset.quantity,
        isPerLaunch: preset.preset.consumable ? isBalloonGas(preset.preset.consumable.name) : false
      }))
    } as SystemCost;

    if (sys.launchesPerDay !== undefined) {
      systemData.launchesPerDay = sys.launchesPerDay;
    }

    return systemData;
  }).filter((cost): cost is SystemCost => cost !== null) || [];

  const monthlyRecurring = systemCosts.reduce((acc, cost) => acc + cost.totalMonthlyRecurring, 0);
  const oneTimeCosts = systemCosts.reduce((acc, cost) => acc + cost.baseHardwareCost, 0);
  const totalCost = systemCosts.reduce((acc, cost) => acc + cost.totalForDuration, 0);

  const totalLaunches = exercise.systems?.reduce((total, sys) => {
    const hasBalloonGas = sys.consumablePresets?.some(preset => 
      preset.preset?.consumable && isBalloonGas(preset.preset.consumable.name)
    );
    if (!hasBalloonGas || !sys.launchesPerDay) return total;
    return total + sys.launchesPerDay;
  }, 0) || 0;

  const validSystems = exercise.systems?.filter((sys): sys is ExerciseSystem & { system: System } => {
    return sys.system !== undefined;
  }) || [];

  const handleStatusChange = async (newStatus: ExerciseStatus) => {
    if (onStatusChange) {
      try {
        await onStatusChange(newStatus);
        toast({
          title: "Status Updated",
          description: `Exercise status changed to ${newStatus.replace('_', ' ')}`,
          variant: "success"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update exercise status",
          variant: "error"
        });
      }
    }
  };

  const monthlyData = Array.from({ length: durationInMonths }, (_, index) => {
    const month = index + 1;
    return {
      month: `Month ${month}`,
      hardware: month === 1 ? oneTimeCosts : 0,
      fsr: systemCosts.reduce((acc, cost) => acc + cost.fsrCost, 0),
      consumables: systemCosts.reduce((acc, cost) => acc + cost.monthlyConsumablesCost, 0),
      monthlyTotal: monthlyRecurring + (month === 1 ? oneTimeCosts : 0)
    };
  });

  const { leadTimes } = useLeadTimes();

  const requiredDates = useMemo(() => {
    if (!exercise.startDate) return [];
    
    // Get global lead times from settings
    const globalLeadTimes = leadTimes.map(lt => ({
      name: lt.name,
      description: lt.description,
      dueDate: format(subDays(new Date(exercise.startDate), lt.daysInAdvance), 'yyyy-MM-dd'),
      type: lt.type
    }));

    // Get system lead times
    const systemLeadTimes = exercise.systems?.flatMap(sys => {
      if (!sys.system?.leadTime) return [];
      return [{
        name: `${sys.system.name} - System Lead Time`,
        description: `Required lead time for ${sys.system.name}`,
        dueDate: format(subDays(new Date(exercise.startDate), sys.system.leadTime), 'yyyy-MM-dd'),
        type: 'PROCUREMENT' as const
      }];
    }) || [];

    return [...globalLeadTimes, ...systemLeadTimes];
  }, [leadTimes, exercise.startDate, exercise.systems]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">{exercise.name}</h1>
          <p className="text-gray-600 mt-1">{exercise.description}</p>
          <div className="text-sm text-gray-500 mt-2">
            <div>Start: {format(new Date(exercise.startDate), 'PPP p')}</div>
            <div>End: {format(new Date(exercise.endDate), 'PPP p')}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ExportExerciseButton 
            exercise={{
              name: exercise.name,
              description: exercise.description,
              startDate: format(new Date(exercise.startDate), 'yyyy-MM-dd'),
              endDate: format(new Date(exercise.endDate), 'yyyy-MM-dd'),
              location: exercise.location || '',
              totalBudget: exercise.totalBudget,
              totalCost: systemCosts.reduce((total, cost) => total + (cost?.totalForDuration || 0), 0),
              requiredDates: requiredDates,
              systems: exercise.systems?.map(sys => ({
                system: {
                  name: sys.system?.name || 'Unknown System',
                  basePrice: sys.system?.basePrice || 0,
                  leadTimes: sys.system?.leadTime ? [{
                    name: `${sys.system.name} Lead Time`,
                    description: `Required lead time for ${sys.system.name}`,
                    daysBeforeStart: sys.system.leadTime,
                    type: 'PROCUREMENT'
                  }] : undefined
                },
                quantity: sys.quantity || 1,
                fsrSupport: sys.fsrSupport || 'NONE',
                fsrCost: sys.fsrCost || 0,
                launchesPerDay: sys.launchesPerDay,
                consumablePresets: sys.consumablePresets || []
              })) || []
            }} 
          />
          {onStatusChange ? (
            <Select
              value={exercise.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className={cn(
                "w-[180px]",
                STATUS_COLORS[exercise.status as keyof typeof STATUS_COLORS]
              )}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNING">Planning</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge className={STATUS_COLORS[exercise.status as keyof typeof STATUS_COLORS]}>
              {exercise.status}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-gray-500 mr-2" />
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-2xl font-bold mt-2">{duration} days</div>
            <div className="text-sm text-gray-500 mt-1">
              {format(new Date(exercise.startDate), 'MMM d, yyyy')} - 
              {format(new Date(exercise.endDate), 'MMM d, yyyy')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-gray-500 mr-2" />
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
            <div className="text-2xl font-bold mt-2">
              ${totalCost.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Budget: ${(exercise.totalBudget || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="w-4 h-4 text-gray-500 mr-2" />
              <div className="text-sm text-gray-600">Systems</div>
            </div>
            <div className="text-2xl font-bold mt-2">{totalSystems}</div>
            <div className="text-sm text-gray-500 mt-1">
              {activeSystems} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="w-4 h-4 text-gray-500 mr-2" />
              <div className="text-sm text-gray-600">Daily Launches</div>
            </div>
            <div className="text-2xl font-bold mt-2">{totalLaunches}</div>
            <div className="text-sm text-gray-500 mt-1">
              Total across all systems
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">One-time Costs</dt>
                <dd className="mt-1 text-3xl font-semibold">${oneTimeCosts.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Monthly Recurring</dt>
                <dd className="mt-1 text-3xl font-semibold">${monthlyRecurring.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total for Duration</dt>
                <dd className="mt-1 text-3xl font-semibold">${totalCost.toLocaleString()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    interval={Math.floor(durationInMonths / 10)}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="hardware" 
                    name="Hardware" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fsr" 
                    name="FSR Support" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="consumables" 
                    name="Consumables" 
                    stroke="#ffc658" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="monthlyTotal" 
                    name="Monthly Total" 
                    stroke="#ff7300" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {systemCosts.map((cost, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{cost.systemName}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Hardware Cost</dt>
                  <dd className="mt-1 text-2xl font-semibold">${cost.baseHardwareCost.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Monthly FSR Cost</dt>
                  <dd className="mt-1 text-2xl font-semibold">${cost.fsrCost.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Monthly Consumables</dt>
                  <dd className="mt-1 text-2xl font-semibold">${cost.monthlyConsumablesCost.toLocaleString()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>

      <SystemSupportDetails 
        systems={validSystems}
        startDate={exercise.startDate.toString()}
        endDate={exercise.endDate.toString()}
      />

      <Card>
        <CardHeader>
          <CardTitle>Required Lead Times</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requiredDates.map((date: RequiredDate, index: number) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  new Date(date.dueDate) < new Date() ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{date.name}</h3>
                    <p className="text-sm text-gray-600">{date.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">Due by: {date.dueDate}</div>
                    <div className={`text-sm ${
                      new Date(date.dueDate) < new Date() ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {new Date(date.dueDate) < new Date() ? 'Overdue' : date.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {requiredDates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No lead times configured. Add them in Settings.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 