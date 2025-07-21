import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '../utils/performance';
import { cache } from '../utils/cache';
import { notificationService } from '../utils/notifications';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface MiddlewareConfig {
  enablePerformanceTracking: boolean;
  enableRateLimit: boolean;
  enableCaching: boolean;
  enableAuth: boolean;
  rateLimitConfig: RateLimitConfig;
  cacheTTL: number;
}

const defaultConfig: MiddlewareConfig = {
  enablePerformanceTracking: true,
  enableRateLimit: true,
  enableCaching: false,
  enableAuth: true,
  rateLimitConfig: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  cacheTTL: 300 // 5 minutes
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function withAPIMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: Partial<MiddlewareConfig> = {}
) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const endpoint = req.nextUrl.pathname;
    const method = req.method;
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    
    try {
      // 1. Rate Limiting
      if (finalConfig.enableRateLimit) {
        const rateLimitResult = await applyRateLimit(ip, finalConfig.rateLimitConfig);
        if (!rateLimitResult.allowed) {
          return new NextResponse(
            JSON.stringify({ 
              error: 'Rate limit exceeded',
              retryAfter: rateLimitResult.retryAfter 
            }),
            { 
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': rateLimitResult.retryAfter.toString(),
                'X-RateLimit-Limit': finalConfig.rateLimitConfig.maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
              }
            }
          );
        }
      }

      // 2. Authentication Check
      if (finalConfig.enableAuth && requiresAuth(endpoint)) {
        const authResult = await validateAuth(req);
        if (!authResult.valid) {
          return new NextResponse(
            JSON.stringify({ error: 'Unauthorized', message: authResult.message }),
            { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        
        // Add user context to request
        (req as any).user = authResult.user;
      }

      // 3. Caching Check (for GET requests)
      if (finalConfig.enableCaching && method === 'GET') {
        const cacheKey = generateCacheKey(req);
        const cachedResponse = await cache.get(cacheKey);
        
        if (cachedResponse) {
          const response = new NextResponse(cachedResponse.body, {
            status: cachedResponse.status,
            headers: {
              ...cachedResponse.headers,
              'X-Cache': 'HIT',
              'X-Cache-Key': cacheKey
            }
          });
          
          // Record cache hit
          if (finalConfig.enablePerformanceTracking) {
            await performanceMonitor.recordApiResponseTime(
              endpoint,
              method,
              Date.now() - startTime,
              cachedResponse.status
            );
          }
          
          return response;
        }
      }

      // 4. Execute the actual handler
      let response = await handler(req);
      const duration = Date.now() - startTime;

      // 5. Cache successful GET responses
      if (finalConfig.enableCaching && method === 'GET' && response.status < 400) {
        const cacheKey = generateCacheKey(req);
        const responseBody = await response.text();
        
        await cache.set(cacheKey, {
          body: responseBody,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }, { ttl: finalConfig.cacheTTL });

        // Return new response with cached body
        const newResponse = new NextResponse(responseBody, {
          status: response.status,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            'X-Cache': 'MISS'
          }
        });
        response = newResponse;
      }

      // 6. Performance Tracking
      if (finalConfig.enablePerformanceTracking) {
        await performanceMonitor.recordApiResponseTime(
          endpoint,
          method,
          duration,
          response.status
        );

        // Record slow API warnings
        if (duration > 5000) { // 5 seconds
          console.warn(`Slow API response detected: ${method} ${endpoint} - ${duration}ms`);
          
          // Send notification for critical slowness
          if (duration > 10000) { // 10 seconds
            await notificationService.createNotification(
              'admin-user-id', // Replace with actual admin user ID
              'system_update',
              {
                alertType: 'Slow API Response',
                endpoint,
                method,
                duration: `${duration}ms`,
                description: `API endpoint ${method} ${endpoint} took ${duration}ms to respond`
              },
              { priority: 'high' }
            );
          }
        }
      }

      // 7. Add standard headers
      response.headers.set('X-Response-Time', `${duration}ms`);
      response.headers.set('X-Request-ID', generateRequestId());
      response.headers.set('X-API-Version', '1.0');

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record error
      if (finalConfig.enablePerformanceTracking) {
        await performanceMonitor.recordError(error as Error, endpoint);
        await performanceMonitor.recordApiResponseTime(endpoint, method, duration, 500);
      }

      console.error(`API Error in ${method} ${endpoint}:`, error);

      // Send error notification for critical endpoints
      if (isCriticalEndpoint(endpoint)) {
        await notificationService.createNotification(
          'admin-user-id', // Replace with actual admin user ID
          'system_update',
          {
            alertType: 'API Error',
            endpoint,
            method,
            error: (error as Error).message,
            description: `Critical API endpoint ${method} ${endpoint} encountered an error`
          },
          { priority: 'critical' }
        );
      }

      return new NextResponse(
        JSON.stringify({ 
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong',
          requestId: generateRequestId(),
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'X-Response-Time': `${duration}ms`
          }
        }
      );
    }
  };
}

// Rate limiting implementation
async function applyRateLimit(
  identifier: string, 
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfter: number; resetTime: number }> {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  
  // Clean up expired entries
  if (rateLimitStore.has(key)) {
    const entry = rateLimitStore.get(key)!;
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  const entry = rateLimitStore.get(key) || { 
    count: 0, 
    resetTime: now + config.windowMs 
  };

  entry.count++;
  rateLimitStore.set(key, entry);

  const allowed = entry.count <= config.maxRequests;
  const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

  return {
    allowed,
    retryAfter: allowed ? 0 : retryAfter,
    resetTime: entry.resetTime
  };
}

// Authentication validation
async function validateAuth(req: NextRequest): Promise<{
  valid: boolean;
  user?: any;
  message?: string;
}> {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
                 req.cookies.get('auth-token')?.value;

    if (!token) {
      return { valid: false, message: 'No authentication token provided' };
    }

    // Verify JWT token
    // This is a placeholder - integrate with your actual auth system
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // const user = await getUserById(decoded.userId);

    const user = { id: 'user-id', role: 'USER' }; // Placeholder

    if (!user) {
      return { valid: false, message: 'User not found' };
    }

    return { valid: true, user };
  } catch (error) {
    return { valid: false, message: 'Invalid or expired token' };
  }
}

// Cache key generation
function generateCacheKey(req: NextRequest): string {
  const url = req.nextUrl.pathname;
  const params = req.nextUrl.searchParams.toString();
  const userRole = (req as any).user?.role || 'anonymous';
  
  return `api:${url}:${params}:${userRole}`;
}

// Request ID generation
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Check if endpoint requires authentication
function requiresAuth(endpoint: string): boolean {
  const publicEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/system/health-check'
  ];
  
  return !publicEndpoints.some(pub => endpoint.startsWith(pub));
}

// Check if endpoint is critical
function isCriticalEndpoint(endpoint: string): boolean {
  const criticalEndpoints = [
    '/api/auth',
    '/api/database',
    '/api/users',
    '/api/exercises'
  ];
  
  return criticalEndpoints.some(critical => endpoint.startsWith(critical));
}

// Middleware factory for specific use cases
export const createAPIMiddleware = {
  // High-performance middleware for frequently accessed endpoints
  highPerformance: (handler: any) => withAPIMiddleware(handler, {
    enableCaching: true,
    cacheTTL: 60, // 1 minute
    rateLimitConfig: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 200
    }
  }),

  // Secure middleware for sensitive endpoints
  secure: (handler: any) => withAPIMiddleware(handler, {
    enableAuth: true,
    enableRateLimit: true,
    rateLimitConfig: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50
    }
  }),

  // Public middleware for open endpoints
  public: (handler: any) => withAPIMiddleware(handler, {
    enableAuth: false,
    enableCaching: true,
    rateLimitConfig: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 500
    }
  }),

  // Admin middleware for administrative endpoints
  admin: (handler: any) => withAPIMiddleware(handler, {
    enableAuth: true,
    enablePerformanceTracking: true,
    rateLimitConfig: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30
    }
  })
};

// Request logging middleware
export function withRequestLogging(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const method = req.method;
    const url = req.nextUrl.pathname;
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';

    console.log(`[${requestId}] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`);

    try {
      const response = await handler(req);
      const duration = Date.now() - startTime;
      
      console.log(`[${requestId}] ${method} ${url} - ${response.status} - ${duration}ms`);
      
      response.headers.set('X-Request-ID', requestId);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] ${method} ${url} - ERROR - ${duration}ms:`, error);
      throw error;
    }
  };
}

// Health check middleware
export function withHealthCheck(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Health check endpoint
    if (req.nextUrl.pathname === '/api/health') {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      };

      return new NextResponse(JSON.stringify(health), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return handler(req);
  };
} 