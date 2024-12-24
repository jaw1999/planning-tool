import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Ensure backup directory exists
const ensureBackupDir = async () => {
  const backupDir = path.join(process.cwd(), 'backups');
  await mkdir(backupDir, { recursive: true });
  return backupDir;
};

export async function POST() {
  try {
    const backupDir = await ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const backupPath = path.join(backupDir, filename);

    // Get database connection info from environment variables
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    // Parse connection string
    const url = new URL(dbUrl);
    const dbName = url.pathname.slice(1);
    const host = url.hostname;
    const port = url.port;
    const user = url.username;
    const password = url.password;

    // Build pg_dump command with explicit connection parameters
    const command = `pg_dump -h ${host} -p ${port} -U ${user} -F c -f "${backupPath}" ${dbName}`;

    // Set environment variable for password
    const env = { ...process.env, PGPASSWORD: password };

    await execAsync(command, { env });

    return NextResponse.json({ 
      success: true, 
      filename 
    });
  } catch (error) {
    console.error('Backup failed:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
} 