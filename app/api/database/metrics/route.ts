import { NextResponse } from 'next/server';
import os from 'os';

const metrics: { timestamp: number; cpuUsage: number; memoryUsage: number; apiCalls: number; }[] = [];

function getCpuUsage(): number {
  const cpus = os.cpus();
  const totalCpu = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total) * 100;
  }, 0);
  
  return parseFloat((totalCpu / cpus.length).toFixed(2));
}

export async function GET() {
  try {
    const now = Date.now();

    // Only update metrics every 10 seconds
    if (now - global.lastMetricUpdate >= 10000) {
      const cpuUsage = getCpuUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const memoryUsage = ((totalMemory - freeMemory) / totalMemory * 100);

      // Keep last 30 minutes of metrics
      if (metrics.length > 180) {
        metrics.shift();
      }

      metrics.push({
        timestamp: now,
        cpuUsage: cpuUsage,
        memoryUsage: parseFloat(memoryUsage.toFixed(2)),
        apiCalls: global.apiCallsInLastMinute * 6 // Convert to per minute rate
      });

      global.lastMetricUpdate = now;
      global.apiCallsInLastMinute = 0;
    }

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
} 