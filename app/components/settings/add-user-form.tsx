import React from 'react';
import { User } from '@/app/lib/types/settings';
import { Role, UserStatus } from '@prisma/client';
import { Eye, EyeOff } from 'lucide-react';

interface AddUserFormProps {
  onAdd: (user: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  status: UserStatus;
  updatedAt: Date;
}

export function AddUserForm({ onAdd, onCancel }: AddUserFormProps) {
  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: Role.VIEWER,
    status: UserStatus.ACTIVE,
    updatedAt: new Date()
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
        setError('Name, email and password are required');
        return;
      }

      if (!formData.email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = formData;
      await onAdd(userData);
      onCancel(); // Close the form on success
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          value={formData.role}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            role: e.target.value as Role
          }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value={Role.ADMIN}>Admin</option>
          <option value={Role.PLANNER}>Planner</option>
          <option value={Role.VIEWER}>Viewer</option>
          <option value={Role.GUEST}>Guest</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            status: e.target.value as UserStatus
          }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value={UserStatus.ACTIVE}>Active</option>
          <option value={UserStatus.INACTIVE}>Inactive</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Add User
        </button>
      </div>
    </form>
  );
}