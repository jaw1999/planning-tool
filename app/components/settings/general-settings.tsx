import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import type { GeneralSettings } from '@/app/lib/types/settings';
import { ThemeToggle } from './theme-toggle';

interface GeneralSettingsProps {
  settings: GeneralSettings;
  onUpdate: (settings: Partial<GeneralSettings>) => void;
}

export function GeneralSettings({ settings, onUpdate }: GeneralSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => onUpdate({ siteName: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Default Currency</label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => onUpdate({ defaultCurrency: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date Format</label>
            <select
              value={settings.dateFormat}
              onChange={(e) => onUpdate({ dateFormat: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="emailNotifications"
              checked={settings.emailNotifications}
              onChange={(e) => onUpdate({ emailNotifications: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
              Enable Email Notifications
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoBackup"
              checked={settings.autoBackup}
              onChange={(e) => onUpdate({ autoBackup: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="autoBackup" className="text-sm font-medium text-gray-700">
              Enable Automatic Backups
            </label>
          </div>

          <div className="pt-4 border-t">
            <ThemeToggle />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 