import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyCostTrendProps {
  data: {
    month: string;
    hardware: number;
    software: number;
    fsr: number;
    consumables: number;
    maintenance: number;
  }[];
  onDataProcessed?: (stats: {
    monthlyAverage: number;
    monthlyChange: number;
    totalSpending: number;
  }) => void;
}

export function MonthlyCostTrend({ data, onDataProcessed }: MonthlyCostTrendProps) {
  const chartData = data.map(item => ({
    ...item,
    total: item.hardware + item.software + item.fsr + item.consumables + item.maintenance
  }));

  useEffect(() => {
    if (!onDataProcessed || chartData.length === 0) return;

    const totals = chartData.map(d => d.total);
    const monthlyAverage = totals.reduce((a, b) => a + b, 0) / totals.length;
    
    const lastMonth = totals[totals.length - 1];
    const previousMonth = totals[totals.length - 2] || lastMonth;
    const monthlyChange = ((lastMonth - previousMonth) / previousMonth) * 100;
    
    const totalSpending = totals.reduce((a, b) => a + b, 0);

    onDataProcessed({
      monthlyAverage,
      monthlyChange,
      totalSpending
    });
  }, [chartData, onDataProcessed]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Cost Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000)}k`}
                width={80}
              />
              <Tooltip 
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="hardware" 
                name="Hardware" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="fsr" 
                name="FSR Support" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="consumables" 
                name="Consumables" 
                stroke="#ffc658" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                name="Total" 
                stroke="#ff7300" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 