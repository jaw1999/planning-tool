import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Redis connection (fallback to memory cache if Redis not available)
let redis: Redis | null = null;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  redis.on('error', (err) => {
    console.warn('Redis connection error, falling back to memory cache:', err);
    redis = null;
  });
} catch (error) {
  console.warn('Redis not available, using memory cache only');
}

// In-memory cache fallback
const memoryCache = new Map<string, { value: any; expires: number; tags: string[] }>();

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
  compress?: boolean; // Compress large values
  serialize?: boolean; // Custom serialization
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
}

export class AdvancedCache {
  private hitCount = 0;
  private missCount = 0;
  private compressionThreshold = 1024; // Compress if value > 1KB

  constructor() {
    // Start cleanup interval for memory cache
    setInterval(() => this.cleanupExpiredMemoryCache(), 60000); // Every minute
  }

  // Get value from cache
  async get<T>(key: string): Promise<T | null> {
    try {
      let value: string | null = null;
      let isCompressed = false;

      if (redis) {
        // Try Redis first
        const cachedValue = await redis.get(key);
        if (cachedValue) {
          value = cachedValue;
          // Check if value is compressed
          if (cachedValue.startsWith('gzip:')) {
            isCompressed = true;
            value = cachedValue.substring(5);
          }
        }
      } else {
        // Fallback to memory cache
        const cached = memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          value = JSON.stringify(cached.value);
        } else if (cached) {
          // Remove expired entry
          memoryCache.delete(key);
        }
      }

      if (value) {
        this.hitCount++;
        let parsedValue = JSON.parse(value);
        
        // Decompress if needed
        if (isCompressed) {
          parsedValue = await this.decompress(parsedValue);
        }
        
        return parsedValue;
      } else {
        this.missCount++;
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      this.missCount++;
      return null;
    }
  }

  // Set value in cache
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    try {
      const { ttl = 3600, tags = [], compress = true } = options; // Default 1 hour TTL
      
      let serializedValue = JSON.stringify(value);
      let finalValue = serializedValue;
      let isCompressed = false;

      // Compress large values
      if (compress && serializedValue.length > this.compressionThreshold) {
        finalValue = await this.compress(serializedValue);
        isCompressed = true;
      }

      if (redis) {
        // Store in Redis
        const key_with_prefix = isCompressed ? `gzip:${finalValue}` : finalValue;
        await redis.setex(key, ttl, key_with_prefix);
        
        // Store tags for invalidation
        if (tags.length > 0) {
          await this.storeTags(key, tags, ttl);
        }
      } else {
        // Store in memory cache
        memoryCache.set(key, {
          value: JSON.parse(serializedValue), // Store original value
          expires: Date.now() + (ttl * 1000),
          tags
        });
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Delete specific key
  async delete(key: string): Promise<void> {
    try {
      if (redis) {
        await redis.del(key);
        // Remove from tag mappings
        await this.removeFromTags(key);
      } else {
        memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // Invalidate by tags
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      if (redis) {
        for (const tag of tags) {
          const keys = await redis.smembers(`tag:${tag}`);
          if (keys.length > 0) {
            await redis.del(...keys);
            await redis.del(`tag:${tag}`);
          }
        }
      } else {
        // Memory cache invalidation by tags
        for (const [key, cached] of memoryCache.entries()) {
          if (cached.tags.some(tag => tags.includes(tag))) {
            memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // Clear all cache
  async clear(): Promise<void> {
    try {
      if (redis) {
        await redis.flushdb();
      } else {
        memoryCache.clear();
      }
      this.hitCount = 0;
      this.missCount = 0;
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Get cache statistics
  async getStats(): Promise<CacheStats> {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? (this.hitCount / total) * 100 : 0;

    let totalKeys = 0;
    let memoryUsage = 0;

    if (redis) {
      try {
        const info = await redis.info('memory');
        const keyspace = await redis.info('keyspace');
        
        // Parse memory usage
        const memoryMatch = info.match(/used_memory:(\d+)/);
        if (memoryMatch) {
          memoryUsage = parseInt(memoryMatch[1]);
        }

        // Parse key count
        const keyMatch = keyspace.match(/keys=(\d+)/);
        if (keyMatch) {
          totalKeys = parseInt(keyMatch[1]);
        }
      } catch (error) {
        console.error('Error getting Redis stats:', error);
      }
    } else {
      totalKeys = memoryCache.size;
      // Estimate memory usage for memory cache
      memoryUsage = Array.from(memoryCache.values()).reduce((total, item) => {
        return total + JSON.stringify(item).length;
      }, 0);
    }

    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: Math.round(hitRate * 100) / 100,
      totalKeys,
      memoryUsage
    };
  }

  // Cache warming for frequently accessed data
  async warmCache(): Promise<void> {
    console.log('Starting cache warming...');
    
    try {
      // Warm user data
      const users = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, email: true, name: true, role: true }
      });
      
      for (const user of users) {
        await this.set(`user:${user.id}`, user, { 
          ttl: 7200, // 2 hours
          tags: ['users', `user:${user.id}`]
        });
      }

      // Warm system data
      const systems = await prisma.system.findMany();
      await this.set('systems:all', systems, {
        ttl: 3600, // 1 hour
        tags: ['systems']
      });

      // Warm active exercises
      const activeExercises = await prisma.exercise.findMany({
        where: { status: { in: ['PLANNING', 'ACTIVE'] } },
        include: {
          systems: {
            include: { system: true }
          }
        }
      });
      
      await this.set('exercises:active', activeExercises, {
        ttl: 1800, // 30 minutes
        tags: ['exercises', 'active_exercises']
      });

      // Warm equipment data
      const equipment = await prisma.equipment.findMany({
        where: { status: 'ACTIVE' }
      });
      
      await this.set('equipment:active', equipment, {
        ttl: 3600, // 1 hour
        tags: ['equipment']
      });

      console.log('Cache warming completed');
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }

  // Intelligent cache invalidation based on data changes
  async invalidateRelated(entityType: string, entityId: string, action: 'create' | 'update' | 'delete'): Promise<void> {
    const invalidationRules: Record<string, string[]> = {
      user: ['users', `user:${entityId}`, 'user_sessions'],
      exercise: ['exercises', `exercise:${entityId}`, 'active_exercises', 'analytics'],
      system: ['systems', `system:${entityId}`, 'exercises', 'analytics'],
      equipment: ['equipment', `equipment:${entityId}`, 'analytics'],
      costRecord: ['analytics', 'cost_records', 'exercises']
    };

    const tagsToInvalidate = invalidationRules[entityType] || [];
    
    if (tagsToInvalidate.length > 0) {
      await this.invalidateByTags(tagsToInvalidate);
      console.log(`Invalidated cache tags for ${entityType}:${entityId} - ${action}`);
    }
  }

  // Cached database query wrapper
  async cachedQuery<T>(
    key: string, 
    queryFn: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute query and cache result
    const result = await queryFn();
    await this.set(key, result, options);
    return result;
  }

  // Batch operations
  async mget(keys: string[]): Promise<(any | null)[]> {
    if (redis) {
      const values = await redis.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } else {
      return keys.map(key => {
        const cached = memoryCache.get(key);
        return (cached && cached.expires > Date.now()) ? cached.value : null;
      });
    }
  }

  async mset(entries: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<void> {
    if (redis) {
      const pipeline = redis.pipeline();
      for (const entry of entries) {
        const { key, value, options = {} } = entry;
        const { ttl = 3600 } = options;
        pipeline.setex(key, ttl, JSON.stringify(value));
      }
      await pipeline.exec();
    } else {
      for (const entry of entries) {
        await this.set(entry.key, entry.value, entry.options);
      }
    }
  }

  // Compression utilities
  private async compress(data: string): Promise<string> {
    // In a real implementation, you'd use a compression library like zlib
    // For now, we'll just return the data (placeholder)
    return Buffer.from(data).toString('base64');
  }

  private async decompress(data: string): Promise<any> {
    // Decompress and parse
    const decompressed = Buffer.from(data, 'base64').toString();
    return JSON.parse(decompressed);
  }

  // Tag management for Redis
  private async storeTags(key: string, tags: string[], ttl: number): Promise<void> {
    if (!redis) return;
    
    const pipeline = redis.pipeline();
    for (const tag of tags) {
      pipeline.sadd(`tag:${tag}`, key);
      pipeline.expire(`tag:${tag}`, ttl + 300); // Expire tags 5 minutes after content
    }
    await pipeline.exec();
  }

  private async removeFromTags(key: string): Promise<void> {
    if (!redis) return;
    
    // This would require tracking which tags a key belongs to
    // For simplicity, we'll skip this in the implementation
  }

  // Cleanup expired entries from memory cache
  private cleanupExpiredMemoryCache(): void {
    const now = Date.now();
    for (const [key, cached] of memoryCache.entries()) {
      if (cached.expires < now) {
        memoryCache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cache = new AdvancedCache();

// Decorator for caching method results
export function Cached(options: CacheOptions & { keyGenerator?: (...args: any[]) => string } = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const keyGenerator = options.keyGenerator || ((...args) => `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`);
      const cacheKey = keyGenerator(...args);
      
      return cache.cachedQuery(cacheKey, () => method.apply(this, args), options);
    };
    
    return descriptor;
  };
}

// Helper functions for common cache patterns
export const CacheHelpers = {
  // User data caching
  async getUserById(userId: string) {
    return cache.cachedQuery(
      `user:${userId}`,
      () => prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true, status: true }
      }),
      { ttl: 3600, tags: ['users', `user:${userId}`] }
    );
  },

  // Exercise data caching
  async getExerciseById(exerciseId: string) {
    return cache.cachedQuery(
      `exercise:${exerciseId}`,
      () => prisma.exercise.findUnique({
        where: { id: exerciseId },
        include: {
          systems: {
            include: { system: true }
          }
        }
      }),
      { ttl: 1800, tags: ['exercises', `exercise:${exerciseId}`] }
    );
  },

  // System data caching
  async getAllSystems() {
    return cache.cachedQuery(
      'systems:all',
      () => prisma.system.findMany(),
      { ttl: 3600, tags: ['systems'] }
    );
  },

  // Analytics data caching (shorter TTL due to frequent updates)
  async getAnalyticsData(period: string) {
    return cache.cachedQuery(
      `analytics:${period}`,
      async () => {
        // Complex analytics query would go here
        const exercises = await prisma.exercise.count();
        const systems = await prisma.system.count();
        const totalCost = await prisma.costRecord.aggregate({
          _sum: { amount: true }
        });
        
        return {
          totalExercises: exercises,
          totalSystems: systems,
          totalCost: totalCost._sum.amount || 0
        };
      },
      { ttl: 300, tags: ['analytics'] } // 5 minutes
    );
  }
};

// Auto-invalidation middleware
export function withCacheInvalidation(entityType: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);
      
      // Determine the entity ID from the result or args
      const entityId = result?.id || args[0]?.id || args[0];
      
      if (entityId) {
        await cache.invalidateRelated(entityType, entityId, 'update');
      }
      
      return result;
    };
    
    return descriptor;
  };
} 