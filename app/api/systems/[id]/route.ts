import { NextResponse } from 'next/server';
import prisma from '@/app/services/database/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // First delete related exercise systems
    await prisma.exerciseSystem.deleteMany({
      where: { systemId: id }
    });
    
    // Then delete the system
    await prisma.system.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete system:', error);
    return NextResponse.json(
      { error: 'Failed to delete system' },
      { status: 500 }
    );
  }
} 