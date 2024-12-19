import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Role, UserStatus } from '@prisma/client';

export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(permissions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const permission = await prisma.permission.create({
      data: {
        name: body.name,
        description: body.description,
        roles: body.roles,
      },
    });
    return NextResponse.json(permission);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    );
  }
} 