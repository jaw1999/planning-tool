import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Performance metrics interfaces
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: Record<string, any>;
  tags?: string[];
}

export interface PerformanceAlert {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface PerformanceReport {
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    apiResponseTime: {
      average: number;
      p95: number;
      p99: number;
      min: number;
      max: number;
    };
    databaseQueryTime: {
      average: number;
      p95: number;
      p99: number;
      slowestQueries: Array<{
        query: string;
        duration: number;
        timestamp: Date;
      }>;
    };
    memoryUsage: {
      average: number;
      peak: number;
      current: number;
    };
    errorRate: {
      total: number;
      rate: number;
      by_endpoint: Record<string, number>;
    };
    userSessions: {
      active: number;
      peak: number;
      average_duration: number;
    };
  };
  alerts: Array<{
    metric: string;
    value: number;
    threshold: number;
    severity: string;
    timestamp: Date;
  }>;
}

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private collectors: Map<string, () => Promise<number>> = new Map();

  constructor() {
    this.setupDefaultCollectors();
    this.setupDefaultAlerts();
  }

  // Add a custom metric
  async recordMetric(name: string, value: number, unit: string = 'ms', context?: Record<string, any>, tags?: string[]) {
    const metric: PerformanceMetric = {
      id: crypto.randomUUID(),
      name,
      value,
      unit,
      timestamp: new Date(),
      context,
      tags
    };

    this.metrics.push(metric);

    // Store in database for persistence
    try {
      await prisma.performanceMetric.create({
        data: {
          name: metric.name,
          value: metric.value,
          unit: metric.unit,
          timestamp: metric.timestamp,
          context: metric.context ? JSON.stringify(metric.context) : null,
          tags: metric.tags || []
        }
      });
    } catch (error) {
      console.error('Failed to store performance metric:', error);
    }

    // Check alerts
    await this.checkAlerts(metric);
  }

  // Record API response time
  async recordApiResponseTime(endpoint: string, method: string, duration: number, statusCode: number) {
    await this.recordMetric(
      'api_response_time',
      duration,
      'ms',
      { endpoint, method, statusCode },
      ['api', 'response_time']
    );
  }

  // Record database query time
  async recordDatabaseQueryTime(query: string, duration: number, table?: string) {
    await this.recordMetric(
      'database_query_time',
      duration,
      'ms',
      { query: query.substring(0, 100), table }, // Truncate query for storage
      ['database', 'query_time']
    );
  }

  // Record memory usage
  async recordMemoryUsage() {
    const memUsage = process.memoryUsage();
    await this.recordMetric(
      'memory_usage_heap',
      memUsage.heapUsed / 1024 / 1024, // Convert to MB
      'MB',
      { 
        heapTotal: memUsage.heapTotal / 1024 / 1024,
        external: memUsage.external / 1024 / 1024,
        rss: memUsage.rss / 1024 / 1024
      },
      ['memory', 'heap']
    );
  }

  // Record error occurrence
  async recordError(error: Error, endpoint?: string, userId?: string) {
    await this.recordMetric(
      'error_count',
      1,
      'count',
      { 
        error: error.message,
        stack: error.stack?.substring(0, 500),
        endpoint,
        userId
      },
      ['error']
    );
  }

  // Record user session metrics
  async recordUserSession(action: 'start' | 'end', userId: string, duration?: number) {
    await this.recordMetric(
      `user_session_${action}`,
      duration || 1,
      action === 'end' ? 'seconds' : 'count',
      { userId },
      ['user', 'session']
    );
  }

  // Set up default metric collectors
  private setupDefaultCollectors() {
    // Memory usage collector
    this.collectors.set('memory', async () => {
      const memUsage = process.memoryUsage();
      return memUsage.heapUsed / 1024 / 1024; // MB
    });

    // CPU usage collector (simplified)
    this.collectors.set('cpu', async () => {
      const usage = process.cpuUsage();
      return (usage.user + usage.system) / 1000; // microseconds to milliseconds
    });

    // Active database connections
    this.collectors.set('db_connections', async () => {
      try {
        const result = await prisma.$queryRaw<[{count: BigInt}]>`
          SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
        `;
        return Number(result[0].count);
      } catch {
        return 0;
      }
    });
  }

  // Set up default alerts
  private setupDefaultAlerts() {
    this.alerts = [
      {
        metric: 'api_response_time',
        threshold: 2000, // 2 seconds
        operator: 'gt',
        severity: 'medium',
        enabled: true
      },
      {
        metric: 'database_query_time',
        threshold: 5000, // 5 seconds
        operator: 'gt',
        severity: 'high',
        enabled: true
      },
      {
        metric: 'memory_usage_heap',
        threshold: 1024, // 1GB
        operator: 'gt',
        severity: 'high',
        enabled: true
      },
      {
        metric: 'error_count',
        threshold: 10, // 10 errors per minute
        operator: 'gt',
        severity: 'critical',
        enabled: true
      }
    ];
  }

  // Check if any alerts should be triggered
  private async checkAlerts(metric: PerformanceMetric) {
    const relevantAlerts = this.alerts.filter(
      alert => alert.enabled && alert.metric === metric.name
    );

    for (const alert of relevantAlerts) {
      let triggered = false;

      switch (alert.operator) {
        case 'gt':
          triggered = metric.value > alert.threshold;
          break;
        case 'lt':
          triggered = metric.value < alert.threshold;
          break;
        case 'eq':
          triggered = metric.value === alert.threshold;
          break;
      }

      if (triggered) {
        await this.triggerAlert(alert, metric);
      }
    }
  }

  // Trigger an alert
  private async triggerAlert(alert: PerformanceAlert, metric: PerformanceMetric) {
    console.warn(`Performance Alert [${alert.severity.toUpperCase()}]: ${alert.metric} = ${metric.value} (threshold: ${alert.threshold})`);

    try {
      await prisma.performanceAlert.create({
        data: {
          metricName: alert.metric,
          value: metric.value,
          threshold: alert.threshold,
          severity: alert.severity,
          triggered: true,
          context: metric.context ? JSON.stringify(metric.context) : null
        }
      });

      // Send notification based on severity
      if (alert.severity === 'critical') {
        await this.sendCriticalAlert(alert, metric);
      }
    } catch (error) {
      console.error('Failed to store performance alert:', error);
    }
  }

  // Send critical alert notifications
  private async sendCriticalAlert(alert: PerformanceAlert, metric: PerformanceMetric) {
    // In a real application, this would send emails, Slack messages, etc.
    console.error(`CRITICAL ALERT: ${alert.metric} exceeded threshold!`, {
      value: metric.value,
      threshold: alert.threshold,
      timestamp: metric.timestamp,
      context: metric.context
    });

    // Could integrate with external services like:
    // - Email notifications
    // - Slack/Teams webhooks
    // - PagerDuty
    // - Custom webhook endpoints
  }

  // Generate performance report
  async generateReport(startDate: Date, endDate: Date): Promise<PerformanceReport> {
    try {
      const metrics = await prisma.performanceMetric.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      const alerts = await prisma.performanceAlert.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      return {
        timeRange: { start: startDate, end: endDate },
        metrics: {
          apiResponseTime: this.calculateStats(
            metrics.filter(m => m.name === 'api_response_time').map(m => m.value)
          ),
          databaseQueryTime: {
            ...this.calculateStats(
              metrics.filter(m => m.name === 'database_query_time').map(m => m.value)
            ),
            slowestQueries: metrics
              .filter(m => m.name === 'database_query_time')
              .sort((a, b) => b.value - a.value)
              .slice(0, 10)
              .map(m => ({
                query: m.context ? JSON.parse(m.context).query : 'Unknown',
                duration: m.value,
                timestamp: m.timestamp
              }))
          },
          memoryUsage: {
            ...this.calculateStats(
              metrics.filter(m => m.name === 'memory_usage_heap').map(m => m.value)
            ),
            current: await this.collectors.get('memory')?.() || 0
          },
          errorRate: {
            total: metrics.filter(m => m.name === 'error_count').length,
            rate: this.calculateErrorRate(metrics, startDate, endDate),
            by_endpoint: this.groupErrorsByEndpoint(metrics)
          },
          userSessions: this.calculateUserSessionStats(metrics)
        },
        alerts: alerts.map(alert => ({
          metric: alert.metricName,
          value: alert.value,
          threshold: alert.threshold,
          severity: alert.severity,
          timestamp: alert.createdAt
        }))
      };
    } catch (error) {
      console.error('Failed to generate performance report:', error);
      throw error;
    }
  }

  // Calculate statistical metrics
  private calculateStats(values: number[]) {
    if (values.length === 0) {
      return { average: 0, p95: 0, p99: 0, min: 0, max: 0 };
    }

    const sorted = values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      average: sum / values.length,
      p95: sorted[Math.floor(values.length * 0.95)] || 0,
      p99: sorted[Math.floor(values.length * 0.99)] || 0,
      min: sorted[0],
      max: sorted[sorted.length - 1]
    };
  }

  // Calculate error rate
  private calculateErrorRate(metrics: any[], startDate: Date, endDate: Date): number {
    const errors = metrics.filter(m => m.name === 'error_count');
    const totalRequests = metrics.filter(m => m.name === 'api_response_time');
    
    if (totalRequests.length === 0) return 0;
    return (errors.length / totalRequests.length) * 100;
  }

  // Group errors by endpoint
  private groupErrorsByEndpoint(metrics: any[]): Record<string, number> {
    const errorsByEndpoint: Record<string, number> = {};
    
    metrics
      .filter(m => m.name === 'error_count')
      .forEach(metric => {
        const context = metric.context ? JSON.parse(metric.context) : {};
        const endpoint = context.endpoint || 'unknown';
        errorsByEndpoint[endpoint] = (errorsByEndpoint[endpoint] || 0) + 1;
      });

    return errorsByEndpoint;
  }

  // Calculate user session statistics
  private calculateUserSessionStats(metrics: any[]) {
    const sessionStarts = metrics.filter(m => m.name === 'user_session_start');
    const sessionEnds = metrics.filter(m => m.name === 'user_session_end');
    
    const durations = sessionEnds.map(m => m.value);
    const averageDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    return {
      active: sessionStarts.length - sessionEnds.length,
      peak: Math.max(sessionStarts.length, 0),
      average_duration: averageDuration
    };
  }

  // Start automatic metric collection
  startAutomaticCollection(intervalMs: number = 60000) { // Default: 1 minute
    setInterval(async () => {
      try {
        // Collect memory usage
        await this.recordMemoryUsage();

        // Collect custom metrics
        for (const [name, collector] of this.collectors) {
          try {
            const value = await collector();
            await this.recordMetric(name, value, 'count', {}, ['auto_collected']);
          } catch (error) {
            console.error(`Failed to collect metric ${name}:`, error);
          }
        }
      } catch (error) {
        console.error('Failed to collect automatic metrics:', error);
      }
    }, intervalMs);
  }

  // Clean up old metrics (retention policy)
  async cleanupOldMetrics(retentionDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      await prisma.performanceMetric.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      await prisma.performanceAlert.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      console.log(`Cleaned up performance metrics older than ${retentionDays} days`);
    } catch (error) {
      console.error('Failed to cleanup old metrics:', error);
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Middleware for automatic API performance tracking
export function withPerformanceTracking(handler: Function) {
  return async (req: any, res: any, ...args: any[]) => {
    const start = Date.now();
    const endpoint = req.url;
    const method = req.method;
    
    try {
      const result = await handler(req, res, ...args);
      const duration = Date.now() - start;
      
      await performanceMonitor.recordApiResponseTime(
        endpoint,
        method,
        duration,
        res.status || 200
      );
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      await performanceMonitor.recordApiResponseTime(
        endpoint,
        method,
        duration,
        500
      );
      
      await performanceMonitor.recordError(error as Error, endpoint);
      throw error;
    }
  };
} 