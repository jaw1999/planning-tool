import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const currencySchema = z.number().min(0, 'Amount must be positive');
export const dateSchema = z.string().datetime('Invalid date format');

// Equipment validation
export const equipmentSchema = z.object({
  productInfo: z.object({
    name: z.string().min(1, 'Equipment name is required').max(255),
    model: z.string().max(100),
    version: z.string().max(50).optional(),
    classification: z.enum(['UNCLASSIFIED', 'UNCLASSIFIED//FOUO', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET']),
    description: z.string().max(1000),
  }),
  acquisitionCost: z.number().min(0).optional(),
  fsrSupportCost: z.number().min(0).optional(),
});

// System validation
export const systemSchema = z.object({
  name: z.string().min(1, 'System name is required').max(255),
  description: z.string().max(1000).optional(),
  basePrice: z.number().min(0, 'Base price must be positive'),
  leadTime: z.number().int().min(1, 'Lead time must be at least 1 day'),
});

// Exercise validation
export const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(255),
  description: z.string().max(1000).optional(),
  startDate: z.date(),
  endDate: z.date(),
  location: z.string().max(255).optional(),
  totalBudget: z.number().min(0).optional(),
});

// User validation
export const userSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: emailSchema,
  role: z.enum(['ADMIN', 'PLANNER', 'VIEWER', 'GUEST']),
});

export const createUserSchema = userSchema.extend({
  password: passwordSchema,
});

export const updateUserSchema = userSchema.partial().extend({
  password: passwordSchema.optional(),
});

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Validation helpers
export function validateAndSanitizeUser(userData: any) {
  const sanitized = {
    ...userData,
    name: sanitizeInput(userData.name || ''),
    email: sanitizeEmail(userData.email || ''),
  };

  return createUserSchema.parse(sanitized);
}

export function validatePagination(page?: string, limit?: string) {
  const pageNum = Math.max(1, parseInt(page || '1'));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20')));
  
  return { page: pageNum, limit: limitNum };
}

// Error formatting
export function formatValidationError(error: z.ZodError) {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

export function createValidationResponse(error: z.ZodError) {
  return {
    error: 'Validation failed',
    details: formatValidationError(error),
  };
} 