import { NextResponse } from 'next/server';
import prisma from '@/app/services/database/prisma';
import { convertToCSV } from '@/app/lib/utils/export-converter';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') as 'csv' | 'json';

    // Fetch all systems (without documents since they're not needed for export)
    const systems = await prisma.system.findMany();

    // Convert to requested format
    let data: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      data = convertToCSV(systems);
      contentType = 'text/csv';
      filename = `systems-export-${new Date().toISOString()}.csv`;
    } else {
      data = JSON.stringify(systems, null, 2);
      contentType = 'application/json';
      filename = `systems-export-${new Date().toISOString()}.json`;
    }

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json(
      { error: 'Failed to export systems' },
      { status: 500 }
    );
  }
} 