'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { toast } from '@/app/components/ui/use-toast';
import { UserManagement } from '@/app/components/settings/user-management';
import { DatabaseManagement } from '@/app/components/settings/database-management';
import { SystemHealth } from '@/app/components/settings/system-health';
import { GeneralSettings } from '@/app/components/settings/general-settings';
import { defaultSettings } from '@/app/lib/types/settings';
import type { GeneralSettings as GeneralSettingsType } from '@/app/lib/types/settings';
import { Card, CardContent } from '@/app/components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '@/app/components/ui/button';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<GeneralSettingsType>(defaultSettings);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axios.get('/api/settings');
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleUpdateSettings = async (partialSettings: Partial<GeneralSettingsType>) => {
    try {
      const newSettings = { ...settings, ...partialSettings };
      await axios.post('/api/settings', newSettings);
      setSettings(newSettings);
      toast({
        title: 'Success',
        description: 'Settings updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'error'
      });
    }
  };

  const handleDatabaseExport = async () => {
    try {
      const response = await axios.get('/api/database/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `database-export-${new Date().toISOString()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export database',
        variant: 'error'
      });
    }
  };

  const handleDatabaseBackup = async () => {
    try {
      await axios.post('/api/database/backup');
      toast({
        title: 'Success',
        description: 'Database backup created successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create database backup',
        variant: 'error'
      });
    }
  };

  const handleDatabaseRestore = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('backup', file);
      await axios.post('/api/database/restore', formData);
      toast({
        title: 'Success',
        description: 'Database restored successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore database',
        variant: 'error'
      });
    }
  };

  return (
    <div className="container space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings 
            settings={settings}
            onUpdate={handleUpdateSettings}
          />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="database">
          <div className="grid gap-4">
            <Card>
              <CardContent className="pt-6">
                <DatabaseManagement 
                  onExport={handleDatabaseExport}
                  onBackup={handleDatabaseBackup}
                  onRestore={handleDatabaseRestore}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="space-y-6">
            <SystemHealth />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}