import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Edit, Trash2, Search, Plus } from 'lucide-react';
import type { User, Permission } from '@/app/lib/types/settings';
import { ROLES } from '@/app/lib/types/settings';
import { Role, UserStatus } from '@prisma/client';
import { EditUserModal } from './edit-user-modal';
import { AddUserForm } from './add-user-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface UserManagementProps {
  users: User[];
  permissions: Permission[];
  onAddUser: (userData: Omit<User, 'id'>) => Promise<void>;
  onEditUser: (updatedUser: Partial<User>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onUpdatePermission: (permissionId: string, role: keyof Permission['roles'], value: boolean) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function UserManagement({
  users,
  permissions,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onUpdatePermission,
  loading,
  error
}: UserManagementProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleAddUser = async (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) => {
    await onAddUser({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    setIsAddModalOpen(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>User Management</CardTitle>
            <button
              onClick={handleAddClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full p-2 border rounded-md"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | 'ALL')}
                className="p-2 border rounded-md min-w-[150px]"
              >
                <option value="ALL">All Roles</option>
                {Object.values(Role).map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            
            {/* Results Summary */}
            <div className="text-sm text-gray-500">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.email}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-sm text-muted-foreground">Role: {user.role}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="p-2 text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No users found matching your search criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <AddUserForm 
            onAdd={handleAddUser}
            onCancel={() => setIsAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setIsEditModalOpen(false)}
          onSave={onEditUser}
        />
      )}
    </div>
  );
}