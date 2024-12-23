'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { toast } from '@/app/components/ui/use-toast';
import { UserManagement } from '@/app/components/settings/user-management';
import { DatabaseManagement } from '@/app/components/settings/database-management';
import { GeneralSettings } from '@/app/components/settings/general-settings';
import { defaultSettings } from '@/app/lib/types/settings';
import type { GeneralSettings as GeneralSettingsType } from '@/app/lib/types/settings';
import { Card, CardContent } from '@/app/components/ui/card';
import { Skeleton } from '../components/ui/skeleton';

export default function SettingsPage() {
  const [settings, setSettings] = useState<GeneralSettingsType>(defaultSettings);
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/settings');
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          variant: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleUpdateSettings = async (newSettings: Partial<GeneralSettingsType>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      await axios.patch('/api/settings', updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'error'
      });
      // Revert settings if save failed
      setSettings(settings);
    }
  };

  const handleDatabaseExport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/database/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `database-export-${new Date().toISOString()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({
        title: 'Success',
        description: 'Database exported successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export database',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseBackup = async () => {
    try {
      setLoading(true);
      await axios.post('/api/database/backup');
      toast({
        title: 'Success',
        description: 'Database backup created successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create database backup',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseRestore = async (file: File) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('backup', file);
      await axios.post('/api/database/restore', formData);
      toast({
        title: 'Success',
        description: 'Database restored successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore database',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="general" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-[200px]" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <GeneralSettings
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseManagement 
            onExport={handleDatabaseExport}
            onBackup={handleDatabaseBackup}
            onRestore={handleDatabaseRestore}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}