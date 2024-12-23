'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { useExercise, isExerciseListHook } from "@/app/lib/hooks/useExercise";
import { getDurationInMonths } from "@/app/lib/utils/date";
import { isBalloonGas } from "@/app/lib/utils/consumables";
import { SystemCostAnalysis } from "@/app/components/exercises/system-cost-analysis";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { DollarSign, Users, Activity, Calendar, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import type { Exercise, ExerciseSystem, System, ConsumablePreset, ExerciseStatus } from "@/app/lib/types/system";
import { AnalysisSettings } from '@/app/components/analysis/analysis-settings';
import { formatCurrency } from '@/app/lib/utils/format';
import { groupCostsByPeriod } from '@/app/lib/utils/time-grouping';

interface SystemCost {
  systemName: string;
  system: System;
  baseHardwareCost: number;
  fsrCost: number;
  consumablesCost: number;
  monthlyConsumablesCost: number;
  totalMonthlyRecurring: number;
  totalForDuration: number;
  totalCost: number;
  duration: number;
  launchesPerDay?: number;
  consumableBreakdown?: Array<{
    name: string;
    monthlyCost: number;
    isPerLaunch: boolean;
  }>;
}

interface ExerciseWithSystems extends Exercise {
  startDate: Date;
  endDate: Date;
  systems: (ExerciseSystem & {
    system: System;
    consumablePresets: (ConsumablePreset & {
      preset: {
        consumable: {
          currentUnitCost: number;
          name: string;
        };
        name: string;
      };
    })[];
  })[];
}

export default function AnalysisPage() {
  const [settings, setSettings] = useState<AnalysisSettings>({
    currency: 'USD',
    chartType: 'bar',
    timeGrouping: 'monthly',
    showBaseline: true,
    includeOneTimeCosts: true
  });

  const exerciseHook = useExercise();
  
  if (!isExerciseListHook(exerciseHook)) {
    throw new Error('Invalid hook type');
  }

  const { exercises, isLoading } = exerciseHook;
  
  const systemCosts = useMemo(() => {
    if (!exercises) return [];
    return exercises
      .filter((exercise): exercise is ExerciseWithSystems => 
        Boolean(exercise.systems?.length && exercise.startDate && exercise.endDate)
      )
      .flatMap((exercise) => {
        const duration = getDurationInMonths(exercise.startDate, exercise.endDate);
        
        return exercise.systems
          .filter((sys): sys is ExerciseWithSystems['systems'][0] => Boolean(sys.system))
          .map(sys => {
            const baseHardwareCost = (sys.system.basePrice || 0) * (sys.quantity || 1);
            const monthlyFSRCost = sys.fsrSupport !== 'NONE' ? (sys.fsrCost || 0) : 0;
            
            const monthlyConsumablesCost = sys.consumablePresets?.reduce((total: number, preset) => {
              let quantity = preset.quantity;
              if (preset.preset?.consumable && isBalloonGas(preset.preset.consumable.name)) {
                quantity = sys.launchesPerDay !== undefined ? quantity * sys.launchesPerDay * 30 : 0;
              }
              return total + ((preset.preset.consumable?.currentUnitCost || 0) * quantity);
            }, 0) || 0;

            const totalMonthlyRecurring = monthlyFSRCost + monthlyConsumablesCost;
            const totalForDuration = baseHardwareCost + (totalMonthlyRecurring * duration);

            return {
              systemName: sys.system.name,
              system: sys.system,
              baseHardwareCost,
              fsrCost: monthlyFSRCost,
              consumablesCost: monthlyConsumablesCost,
              monthlyConsumablesCost,
              totalMonthlyRecurring,
              totalForDuration,
              totalCost: totalForDuration,
              duration,
              launchesPerDay: sys.launchesPerDay,
              consumableBreakdown: sys.consumablePresets?.map(preset => ({
                name: preset.preset.name,
                monthlyCost: (preset.preset.consumable?.currentUnitCost || 0) * 
                  (preset.preset.consumable && isBalloonGas(preset.preset.consumable.name) && sys.launchesPerDay 
                    ? preset.quantity * sys.launchesPerDay * 30 
                    : preset.quantity),
                isPerLaunch: preset.preset.consumable ? isBalloonGas(preset.preset.consumable.name) : false
              })) || []
            };
          });
      }, [exercises]);
  }, [exercises]);

  const totalCost = useMemo(() => systemCosts.reduce((acc, cost) => acc + cost.totalForDuration, 0), [systemCosts]);
  const monthlyRecurring = useMemo(() => systemCosts.reduce((acc, cost) => acc + cost.totalMonthlyRecurring, 0), [systemCosts]);
  const oneTimeCosts = useMemo(() => systemCosts.reduce((acc, cost) => acc + cost.baseHardwareCost, 0), [systemCosts]);
  const maxDuration = useMemo(() => Math.max(...systemCosts.map(cost => cost.duration)), [systemCosts]);

  const monthlyData = useMemo(() => {
    if (!exercises?.length) return [];
    const rawData = Array.from({ length: maxDuration }, (_, index) => {
      const month = index + 1;
      const date = new Date(exercises[0].startDate);
      date.setMonth(date.getMonth() + index);
      
      return {
        date,
        hardware: month === 1 ? oneTimeCosts : 0,
        fsr: systemCosts.reduce((acc, cost) => acc + cost.fsrCost, 0),
        consumables: systemCosts.reduce((acc, cost) => acc + cost.monthlyConsumablesCost, 0),
        monthlyTotal: monthlyRecurring + (month === 1 ? oneTimeCosts : 0)
      };
    });
    return groupCostsByPeriod(rawData, settings.timeGrouping);
  }, [maxDuration, oneTimeCosts, systemCosts, monthlyRecurring, settings.timeGrouping, exercises]);

  if (isLoading || !exercises) {
    return <LoadingSpinner />;
  }

  const chartData = systemCosts.map(cost => ({
    name: cost.systemName,
    hardware: cost.baseHardwareCost,
    fsr: cost.fsrCost * cost.duration,
    consumables: cost.monthlyConsumablesCost * cost.duration
  }));

  const costDistribution = [
    { name: 'Hardware', value: oneTimeCosts },
    { 
      name: 'FSR Support', 
      value: systemCosts.reduce((acc, cost) => acc + (cost.fsrCost * cost.duration), 0) 
    },
    { 
      name: 'Consumables', 
      value: systemCosts.reduce((acc, cost) => acc + (cost.monthlyConsumablesCost * cost.duration), 0) 
    }
  ];

  const consumablesBreakdown = systemCosts.flatMap(cost => 
    cost.consumableBreakdown?.map(item => ({
      name: `${cost.systemName} - ${item.name}`,
      monthlyCost: item.monthlyCost,
      isPerLaunch: item.isPerLaunch
    })) || []
  );

  const consumablesByType = systemCosts.flatMap(cost => 
    cost.consumableBreakdown?.map(item => ({
      type: item.isPerLaunch ? 'Per Launch' : 'Monthly Fixed',
      cost: item.monthlyCost * cost.duration
    })) || []
  ).reduce((acc, { type, cost }) => {
    acc[type] = (acc[type] || 0) + cost;
    return acc;
  }, {} as Record<string, number>);

  const totalLaunches = exercises.reduce((total, exercise) => {
    return total + (exercise.systems?.reduce((sysTotal, sys) => {
      const hasBalloonGas = sys.consumablePresets?.some(preset => 
        preset.preset?.consumable && isBalloonGas(preset.preset.consumable.name)
      );
      if (!hasBalloonGas || !sys.launchesPerDay) return sysTotal;
      return sysTotal + sys.launchesPerDay;
    }, 0) || 0);
  }, 0);

  const systemComparison = systemCosts.map(cost => ({
    name: cost.systemName,
    total: cost.totalForDuration,
    monthly: cost.totalMonthlyRecurring || (cost.fsrCost || 0) + (cost.monthlyConsumablesCost || 0),
    launches: cost.launchesPerDay,
    consumables: cost.monthlyConsumablesCost || cost.consumablesCost || 0,
    fsr: cost.fsrCost || 0,
    duration: cost.duration || 1,
    baseHardware: cost.baseHardwareCost || 0
  }));

  const fiveYearProjection = Array.from({ length: 60 }, (_, index) => {
    const month = index + 1;
    const baselineCosts = monthlyRecurring;
    const inflationFactor = Math.pow(1.03, Math.floor(month / 12)); // 3% annual inflation
    return {
      month: `Month ${month}`,
      projected: baselineCosts * inflationFactor + (month === 1 ? oneTimeCosts : 0)
    };
  });

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  const averageMonthlyBySystem = systemCosts.map(cost => ({
    name: cost.systemName,
    average: cost.totalForDuration / cost.duration
  })).sort((a, b) => b.average - a.average);

  const timeAnalysis = exercises.map(ex => {
    const months = getDurationInMonths(ex.startDate, ex.endDate);
    return {
      name: ex.name,
      months,
      dailyLaunches: ex.systems?.reduce((acc, sys) => acc + (sys.launchesPerDay || 0), 0) || 0,
      totalCost: ex.systems?.reduce((acc, sys) => {
        if (!sys.system) return acc;
        const duration = getDurationInMonths(ex.startDate, ex.endDate);
        const baseHardwareCost = (sys.system.basePrice || 0) * (sys.quantity || 1);
        const monthlyFSRCost = sys.fsrSupport !== 'NONE' ? (sys.fsrCost || 0) : 0;
        const monthlyConsumablesCost = sys.consumablePresets?.reduce((total, preset) => {
          let quantity = preset.quantity;
          if (preset.preset?.consumable && isBalloonGas(preset.preset.consumable.name)) {
            quantity = sys.launchesPerDay !== undefined ? quantity * sys.launchesPerDay * 30 : 0;
          }
          return total + ((preset.preset.consumable?.currentUnitCost || 0) * quantity);
        }, 0) || 0;
        return acc + baseHardwareCost + ((monthlyFSRCost + monthlyConsumablesCost) * duration);
      }, 0) || 0
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analysis Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalysisSettings 
            settings={settings} 
            onSettingsChange={setSettings} 
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-gray-500 mr-2" />
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
            <div className="text-2xl font-bold mt-2">
              {formatCurrency(totalCost, settings.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-gray-500 mr-2" />
              <div className="text-sm text-gray-600">Monthly Recurring</div>
            </div>
            <div className="text-2xl font-bold mt-2">
              {formatCurrency(monthlyRecurring, settings.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="w-4 h-4 text-gray-500 mr-2" />
              <div className="text-sm text-gray-600">Systems</div>
            </div>
            <div className="text-2xl font-bold mt-2">{systemCosts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="w-4 h-4 text-gray-500 mr-2" />
              <div className="text-sm text-gray-600">Daily Launches</div>
            </div>
            <div className="text-2xl font-bold mt-2">{totalLaunches}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="time">Time Analysis</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                      >
                        {costDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Cost Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {settings.chartType === 'bar' ? (
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
                        <Bar dataKey="hardware" name="Hardware" fill="#8884d8" />
                        <Bar dataKey="fsr" name="FSR Support" fill="#82ca9d" />
                        <Bar dataKey="consumables" name="Consumables" fill="#ffc658" />
                        <Bar dataKey="monthlyTotal" name="Monthly Total" fill="#ff7300" />
                      </BarChart>
                    ) : settings.chartType === 'area' ? (
                      <AreaChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
                        <Area type="monotone" dataKey="hardware" name="Hardware" stackId="1" fill="#8884d8" />
                        <Area type="monotone" dataKey="fsr" name="FSR Support" stackId="1" fill="#82ca9d" />
                        <Area type="monotone" dataKey="consumables" name="Consumables" stackId="1" fill="#ffc658" />
                        <Area type="monotone" dataKey="monthlyTotal" name="Monthly Total" fill="#ff7300" />
                      </AreaChart>
                    ) : (
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
                        <Line type="monotone" dataKey="hardware" name="Hardware" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="fsr" name="FSR Support" stroke="#82ca9d" strokeWidth={2} />
                        <Line type="monotone" dataKey="consumables" name="Consumables" stroke="#ffc658" strokeWidth={2} />
                        <Line type="monotone" dataKey="monthlyTotal" name="Monthly Total" stroke="#ff7300" strokeWidth={2} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Cost Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={systemComparison} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} />
                      <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
                      <Bar dataKey="hardware" name="Hardware" fill="#8884d8" stackId="a" />
                      <Bar dataKey="monthly" name="Monthly Costs" fill="#82ca9d" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consumables Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={consumablesBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} />
                      <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
                      <Bar dataKey="monthlyCost" name="Monthly Cost" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          <SystemCostAnalysis 
            systemCosts={systemCosts} 
            currency={settings.currency}
          />
        </TabsContent>

        <TabsContent value="detailed">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Monthly Cost by System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={averageMonthlyBySystem} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} />
                      <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
                      <Bar dataKey="average" name="Average Monthly Cost" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consumables Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(consumablesByType).map(([name, value]) => ({ name, value }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                      >
                        {Object.keys(consumablesByType).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed cost breakdown cards */}
            {systemCosts.map((cost, index) => (
              <Card key={index} className="col-span-2">
                <CardHeader>
                  <CardTitle>{cost.systemName} - Detailed Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(cost.totalForDuration, settings.currency)}
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Monthly Operating</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(cost.totalMonthlyRecurring, settings.currency)}
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Cost per Month</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(cost.totalForDuration / cost.duration, settings.currency)}
                      </div>
                    </div>
                  </div>
                  
                  {cost.consumableBreakdown && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-4">Consumables Breakdown</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cost.consumableBreakdown.map((item, i) => (
                          <div key={i} className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">
                              {item.name} ({item.isPerLaunch ? 'per launch' : 'monthly'})
                            </div>
                            <div className="text-lg font-semibold mt-1">
                              {formatCurrency(item.monthlyCost, settings.currency)}/month
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="time">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Exercise Duration & Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {settings.chartType === 'bar' ? (
                      <BarChart data={timeAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip formatter={(value: number, name: string) => 
                          name.includes('Cost') ? formatCurrency(value, settings.currency) : value
                        } />
                        <Bar yAxisId="left" dataKey="months" name="Duration (Months)" fill="#8884d8" />
                        <Bar yAxisId="left" dataKey="totalCost" name="Total Cost" fill="#ff7300" />
                        <Bar yAxisId="right" dataKey="dailyLaunches" name="Daily Launches" fill="#82ca9d" />
                      </BarChart>
                    ) : settings.chartType === 'area' ? (
                      <AreaChart data={timeAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip formatter={(value: number, name: string) => 
                          name.includes('Cost') ? formatCurrency(value, settings.currency) : value
                        } />
                        <Area yAxisId="left" type="monotone" dataKey="months" name="Duration (Months)" fill="#8884d8" />
                        <Area yAxisId="left" type="monotone" dataKey="totalCost" name="Total Cost" fill="#ff7300" />
                        <Area yAxisId="right" type="monotone" dataKey="dailyLaunches" name="Daily Launches" fill="#82ca9d" />
                      </AreaChart>
                    ) : (
                      <LineChart data={timeAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip formatter={(value: number, name: string) => 
                          name.includes('Cost') ? formatCurrency(value, settings.currency) : value
                        } />
                        <Line yAxisId="left" type="monotone" dataKey="months" name="Duration (Months)" stroke="#8884d8" strokeWidth={2} />
                        <Line yAxisId="left" type="monotone" dataKey="totalCost" name="Total Cost" stroke="#ff7300" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="dailyLaunches" name="Daily Launches" stroke="#82ca9d" strokeWidth={2} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost per Launch Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeAnalysis.map(ex => ({
                      name: ex.name,
                      costPerLaunch: ex.dailyLaunches ? (ex.totalCost / (ex.dailyLaunches * ex.months * 30)) : 0
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
                      <Bar dataKey="costPerLaunch" name="Cost per Launch" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projections">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>5-Year Cost Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fiveYearProjection}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" interval={11} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
                      <Line type="monotone" dataKey="projected" name="Projected Monthly Cost" stroke="#ff7300" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Yearly summaries */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }, (_, i) => {
                const yearlyTotal = fiveYearProjection
                  .slice(i * 12, (i + 1) * 12)
                  .reduce((acc, month) => acc + month.projected, 0);
                return (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="text-sm text-gray-600">Year {i + 1}</div>
                      <div className="text-xl font-bold mt-2">
                        {formatCurrency(yearlyTotal, settings.currency)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}