import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import os from 'os';

// Initialize global counters if they don't exist
if (typeof global.requestsPerMinute === 'undefined') {
  global.requestsPerMinute = 0;
  global.avgResponseTime = '0ms';
  global.activeConnections = 0;
}

// Track request start time for response time calculation
const requestStart = process.hrtime();

// Memory calculation helper function
function getMemoryDetails() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  return {
    total: totalMemory,
    free: freeMemory,
    used: usedMemory,
    usage: parseFloat(((usedMemory / totalMemory) * 100).toFixed(2)),
    details: {
      // Process specific memory
      heapTotal: process.memoryUsage().heapTotal,
      heapUsed: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external,
      // System memory
      buffers: totalMemory - freeMemory,
      available: freeMemory
    }
  };
}

export async function GET() {
  try {
    const [totalUsers, totalSystems] = await Promise.all([
      prisma.user.count(),
      prisma.system.count()
    ]);

    // Calculate response time
    const diff = process.hrtime(requestStart);
    const responseTime = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
    global.avgResponseTime = `${responseTime}ms`;
    global.requestsPerMinute++;
    global.activeConnections = global.activeConnections || 1;

    // Get CPU usage using os.loadavg() or calculate if not available
    const cpuUsage = os.loadavg()[0] || os.cpus().reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / os.cpus().length;

    const memoryStats = getMemoryDetails();

    // Get disk info using os.platform() specific methods
    let diskSize = '0';
    let diskUsed = '0';
    try {
      const platform = os.platform();
      if (platform === 'win32') {
        // Windows: Use powershell to get disk info
        const { execSync } = require('child_process');
        const disk = execSync('wmic logicaldisk get size,freespace,caption').toString();
        const diskInfo = disk.split('\n')[1].trim().split(/\s+/);
        diskSize = Math.floor(parseInt(diskInfo[1]) / (1024 * 1024 * 1024)) + ' GB';
        diskUsed = Math.floor((parseInt(diskInfo[1]) - parseInt(diskInfo[0])) / (1024 * 1024 * 1024)) + ' GB';
      }
    } catch (error) {
      console.error('Failed to get disk usage:', error);
    }

    // Update global metrics
    global.requestsPerMinute++;
    
    const stats = {
      totalUsers,
      totalSystems,
      lastBackup: null,
      databaseSize: await getDatabaseSize(),
      diskSize,
      diskUsed,
      uptime: process.uptime().toFixed(2) + 's',
      status: 'connected' as const,
      systemMetrics: {
        cpu: {
          usage: cpuUsage.toFixed(2),
          cores: os.cpus().length,
          load: os.loadavg().join(', '),
          details: os.cpus().map(cpu => ({
            model: cpu.model,
            speed: cpu.speed,
            times: cpu.times
          }))
        },
        memory: {
          usage: memoryStats.usage.toString(),
          total: memoryStats.total,
          free: memoryStats.free,
          details: memoryStats.details
        },
        api: {
          requestsPerMinute: global.requestsPerMinute,
          avgResponseTime: global.avgResponseTime,
          activeConnections: global.activeConnections
        }
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch database stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database stats' },
      { status: 500 }
    );
  }
}

async function getDatabaseSize() {
  try {
    const result = await prisma.$queryRaw<Array<{ size: string }>>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    return result[0].size;
  } catch (error) {
    console.error('Failed to get database size:', error);
    return '0 MB';
  }
} 