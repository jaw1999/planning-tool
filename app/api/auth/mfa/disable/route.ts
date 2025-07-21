import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/app/lib/utils/auth';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';
import { z } from 'zod';

const prisma = new PrismaClient();

const disableSchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
  password: z.string().min(1, 'Password is required')
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = disableSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;
    const userId = authResult.payload.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        password: true,
        mfaSecret: true,
        mfaEnabled: true,
        mfaBackupCodes: true
      }
    });

    if (!user || !user.mfaEnabled) {
      return NextResponse.json({ error: 'MFA not enabled' }, { status: 400 });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 });
    }

    // Verify MFA token or backup code
    let isValidToken = false;

    if (user.mfaBackupCodes.includes(token.toUpperCase())) {
      isValidToken = true;
    } else if (user.mfaSecret) {
      isValidToken = authenticator.verify({
        token,
        secret: user.mfaSecret
      });
    }

    if (!isValidToken) {
      return NextResponse.json({ error: 'Invalid MFA token' }, { status: 400 });
    }

    // Disable MFA
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: []
      }
    });

    return NextResponse.json({
      success: true,
      message: 'MFA disabled successfully'
    });

  } catch (error) {
    console.error('MFA disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable MFA' },
      { status: 500 }
    );
  }
} 