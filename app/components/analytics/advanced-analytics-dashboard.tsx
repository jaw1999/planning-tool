'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter,
  ComposedChart, ReferenceLine
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Users, Database,
  Download, Filter, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Target, Activity, Zap
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalExercises: number;
    totalCost: number;
    avgCostPerExercise: number;
    totalSystems: number;
    activeExercises: number;
    costTrend: number;
  };
  costTrends: Array<{
    month: string;
    cost: number;
    exercises: number;
    avgCost: number;
  }>;
  exercisesByStatus: Array<{
    status: string;
    count: number;
    totalCost: number;
  }>;
  systemUtilization: Array<{
    systemName: string;
    usageCount: number;
    totalCost: number;
    avgCostPerUse: number;
  }>;
  costBreakdown: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
  monthlyProjections: Array<{
    month: string;
    projected: number;
    actual: number;
    variance: number;
  }>;
  performanceMetrics: {
    costEfficiency: number;
    timeToCompletion: number;
    resourceUtilization: number;
    budgetAccuracy: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function AdvancedAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [selectedMetric, setSelectedMetric] = useState('cost');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/advanced?period=${selectedPeriod}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const exportData = async (format: 'excel' | 'pdf') => {
    try {
      const response = await fetch('/api/export/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'analytics',
          format,
          period: selectedPeriod,
          includeCharts: true
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-dashboard-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground">Unable to load analytics data. Please try again.</p>
        <Button onClick={fetchAnalyticsData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportData('excel')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">${data.overview.totalCost.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {data.overview.costTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${data.overview.costTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(data.overview.costTrend).toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Exercises</p>
                <p className="text-2xl font-bold">{data.overview.activeExercises}</p>
                <p className="text-sm text-muted-foreground">of {data.overview.totalExercises} total</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Cost/Exercise</p>
                <p className="text-2xl font-bold">${data.overview.avgCostPerExercise.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">per exercise</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Systems</p>
                <p className="text-2xl font-bold">{data.overview.totalSystems}</p>
                <p className="text-sm text-muted-foreground">total systems</p>
              </div>
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {data.performanceMetrics.costEfficiency}%
              </div>
              <p className="text-sm text-muted-foreground">Cost Efficiency</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${data.performanceMetrics.costEfficiency}%` }}
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {data.performanceMetrics.timeToCompletion}%
              </div>
              <p className="text-sm text-muted-foreground">Time Efficiency</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${data.performanceMetrics.timeToCompletion}%` }}
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {data.performanceMetrics.resourceUtilization}%
              </div>
              <p className="text-sm text-muted-foreground">Resource Utilization</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${data.performanceMetrics.resourceUtilization}%` }}
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">
                {data.performanceMetrics.budgetAccuracy}%
              </div>
              <p className="text-sm text-muted-foreground">Budget Accuracy</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${data.performanceMetrics.budgetAccuracy}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends">Cost Trends</TabsTrigger>
          <TabsTrigger value="status">Exercise Status</TabsTrigger>
          <TabsTrigger value="systems">System Usage</TabsTrigger>
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                Cost Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.costTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="cost" orientation="left" />
                    <YAxis yAxisId="exercises" orientation="right" />
                    <Tooltip formatter={(value, name) => [
                      name === 'cost' || name === 'avgCost' ? `$${Number(value).toLocaleString()}` : value,
                      name === 'cost' ? 'Total Cost' : name === 'avgCost' ? 'Avg Cost' : 'Exercises'
                    ]} />
                    <Legend />
                    <Bar yAxisId="exercises" dataKey="exercises" fill="#8884d8" name="Exercises" />
                    <Line yAxisId="cost" type="monotone" dataKey="cost" stroke="#82ca9d" strokeWidth={3} name="Total Cost" />
                    <Line yAxisId="cost" type="monotone" dataKey="avgCost" stroke="#ffc658" strokeWidth={2} name="Avg Cost" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Exercises by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.exercisesByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {data.exercisesByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.exercisesByStatus.map((status, index) => (
                    <div key={status.status} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{status.status}</p>
                          <p className="text-sm text-muted-foreground">{status.count} exercises</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${status.totalCost.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">total cost</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="systems">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                System Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.systemUtilization} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="systemName" type="category" width={120} />
                    <Tooltip formatter={(value, name) => [
                      name === 'totalCost' || name === 'avgCostPerUse' ? `$${Number(value).toLocaleString()}` : value,
                      name === 'usageCount' ? 'Usage Count' : name === 'totalCost' ? 'Total Cost' : 'Avg Cost Per Use'
                    ]} />
                    <Legend />
                    <Bar dataKey="usageCount" fill="#8884d8" name="Usage Count" />
                    <Bar dataKey="totalCost" fill="#82ca9d" name="Total Cost" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.costBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="amount"
                      >
                        {data.costBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.costBreakdown.map((item, index) => (
                    <div key={item.type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{item.type}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projections">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Budget vs Actual Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.monthlyProjections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']} />
                    <Legend />
                    <Bar dataKey="projected" fill="#8884d8" name="Projected" />
                    <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
                    <Line type="monotone" dataKey="variance" stroke="#ff7300" strokeWidth={2} name="Variance %" />
                    <ReferenceLine y={0} stroke="#000" strokeDasharray="2 2" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 