import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';
import { ExerciseStatus, FSRType } from '@prisma/client';
import { Exercise, ExerciseSystem } from '@/app/lib/types/system';
import { mkdir } from 'fs/promises';

interface SystemEquipment {
  id: string;
  systemId: string;
  equipmentId: string;
}

interface ConsumablePreset {
  preset: {
    consumable: {
      id: string;
      name: string;
      currentUnitCost: number;
    };
  };
}

async function checkDatabaseConnection() {
  try {
    await prisma.user.findFirst();
    return {
      name: 'Database Connection',
      status: 'success',
      message: 'Connection established successfully'
    };
  } catch (error) {
    console.error('Database connection error:', error);
    return {
      name: 'Database Connection',
      status: 'error',
      message: 'Failed to connect to database',
      recommendation: 'Check database credentials and network connectivity'
    };
  }
}

async function checkDataIntegrity() {
  try {
    // Core data checks
    const users = await prisma.user.count();
    const systems = await prisma.system.count();
    const exercises = await prisma.exercise.count();
    const equipment = await prisma.equipment.count();
    const consumables = await prisma.consumable.count();

    const issues: string[] = [];

    // Check exercise systems relationships
    const exerciseSystems = await prisma.exerciseSystem.findMany({
      include: {
        exercise: true,
        system: true,
        consumablePresets: {
          include: {
            preset: {
              include: {
                consumable: true
              }
            }
          }
        }
      }
    });

    // Check for orphaned exercise systems
    const orphanedSystems = exerciseSystems.filter(es => !es.exercise || !es.system);
    if (orphanedSystems.length > 0) {
      issues.push(`Found ${orphanedSystems.length} exercise systems with missing relationships`);
    }

    // Check consumable presets
    const consumablePresets = await prisma.consumablePreset.findMany({
      include: {
        consumable: true,
        exerciseUses: true
      }
    });

    const orphanedPresets = consumablePresets.filter(cp => !cp.consumable);
    if (orphanedPresets.length > 0) {
      issues.push(`Found ${orphanedPresets.length} consumable presets with missing consumables`);
    }

    // Check equipment documents
    const equipmentDocs = await prisma.equipmentDocument.count();
    const systemDocs = await prisma.systemDocument.count();

    // Check for API logs (system health)
    const recentLogs = await prisma.apiLog.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    return {
      name: 'Data Integrity',
      status: issues.length > 0 ? 'warning' : 'success',
      message: `Database contains: ${users} users, ${systems} systems, ${exercises} exercises, ${equipment} equipment, ${consumables} consumables, ${equipmentDocs + systemDocs} documents, ${recentLogs} recent API logs`,
      recommendation: issues.length > 0 ? issues.join('\n') : undefined
    };
  } catch (error) {
    console.error('Data integrity check error:', error);
    return {
      name: 'Data Integrity',
      status: 'error',
      message: 'Failed to check data integrity',
      recommendation: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function checkStorageSpace() {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedPercent = ((totalMem - freeMem) / totalMem) * 100;

    let status = 'success';
    let recommendation;

    if (usedPercent > 85) {
      status = 'error';
      recommendation = 'Critical: Free up storage space immediately';
    } else if (usedPercent > 75) {
      status = 'warning';
      recommendation = 'Consider freeing up storage space';
    }

    const formatBytes = (bytes: number) => {
      const gb = bytes / (1024 * 1024 * 1024);
      return `${gb.toFixed(2)} GB`;
    };

    return {
      name: 'Storage Space',
      status,
      message: `Using ${usedPercent.toFixed(1)}% of available storage (${formatBytes(totalMem - freeMem)} of ${formatBytes(totalMem)})`,
      recommendation
    };
  } catch (error) {
    return {
      name: 'Storage Space',
      status: 'warning',
      message: 'Unable to check storage space',
      recommendation: 'Storage space check not available on this platform'
    };
  }
}

async function checkBackupStatus() {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    
    await mkdir(backupDir, { recursive: true });
    
    const files = await fs.readdir(backupDir).catch(() => []);
    
    if (files.length === 0) {
      return {
        name: 'Backup Status',
        status: 'warning',
        message: 'No backups found',
        recommendation: 'Create an initial backup of your database'
      };
    }

    const backupFiles = files.filter(f => f.endsWith('.sql') || f.endsWith('.dump'));
    
    if (backupFiles.length === 0) {
      return {
        name: 'Backup Status',
        status: 'warning',
        message: 'No valid backup files found',
        recommendation: 'Create a new backup'
      };
    }

    const latestBackup = backupFiles.sort().pop();
    const stats = await fs.stat(path.join(backupDir, latestBackup!));
    const daysSinceLastBackup = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

    let status = 'success';
    let recommendation;

    if (daysSinceLastBackup > 7) {
      status = 'warning';
      recommendation = 'Create a new backup - last backup is over a week old';
    }

    return {
      name: 'Backup Status',
      status,
      message: `Last backup: ${stats.mtime.toLocaleDateString()}`,
      recommendation
    };
  } catch (error) {
    return {
      name: 'Backup Status',
      status: 'warning',
      message: 'Unable to check backup status',
      recommendation: 'Backup directory may not be accessible'
    };
  }
}

export async function POST() {
  try {
    console.log('Starting health checks...');
    const checks = await Promise.all([
      checkDatabaseConnection().catch((err: Error) => {
        console.error('Database connection check failed:', err);
        return {
          name: 'Database Connection',
          status: 'error' as const,
          message: 'Connection failed',
          recommendation: err.message
        };
      }),
      checkDataIntegrity().catch((err: Error) => {
        console.error('Data integrity check failed:', err);
        return {
          name: 'Data Integrity',
          status: 'error' as const,
          message: 'Check failed',
          recommendation: err.message
        };
      }),
      checkStorageSpace().catch((err: Error) => {
        console.error('Storage space check failed:', err);
        return {
          name: 'Storage Space',
          status: 'error' as const,
          message: 'Check failed',
          recommendation: err.message
        };
      }),
      checkBackupStatus().catch((err: Error) => {
        console.error('Backup status check failed:', err);
        return {
          name: 'Backup Status',
          status: 'error' as const,
          message: 'Check failed',
          recommendation: err.message
        };
      })
    ]);

    console.log('Health check results:', checks);
    return NextResponse.json({ checks });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        error: 'Health check failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST(); // Reuse the POST handler for GET requests
} 