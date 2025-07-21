import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  BACKUP = 'BACKUP',
  RESTORE = 'RESTORE',
}

export enum AuditResource {
  USER = 'USER',
  EQUIPMENT = 'EQUIPMENT',
  SYSTEM = 'SYSTEM',
  EXERCISE = 'EXERCISE',
  CONSUMABLE = 'CONSUMABLE',
  SETTING = 'SETTING',
  DATABASE = 'DATABASE',
}

interface AuditLogData {
  userId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata || {},
        timestamp: new Date(),
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking main functionality
  }
}

export function getClientInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

export async function auditUserAction(
  userId: string,
  action: AuditAction,
  resource: AuditResource,
  resourceId?: string,
  details?: Record<string, any>,
  request?: NextRequest
) {
  const clientInfo = request ? getClientInfo(request) : {};
  
  await createAuditLog({
    userId,
    action,
    resource,
    resourceId,
    details,
    ...clientInfo,
  });
}

export async function auditSystemAction(
  action: AuditAction,
  resource: AuditResource,
  details?: Record<string, any>,
  request?: NextRequest
) {
  const clientInfo = request ? getClientInfo(request) : {};
  
  await createAuditLog({
    action,
    resource,
    details,
    ...clientInfo,
  });
}

// Audit middleware for API routes
export function withAudit(
  handler: Function,
  resource: AuditResource,
  action: AuditAction
) {
  return async (request: NextRequest, context: any) => {
    const start = Date.now();
    
    try {
      const result = await handler(request, context);
      const duration = Date.now() - start;
      
      // Log successful action
      await auditSystemAction(action, resource, {
        method: request.method,
        url: request.url,
        duration,
        status: 'success'
      }, request);
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      // Log failed action
      await auditSystemAction(action, resource, {
        method: request.method,
        url: request.url,
        duration,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, request);
      
      throw error;
    }
  };
}

// Helper to get audit logs with pagination
export async function getAuditLogs(options: {
  page?: number;
  limit?: number;
  userId?: string;
  resource?: AuditResource;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
}) {
  const {
    page = 1,
    limit = 20,
    userId,
    resource,
    action,
    startDate,
    endDate
  } = options;

  const where: any = {};
  
  if (userId) where.userId = userId;
  if (resource) where.resource = resource;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
} 