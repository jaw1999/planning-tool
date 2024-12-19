import { NextResponse } from 'next/server';
import prisma from '@/app/services/database/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { performance } from 'perf_hooks';

const execAsync = promisify(exec);

interface DatabaseSizeResult {
  size: string;
  bytes: number;
}

async function getDatabaseSize() {
  try {
    const result = await prisma.$queryRaw<DatabaseSizeResult[]>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size,
             pg_database_size(current_database())::float8 as bytes
    `;
    return result[0];
  } catch (error) {
    console.error('Failed to get database size:', error);
    return { size: 'Unknown', bytes: 0 };
  }
}

async function getLastBackupTime() {
  try {
    return null;
  } catch (error) {
    console.error('Failed to get last backup time:', error);
    return null;
  }
}

function getUptime(): string {
  const uptimeSeconds = process.uptime();
  const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
  const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days} days`);
  if (hours > 0) parts.push(`${hours} hours`);
  if (minutes > 0) parts.push(`${minutes} minutes`);

  return parts.join(', ') || '< 1 minute';
}

async function getDatabaseStatus() {
  try {
    const result = await prisma.$queryRaw`
      SELECT current_timestamp, current_database(), version()
    `;
    return 'connected';
  } catch (error) {
    console.error('Database connection error:', error);
    return error instanceof Error ? error.message : 'disconnected';
  }
}

// Store previous CPU measurements
let previousCPUInfo = {
  idle: 0,
  total: 0,
  timestamp: Date.now()
};

// Track API calls
let apiMetrics = {
  calls: [] as { timestamp: number; duration: number }[],
  lastMinuteCalls: 0,
  avgResponseTime: 0
};

function getCPUUsage() {
  const cpus = os.cpus();
  const idle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const total = cpus.reduce((acc, cpu) => 
    acc + Object.values(cpu.times).reduce((a, b) => a + b, 0), 0);
  
  const diffIdle = idle - previousCPUInfo.idle;
  const diffTotal = total - previousCPUInfo.total;
  const diffTime = Date.now() - previousCPUInfo.timestamp;
  
  if (diffTime > 100) {
    previousCPUInfo = { idle, total, timestamp: Date.now() };
  }
  
  return diffTotal === 0 ? 0 : 100 * (1 - diffIdle / diffTotal);
}

function updateApiMetrics() {
  const now = Date.now();
  const callDuration = Math.random() * 50 + 20; // Simulate 20-70ms response time
  
  apiMetrics.calls = apiMetrics.calls
    .filter(call => now - call.timestamp < 60000) // Keep last minute
    .concat({ timestamp: now, duration: callDuration });
    
  apiMetrics.lastMinuteCalls = apiMetrics.calls.length;
  apiMetrics.avgResponseTime = apiMetrics.calls.reduce((acc, call) => acc + call.duration, 0) / apiMetrics.calls.length;
  
  return apiMetrics;
}

export async function GET() {
  try {
    const [userCount, systemCount, dbSize] = await Promise.all([
      prisma.user.count(),
      prisma.system.count(),
      getDatabaseSize(),
    ]);

    const cpuUsage = getCPUUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;
    const api = updateApiMetrics();

    return NextResponse.json({
      totalUsers: userCount,
      totalSystems: systemCount,
      databaseSize: dbSize.size,
      databaseSizeBytes: Number(dbSize.bytes),
      uptime: process.uptime().toFixed(0),
      status: 'connected',
      systemMetrics: {
        cpu: {
          usage: cpuUsage.toFixed(2),
          cores: os.cpus().length,
          load: os.loadavg()[0].toFixed(2)
        },
        memory: {
          total: totalMem,
          free: freeMem,
          usage: memoryUsage.toFixed(2)
        },
        api: {
          requestsPerMinute: api.lastMinuteCalls,
          avgResponseTime: api.avgResponseTime.toFixed(2),
          activeConnections: Math.min(api.lastMinuteCalls, 10)
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database statistics' },
      { status: 500 }
    );
  }
} 