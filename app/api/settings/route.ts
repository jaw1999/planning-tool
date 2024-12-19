import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const consumables = await prisma.consumable.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(consumables);
  } catch (error) {
    console.error('Error fetching consumables:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 