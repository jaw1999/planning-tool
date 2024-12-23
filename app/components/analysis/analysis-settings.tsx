'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '../ui/label';
import { formatCurrency } from '@/app/lib/utils/format';

export interface AnalysisSettings {
  currency: string;
  chartType: 'bar' | 'line' | 'area';
  timeGrouping: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  showBaseline: boolean;
  includeOneTimeCosts: boolean;
}

interface AnalysisSettingsProps {
  settings: AnalysisSettings;
  onSettingsChange: (settings: AnalysisSettings) => void;
}

export function AnalysisSettings({ settings, onSettingsChange }: AnalysisSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Currency Display</Label>
          <Select
            value={settings.currency}
            onValueChange={(value) => onSettingsChange({ ...settings, currency: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Chart Type</Label>
          <Select
            value={settings.chartType}
            onValueChange={(value: 'bar' | 'line' | 'area') => 
              onSettingsChange({ ...settings, chartType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Time Grouping</Label>
          <Select
            value={settings.timeGrouping}
            onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') => 
              onSettingsChange({ ...settings, timeGrouping: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time grouping" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={settings.showBaseline}
            onCheckedChange={(checked: boolean) => 
              onSettingsChange({ ...settings, showBaseline: checked })}
          />
          <Label>Show Cost Baseline</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={settings.includeOneTimeCosts}
            onCheckedChange={(checked: boolean) => 
              onSettingsChange({ ...settings, includeOneTimeCosts: checked })}
          />
          <Label>Include One-time Costs</Label>
        </div>
      </CardContent>
    </Card>
  );
} 