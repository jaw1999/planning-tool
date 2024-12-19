import { Role, UserStatus } from '@prisma/client';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  lastLogin?: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description?: string | null;
  roles: {
    ADMIN: boolean;
    PLANNER: boolean;
    VIEWER: boolean;
    GUEST: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneralSettings {
  siteName: string;
  defaultCurrency: string;
  notifications: boolean;
  autoSave: boolean;
}

// Constants for roles and status
export const ROLES = ['ADMIN', 'PLANNER', 'VIEWER', 'GUEST'] as const;
export const USER_STATUS = ['ACTIVE', 'INACTIVE'] as const;

// Type guards
export function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}

export function isUserStatus(value: string): value is UserStatus {
  return USER_STATUS.includes(value as UserStatus);
}

const defaultSettings: GeneralSettings = {
  siteName: 'Planning Tool',
  defaultCurrency: 'USD',
  notifications: true,
  autoSave: true
};