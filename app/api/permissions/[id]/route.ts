import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma, Role, UserStatus } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const permission = await prisma.permission.update({
      where: {
        id: params.id,
      },
      data: {
        name: body.name,
        description: body.description,
        roles: body.roles,
      },
    });
    return NextResponse.json(permission);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.permission.delete({
      where: {
        id: params.id,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    );
  }
} 