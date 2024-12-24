import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    // Create a new reset token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await prisma.passwordReset.create({
      data: {
        token,
        userId,
        expiresAt,
        used: false
      }
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Create reset token error:', error);
    return NextResponse.json(
      { error: 'Failed to create reset token' },
      { status: 500 }
    );
  }
} 