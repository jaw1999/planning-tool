import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const plugin = await request.json();

    // Validate plugin format
    if (!plugin.version || !plugin.data || !plugin.metadata) {
      throw new Error('Invalid plugin format');
    }

    // Begin transaction
    await prisma.$transaction(async (tx) => {
      // Clear existing data
      for (const table of plugin.metadata.tables) {
        await (tx as any)[table].deleteMany();
      }

      // Insert new data
      for (const [table, records] of Object.entries(plugin.data)) {
        if (Array.isArray(records)) {
          for (const record of records) {
            await (tx as any)[table].create({
              data: record
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to install database plugin:', error);
    return NextResponse.json(
      { error: 'Failed to install database plugin' },
      { status: 500 }
    );
  }
} 