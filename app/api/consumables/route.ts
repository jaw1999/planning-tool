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

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const consumable = await prisma.consumable.create({
      data: {
        name: data.name,
        description: data.description,
        unit: data.unit,
        currentUnitCost: data.currentUnitCost,
        category: data.category,
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(consumable);
  } catch (error) {
    console.error('Error creating consumable:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 