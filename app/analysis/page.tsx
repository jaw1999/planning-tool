'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
         LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Filter, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAnalytics } from '@/app/lib/hooks/useAnalytics';
import { AnalyticsData } from '@/app/lib/types/analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalysisPage() {
  const [timeRange, setTimeRange] = useState('1y');
  const [activeTab, setActiveTab] = useState('overview');
  const { data, isLoading, error } = useAnalytics(timeRange);

  if (isLoading) return <div className="flex items-center justify-center h-64">
    <div className="text-lg">Loading analytics...</div>
  </div>;

  if (error) return <div className="flex items-center justify-center h-64">
    <div className="text-lg text-red-600">Error: {error}</div>
  </div>;

  if (!data) return <div className="flex items-center justify-center h-64">
    <div className="text-lg">No data available</div>
  </div>;

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cost Analysis</h1>
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="systems">System Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">Total Spending</div>
                <div className="text-2xl font-bold mt-1">
                  ${data.totalSpending.toLocaleString()}
                </div>
                <div className={`text-sm mt-1 ${
                  data.yearlyChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.yearlyChange >= 0 ? '+' : ''}{data.yearlyChange.toFixed(1)}% from last year
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">Monthly Average</div>
                <div className="text-2xl font-bold mt-1">
                  ${data.monthlyAverage.toLocaleString()}
                </div>
                <div className={`text-sm mt-1 ${
                  data.monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.monthlyChange >= 0 ? '+' : ''}{data.monthlyChange.toFixed(1)}% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">Active Exercises</div>
                <div className="text-2xl font-bold mt-1">
                  {data.activeExercises}
                </div>
                <div className="text-sm mt-1 text-gray-600">
                  {data.pendingApproval} pending approval
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">Systems in Use</div>
                <div className="text-2xl font-bold mt-1">
                  {data.systemsInUse}
                </div>
                <div className="text-sm mt-1 text-gray-600">
                  {data.utilization.toFixed(1)}% utilization
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend Chart */}
          <div className="grid gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Cost Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlyCosts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Line type="monotone" dataKey="hardware" stroke="#0088FE" name="Hardware" />
                      <Line type="monotone" dataKey="software" stroke="#00C49F" name="Software" />
                      <Line type="monotone" dataKey="fsr" stroke="#FFBB28" name="FSR Support" />
                      <Line type="monotone" dataKey="consumables" stroke="#FF8042" name="Consumables" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cost Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.costBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {data.costBreakdown.map((entry, index) => (
                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {data.costBreakdown.map((cost, index) => (
                      <div key={cost.name} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="capitalize">{cost.name}</span>
                        </div>
                        <div className="font-medium">
                          ${cost.value.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.costBreakdown.map((cost, index) => (
              <Card key={cost.name}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="capitalize">{cost.name}</CardTitle>
                    {getTrendIcon(cost.trend)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold">
                        ${(cost.value || 0).toLocaleString()}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {((cost.percentageOfTotal || 0)).toFixed(1)}% of total spending
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Monthly Avg: ${(cost.monthlyAverage || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cost.breakdown.byMonth}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-muted-foreground" />
                          <YAxis className="text-muted-foreground" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px'
                            }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="amount" 
                            stroke={`hsl(${index * 60}, 70%, 50%)`} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium mb-2">System Breakdown</h4>
                      <div className="space-y-2">
                        {cost.breakdown.bySystem.map(system => (
                          <div key={system.systemName} className="flex justify-between items-center">
                            <span className="text-muted-foreground">{system.systemName}</span>
                            <span className="font-medium">
                              ${(system.amount || 0).toLocaleString()} ({(system.percentage || 0).toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="systems">
          <Card>
            <CardHeader>
              <CardTitle>System Usage and Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        System
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Exercises
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Total Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Average Cost per Exercise
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.systemUsage.map((system) => (
                      <tr key={system.name} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {system.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {system.exercises}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          ${system.totalCost.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          ${(system.totalCost / system.exercises).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}