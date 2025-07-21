import { PrismaClient, Prisma } from '@prisma/client';
import { performanceMonitor } from './performance';

// Database optimization configuration
interface DatabaseConfig {
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  slowQueryThreshold: number;
  enableQueryLogging: boolean;
  enablePerformanceMonitoring: boolean;
}

const config: DatabaseConfig = {
  maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
  connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000'),
  queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '30000'),
  slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'),
  enableQueryLogging: process.env.NODE_ENV === 'development',
  enablePerformanceMonitoring: process.env.ENABLE_DB_MONITORING === 'true'
};

// Enhanced Prisma client with performance monitoring
export class OptimizedPrismaClient extends PrismaClient {
  private queryCount = 0;
  private connectionPool: Set<string> = new Set();

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: config.enableQueryLogging 
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' }
          ]
        : ['error'],
    });

    this.setupEventListeners();
    this.setupQueryOptimization();
  }

  private setupEventListeners() {
    // Query performance monitoring
    this.$on('query', async (e: Prisma.QueryEvent) => {
      this.queryCount++;
      
      if (config.enablePerformanceMonitoring) {
        await performanceMonitor.recordDatabaseQueryTime(
          e.query,
          e.duration,
          this.extractTableFromQuery(e.query)
        );
      }

      // Log slow queries
      if (e.duration > config.slowQueryThreshold) {
        console.warn(`Slow query detected (${e.duration}ms):`, {
          query: e.query.substring(0, 200) + '...',
          params: e.params,
          duration: e.duration,
          target: e.target
        });
      }

      // Log query in development
      if (config.enableQueryLogging) {
        console.log(`Query: ${e.query} - Duration: ${e.duration}ms`);
      }
    });

    // Error monitoring
    this.$on('error', (e) => {
      console.error('Database error:', e);
      if (config.enablePerformanceMonitoring) {
        performanceMonitor.recordError(new Error(e.message));
      }
    });

    // Info and warnings
    this.$on('info', (e) => {
      console.info('Database info:', e);
    });

    this.$on('warn', (e) => {
      console.warn('Database warning:', e);
    });
  }

  private setupQueryOptimization() {
    // Add query optimization middleware
    this.$use(async (params, next) => {
      const start = Date.now();
      
      try {
        // Add common optimizations
        if (params.action === 'findMany' || params.action === 'findFirst') {
          // Limit large queries if no explicit limit
          if (!params.args?.take && !params.args?.skip) {
            params.args = { ...params.args, take: 1000 };
          }
        }

        const result = await next(params);
        const duration = Date.now() - start;

        // Track query performance
        if (config.enablePerformanceMonitoring) {
          await performanceMonitor.recordDatabaseQueryTime(
            `${params.model}.${params.action}`,
            duration,
            params.model
          );
        }

        return result;
      } catch (error) {
        const duration = Date.now() - start;
        
        if (config.enablePerformanceMonitoring) {
          await performanceMonitor.recordError(error as Error);
        }

        throw error;
      }
    });
  }

  private extractTableFromQuery(query: string): string {
    // Extract table name from SQL query
    const match = query.match(/FROM\s+"?(\w+)"?/i) || query.match(/UPDATE\s+"?(\w+)"?/i) || query.match(/INSERT\s+INTO\s+"?(\w+)"?/i);
    return match ? match[1] : 'unknown';
  }

  // Optimized bulk operations
  async bulkCreate<T>(model: any, data: T[], options: { batchSize?: number } = {}): Promise<void> {
    const batchSize = options.batchSize || 1000;
    const batches = this.chunkArray(data, batchSize);

    for (const batch of batches) {
      await model.createMany({
        data: batch,
        skipDuplicates: true
      });
    }
  }

  async bulkUpdate<T>(model: any, data: T[], keyField: keyof T, options: { batchSize?: number } = {}): Promise<void> {
    const batchSize = options.batchSize || 100;
    const batches = this.chunkArray(data, batchSize);

    for (const batch of batches) {
      const promises = batch.map(item =>
        model.update({
          where: { [keyField]: item[keyField] },
          data: item
        }).catch((error: Error) => {
          console.error(`Failed to update item with ${String(keyField)}: ${item[keyField]}`, error);
        })
      );

      await Promise.allSettled(promises);
    }
  }

  async bulkUpsert<T extends Record<string, any>>(
    model: any, 
    data: T[], 
    keyField: keyof T,
    options: { batchSize?: number } = {}
  ): Promise<void> {
    const batchSize = options.batchSize || 100;
    const batches = this.chunkArray(data, batchSize);

    for (const batch of batches) {
      const promises = batch.map(item =>
        model.upsert({
          where: { [keyField]: item[keyField] },
          update: item,
          create: item
        }).catch((error: Error) => {
          console.error(`Failed to upsert item with ${String(keyField)}: ${item[keyField]}`, error);
        })
      );

      await Promise.allSettled(promises);
    }
  }

  // Optimized aggregation queries
  async aggregateWithCache<T>(
    model: any,
    aggregation: any,
    cacheKey: string,
    cacheTTL: number = 300
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    const result = await model.aggregate(aggregation);
    
    // Cache the result
    await this.setCache(cacheKey, result, cacheTTL);
    
    return result;
  }

  // Connection management
  async getConnectionInfo(): Promise<{
    activeConnections: number;
    maxConnections: number;
    queryCount: number;
    uptime: number;
  }> {
    try {
      const result = await this.$queryRaw<Array<{ count: BigInt }>>`
        SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
      `;
      
      const maxConnResult = await this.$queryRaw<Array<{ setting: string }>>`
        SHOW max_connections
      `;

      return {
        activeConnections: Number(result[0]?.count || 0),
        maxConnections: parseInt(maxConnResult[0]?.setting || '100'),
        queryCount: this.queryCount,
        uptime: process.uptime()
      };
    } catch (error) {
      console.error('Failed to get connection info:', error);
      return {
        activeConnections: 0,
        maxConnections: config.maxConnections,
        queryCount: this.queryCount,
        uptime: process.uptime()
      };
    }
  }

  // Database health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, { status: 'pass' | 'fail'; message?: string; duration?: number }>;
  }> {
    const checks: Record<string, { status: 'pass' | 'fail'; message?: string; duration?: number }> = {};
    
    // Connection test
    try {
      const start = Date.now();
      await this.$queryRaw`SELECT 1`;
      checks.connection = { 
        status: 'pass', 
        duration: Date.now() - start 
      };
    } catch (error) {
      checks.connection = { 
        status: 'fail', 
        message: (error as Error).message 
      };
    }

    // Query performance test
    try {
      const start = Date.now();
      await this.user.count();
      const duration = Date.now() - start;
      checks.queryPerformance = {
        status: duration < 1000 ? 'pass' : 'fail',
        duration,
        message: duration >= 1000 ? 'Slow query performance' : undefined
      };
    } catch (error) {
      checks.queryPerformance = {
        status: 'fail',
        message: (error as Error).message
      };
    }

    // Connection pool check
    try {
      const connInfo = await this.getConnectionInfo();
      const connectionRatio = connInfo.activeConnections / connInfo.maxConnections;
      checks.connectionPool = {
        status: connectionRatio < 0.8 ? 'pass' : 'fail',
        message: connectionRatio >= 0.8 ? 'High connection usage' : undefined
      };
    } catch (error) {
      checks.connectionPool = {
        status: 'fail',
        message: (error as Error).message
      };
    }

    // Determine overall status
    const failedChecks = Object.values(checks).filter(check => check.status === 'fail').length;
    const status = failedChecks === 0 ? 'healthy' : failedChecks <= 1 ? 'degraded' : 'unhealthy';

    return { status, checks };
  }

  // Index recommendations
  async getIndexRecommendations(): Promise<Array<{
    table: string;
    columns: string[];
    reason: string;
    impact: 'high' | 'medium' | 'low';
  }>> {
    try {
      // Query for missing indexes based on slow queries
      const slowQueries = await this.$queryRaw<Array<{
        query: string;
        calls: number;
        total_time: number;
        mean_time: number;
      }>>`
        SELECT query, calls, total_time, mean_time
        FROM pg_stat_statements 
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10
      `;

      const recommendations: Array<{
        table: string;
        columns: string[];
        reason: string;
        impact: 'high' | 'medium' | 'low';
      }> = [];

      // Analyze queries for index opportunities
      for (const query of slowQueries) {
        const analysis = this.analyzeQueryForIndexes(query.query);
        if (analysis) {
          recommendations.push({
            ...analysis,
            reason: `Slow query detected (${query.mean_time.toFixed(2)}ms avg)`,
            impact: query.mean_time > 1000 ? 'high' : query.mean_time > 500 ? 'medium' : 'low'
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Failed to get index recommendations:', error);
      return [];
    }
  }

  private analyzeQueryForIndexes(query: string): { table: string; columns: string[] } | null {
    // Simple query analysis for index recommendations
    const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+GROUP\s+BY|\s+LIMIT|\s*$)/i);
    const tableMatch = query.match(/FROM\s+"?(\w+)"?/i);
    
    if (!whereMatch || !tableMatch) return null;

    const table = tableMatch[1];
    const whereClause = whereMatch[1];
    
    // Extract column names from WHERE clause
    const columnMatches = whereClause.match(/"?(\w+)"?\s*[=<>]/g);
    if (!columnMatches) return null;

    const columns = columnMatches.map(match => {
      const colMatch = match.match(/"?(\w+)"?/);
      return colMatch ? colMatch[1] : null;
    }).filter(Boolean) as string[];

    return columns.length > 0 ? { table, columns } : null;
  }

  // Utility methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async getFromCache(key: string): Promise<any> {
    // Implement cache retrieval (Redis, memory cache, etc.)
    // This is a placeholder - integrate with your caching system
    return null;
  }

  private async setCache(key: string, value: any, ttl: number): Promise<void> {
    // Implement cache storage
    // This is a placeholder - integrate with your caching system
  }

  // Cleanup and connection management
  async gracefulShutdown(): Promise<void> {
    console.log('Shutting down database connections...');
    await this.$disconnect();
    console.log('Database connections closed.');
  }
}

// Database query builder helpers
export class QueryBuilder {
  static buildPaginatedQuery<T>(
    baseQuery: any,
    page: number = 1,
    limit: number = 10,
    orderBy?: { field: string; direction: 'asc' | 'desc' }
  ) {
    const skip = (page - 1) * limit;
    
    let query = {
      ...baseQuery,
      skip,
      take: limit
    };

    if (orderBy) {
      query = {
        ...query,
        orderBy: {
          [orderBy.field]: orderBy.direction
        }
      };
    }

    return query;
  }

  static buildSearchQuery(
    searchTerm: string,
    searchFields: string[]
  ): any {
    if (!searchTerm || searchFields.length === 0) {
      return {};
    }

    const searchConditions = searchFields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const
      }
    }));

    return {
      OR: searchConditions
    };
  }

  static buildDateRangeQuery(
    field: string,
    startDate?: Date,
    endDate?: Date
  ): any {
    const conditions: any = {};

    if (startDate) {
      conditions.gte = startDate;
    }

    if (endDate) {
      conditions.lte = endDate;
    }

    return Object.keys(conditions).length > 0 ? { [field]: conditions } : {};
  }

  static combineQueries(...queries: any[]): any {
    const validQueries = queries.filter(q => q && Object.keys(q).length > 0);
    
    if (validQueries.length === 0) return {};
    if (validQueries.length === 1) return validQueries[0];

    return {
      AND: validQueries
    };
  }
}

// Database performance metrics
export class DatabaseMetrics {
  private static metrics: Map<string, number[]> = new Map();

  static recordQueryTime(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const times = this.metrics.get(operation)!;
    times.push(duration);
    
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }
  }

  static getMetrics(operation?: string): Record<string, {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  }> {
    const result: any = {};
    
    const operations = operation ? [operation] : Array.from(this.metrics.keys());
    
    for (const op of operations) {
      const times = this.metrics.get(op) || [];
      if (times.length === 0) continue;

      const sorted = [...times].sort((a, b) => a - b);
      const sum = times.reduce((a, b) => a + b, 0);
      
      result[op] = {
        count: times.length,
        average: sum / times.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1]
      };
    }
    
    return result;
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

// Export optimized client instance
export const db = new OptimizedPrismaClient();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await db.gracefulShutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await db.gracefulShutdown();
  process.exit(0);
});

// Database utilities
export const DatabaseUtils = {
  // Connection health monitoring
  async monitorConnections(): Promise<void> {
    setInterval(async () => {
      try {
        const health = await db.healthCheck();
        const connInfo = await db.getConnectionInfo();
        
        console.log('Database Health:', {
          status: health.status,
          activeConnections: connInfo.activeConnections,
          queryCount: connInfo.queryCount
        });

        if (health.status === 'unhealthy') {
          console.error('Database is unhealthy:', health.checks);
        }
      } catch (error) {
        console.error('Failed to monitor database:', error);
      }
    }, 60000); // Check every minute
  },

  // Query optimization suggestions
  async optimizeQueries(): Promise<void> {
    try {
      const recommendations = await db.getIndexRecommendations();
      
      if (recommendations.length > 0) {
        console.log('Index recommendations:', recommendations);
      }
    } catch (error) {
      console.error('Failed to get optimization recommendations:', error);
    }
  },

  // Database maintenance
  async performMaintenance(): Promise<void> {
    try {
      // Analyze tables for optimization
      await db.$executeRaw`ANALYZE`;
      
      // Update table statistics
      await db.$executeRaw`VACUUM ANALYZE`;
      
      console.log('Database maintenance completed');
    } catch (error) {
      console.error('Database maintenance failed:', error);
    }
  }
}; 