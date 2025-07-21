import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: params.id },
    });
    
    if (!equipment) {
      return NextResponse.json(
        { error: 'Equipment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(equipment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const equipment = await prisma.equipment.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(equipment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update equipment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.equipment.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete equipment' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const equipment = await prisma.equipment.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(equipment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update equipment' },
      { status: 500 }
    );
  }
} 