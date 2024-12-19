import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const consumable = await prisma.consumable.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(consumable);
  } catch (error) {
    console.error('Error updating consumable:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.consumable.delete({
      where: { id: params.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting consumable:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 