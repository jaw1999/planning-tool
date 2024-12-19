'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { toast } from '@/app/components/ui/use-toast';
import { UserManagement } from '@/app/components/settings/user-management';
import { DatabaseManagement } from '@/app/components/settings/database-management';
import { GeneralSettings } from '@/app/components/settings/general-settings';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/app/components/ui/alert-dialog';
import { User, Permission, GeneralSettings as GeneralSettingsType } from '@/app/lib/types/settings';

const defaultSettings: GeneralSettingsType = {
  siteName: 'Planning Tool',
  defaultCurrency: 'USD',
  notifications: true,
  autoSave: true
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<GeneralSettingsType>(defaultSettings);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, permissionsRes, settingsRes] = await Promise.all([
          axios.get('/api/users'),
          axios.get('/api/permissions'),
          axios.get('/api/settings')
        ]);
        setUsers(usersRes.data);
        setPermissions(permissionsRes.data);
        setSettings(settingsRes.data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load settings data';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddUser = async (userData: Omit<User, 'id'>) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/users', userData);
      setUsers(prev => [...prev, response.data]);
      toast({
        title: 'Success',
        description: 'User added successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : error instanceof axios.AxiosError 
          ? error.response?.data?.error || 'Failed to add user'
          : 'Failed to add user';
          
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (updatedUser: Partial<User>) => {
    try {
      if (!updatedUser.id) {
        throw new Error('User ID is required');
      }
      
      const response = await axios.patch(`/api/users/${updatedUser.id}`, updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? response.data : u));
      toast({
        title: 'Success',
        description: 'User updated successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await axios.delete(`/api/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleUpdatePermission = async (userId: string, permissionId: string, value: boolean) => {
    try {
      await axios.patch(`/api/permissions/${userId}`, {
        permissionId,
        value
      });
      toast({
        title: 'Success',
        description: 'Permission updated successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update permission';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleExportData = async () => {
    try {
      const response = await axios.get('/api/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export-${new Date().toISOString()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export data';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings
            settings={settings}
            onUpdate={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
          />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement
            users={users}
            permissions={permissions}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={async (id) => {
              setUserToDelete(id);
              setIsDeleteDialogOpen(true);
              return new Promise<void>(resolve => resolve());
            }}
            onUpdatePermission={handleUpdatePermission}
            loading={loading}
            error={error}
          />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseManagement onExport={handleExportData} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => userToDelete && handleDeleteUser(userToDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}