import { NextResponse } from 'next/server';
import { withSecurity } from '@/app/api/auth/middleware';
import { AuditAction, AuditResource, auditSystemAction } from '@/app/lib/utils/audit';

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  errorId?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

// In production, you'd want to store these in a database or send to an error tracking service
const errorLogs: ErrorReport[] = [];

async function handleErrorReport(request: Request) {
  try {
    const errorReport: ErrorReport = await request.json();
    
    // Validate required fields
    if (!errorReport.message || !errorReport.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: message, timestamp' },
        { status: 400 }
      );
    }

    // Add server timestamp
    const serverTimestamp = new Date().toISOString();
    
    // Store error (in production, save to database or send to error service)
    const enrichedError = {
      ...errorReport,
      serverTimestamp,
      severity: getSeverity(errorReport.message),
    };
    
    errorLogs.push(enrichedError);
    
    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Client Error Report:', enrichedError);
    }
    
    // Audit the error
    await auditSystemAction(
      AuditAction.CREATE,
      AuditResource.SYSTEM,
      {
        type: 'client_error',
        errorId: errorReport.errorId,
        message: errorReport.message,
        url: errorReport.url,
      },
      request as any
    );

    // In production, you might want to:
    // 1. Send to error tracking service (Sentry, Bugsnag, etc.)
    // 2. Save to database
    // 3. Send alerts for critical errors
    // 4. Generate error tickets for development team
    
    return NextResponse.json({ 
      success: true, 
      errorId: errorReport.errorId || generateErrorId() 
    });
    
  } catch (error) {
    console.error('Failed to process error report:', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

async function getErrorLogs(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const severity = url.searchParams.get('severity');
    
    let filtered = errorLogs;
    
    // Filter by severity if specified
    if (severity) {
      filtered = errorLogs.filter(log => log.severity === severity);
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filtered.slice(startIndex, endIndex);
    
    return NextResponse.json({
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    });
    
  } catch (error) {
    console.error('Failed to get error logs:', error);
    return NextResponse.json(
      { error: 'Failed to get error logs' },
      { status: 500 }
    );
  }
}

function getSeverity(message: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('network') || lowerMessage.includes('timeout')) {
    return 'medium';
  }
  
  if (lowerMessage.includes('chunk') || lowerMessage.includes('loading')) {
    return 'low';
  }
  
  if (lowerMessage.includes('cannot read') || lowerMessage.includes('undefined')) {
    return 'high';
  }
  
  if (lowerMessage.includes('critical') || lowerMessage.includes('security')) {
    return 'critical';
  }
  
  return 'medium';
}

function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Apply security middleware
export const POST = withSecurity(handleErrorReport, {
  requireAuth: false, // Allow anonymous error reporting
  rateLimit: { requests: 10, windowMs: 60000 }, // 10 requests per minute
});

export const GET = withSecurity(getErrorLogs, {
  requireAuth: true,
  roles: ['ADMIN'], // Only admins can view error logs
  rateLimit: { requests: 30, windowMs: 60000 },
}); 