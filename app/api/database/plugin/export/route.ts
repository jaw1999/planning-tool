import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

async function getAllTableData() {
  const data: { [key: string]: any[] } = {};
  
  // Explicitly list all models and their corresponding prisma queries
  const queries = {
    users: prisma.user.findMany(),
    systems: prisma.system.findMany(),
    equipment: prisma.equipment.findMany(),
    consumables: prisma.consumable.findMany(),
    systemDocuments: prisma.systemDocument.findMany(),
    apiLogs: prisma.apiLog.findMany()
  };

  // Execute all queries in parallel
  const results = await Promise.all(
    Object.entries(queries).map(async ([table, query]) => {
      try {
        const records = await query;
        return { table, records };
      } catch (error) {
        console.error(`Failed to fetch ${table}:`, error);
        return { table, records: [] };
      }
    })
  );

  // Populate data object with results
  results.forEach(({ table, records }) => {
    data[table] = records;
  });

  return data;
}

export async function GET() {
  try {
    const data = await getAllTableData();
    const tables = Object.keys(data);

    const plugin = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      metadata: {
        totalUsers: await prisma.user.count(),
        totalSystems: await prisma.system.count(),
        size: await getDatabaseSize(),
        tables
      },
      data
    };

    return new NextResponse(JSON.stringify(plugin), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename=database-plugin-${new Date().toISOString()}.dbplugin`
      }
    });
  } catch (error) {
    console.error('Failed to export database plugin:', error);
    return NextResponse.json(
      { error: 'Failed to export database plugin' },
      { status: 500 }
    );
  }
} 