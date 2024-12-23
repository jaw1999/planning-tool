import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('backup') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No backup file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save the uploaded file
    const tempPath = `/tmp/restore-${Date.now()}.sql`;
    await writeFile(tempPath, buffer);
    
    // Restore the database
    await execAsync(`pg_restore -c -d your_database ${tempPath}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Restore failed:', error);
    return NextResponse.json(
      { error: 'Failed to restore database' },
      { status: 500 }
    );
  }
} 