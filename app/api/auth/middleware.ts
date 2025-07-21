import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { auditUserAction, AuditAction, AuditResource } from '@/app/lib/utils/audit';

interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export function withSecurity(handler: Function, options?: {
  requireAuth?: boolean;
  roles?: string[];
  rateLimit?: { requests: number; windowMs: number };
  auditAction?: { action: AuditAction; resource: AuditResource };
}) {
  return async (request: NextRequest, context: any) => {
    const startTime = Date.now();
    
    try {
      // Add security headers
      const response = new NextResponse();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Rate limiting
      if (options?.rateLimit) {
        const clientId = getClientId(request);
        const isRateLimited = checkRateLimit(clientId, options.rateLimit);
        
        if (isRateLimited) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429, headers: securityHeaders }
          );
        }
      }

      // CSRF protection for state-changing methods
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const origin = request.headers.get('origin');
        const referer = request.headers.get('referer');
        const host = request.headers.get('host');
        
        if (!isValidOrigin(origin, referer, host)) {
          return NextResponse.json(
            { error: 'Invalid origin. Possible CSRF attack detected.' },
            { status: 403, headers: securityHeaders }
          );
        }
      }

      // Authentication
      let user: any = null;
      if (options?.requireAuth !== false) {
        const authResult = await authenticateRequest(request);
        if (!authResult.success) {
          return NextResponse.json(
            { error: authResult.error },
            { status: 401, headers: securityHeaders }
          );
        }
        user = authResult.user;
      }

      // Authorization
      if (options?.roles && user) {
        if (!options.roles.includes(user.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403, headers: securityHeaders }
          );
        }
      }

      // Add user to request
      (request as AuthenticatedRequest).user = user;

      // Execute handler
      const result = await handler(request, context);
      
      // Audit logging
      if (options?.auditAction && user) {
        const duration = Date.now() - startTime;
        await auditUserAction(
          user.id,
          options.auditAction.action,
          options.auditAction.resource,
          context?.params?.id,
          {
            method: request.method,
            url: request.url,
            duration,
            status: 'success'
          },
          request
        );
      }

      // Add security headers to response
      if (result instanceof NextResponse) {
        Object.entries(securityHeaders).forEach(([key, value]) => {
          result.headers.set(key, value);
        });
      }

      return result;
      
    } catch (error) {
      // Audit failed requests
      if (options?.auditAction && (request as AuthenticatedRequest).user) {
        const duration = Date.now() - startTime;
        await auditUserAction(
          (request as AuthenticatedRequest).user!.id,
          options.auditAction.action,
          options.auditAction.resource,
          context?.params?.id,
          {
            method: request.method,
            url: request.url,
            duration,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          request
        );
      }

      console.error('API Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500, headers: securityHeaders }
      );
    }
  };
}

function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  return `${ip}:${userAgent}`;
}

function checkRateLimit(
  clientId: string, 
  limit: { requests: number; windowMs: number }
): boolean {
  const now = Date.now();
  const windowStart = now - limit.windowMs;
  
  const current = rateLimitStore.get(clientId);
  
  if (!current || current.resetTime < windowStart) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now });
    return false;
  }
  
  if (current.count >= limit.requests) {
    return true;
  }
  
  rateLimitStore.set(clientId, { count: current.count + 1, resetTime: current.resetTime });
  return false;
}

function isValidOrigin(origin: string | null, referer: string | null, host: string | null): boolean {
  // In development, be more permissive
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    `https://${host}`,
    `http://${host}`, // For local development
  ].filter(Boolean);
  
  // Check origin header
  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check referer header as fallback
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      return allowedOrigins.includes(refererOrigin);
    } catch {
      return false;
    }
  }
  
  return false;
}

async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get('authorization');
    let token: string | undefined;
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback to cookie
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const authCookie = cookies
          .split(';')
          .find(c => c.trim().startsWith('auth-token='));
        if (authCookie) {
          token = authCookie.split('=')[1];
        }
      }
    }
    
    if (!token) {
      return { success: false, error: 'No authentication token provided' };
    }
    
    // Verify token
    const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    if (!decoded?.userId) {
      return { success: false, error: 'Invalid token' };
    }
    
    // In a real app, you'd fetch user from database here
    // For now, we'll use the token data
    return {
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    };
    
  } catch (error) {
    return { success: false, error: 'Invalid or expired token' };
  }
}

// Input sanitization middleware
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
}

// Content Security Policy
export function withCSP(response: NextResponse) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  return response;
} 