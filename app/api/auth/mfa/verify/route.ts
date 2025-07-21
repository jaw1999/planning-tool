import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/app/lib/utils/auth';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';
import { z } from 'zod';

const prisma = new PrismaClient();

const verifySchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
  enable: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = verifySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { token, enable } = validation.data;
    const userId = authResult.payload.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        mfaSecret: true,
        mfaEnabled: true,
        mfaBackupCodes: true
      }
    });

    if (!user || !user.mfaSecret) {
      return NextResponse.json({ error: 'MFA not setup' }, { status: 400 });
    }

    // Check if token is a backup code
    let isValidToken = false;
    let usedBackupCode = null;

    if (user.mfaBackupCodes.includes(token.toUpperCase())) {
      isValidToken = true;
      usedBackupCode = token.toUpperCase();
    } else {
      // Verify TOTP token
      isValidToken = authenticator.verify({
        token,
        secret: user.mfaSecret
      });
    }

    if (!isValidToken) {
      return NextResponse.json({ error: 'Invalid MFA token' }, { status: 400 });
    }

    // Enable MFA if not already enabled
    if (enable && !user.mfaEnabled) {
      await prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true }
      });
    }

    // If backup code was used, remove it
    if (usedBackupCode) {
      const updatedBackupCodes = user.mfaBackupCodes.filter(
        code => code !== usedBackupCode
      );
      
      await prisma.user.update({
        where: { id: userId },
        data: { mfaBackupCodes: updatedBackupCodes }
      });
    }

    return NextResponse.json({
      success: true,
      mfaEnabled: enable ? true : user.mfaEnabled,
      backupCodeUsed: !!usedBackupCode,
      remainingBackupCodes: usedBackupCode ? 
        user.mfaBackupCodes.length - 1 : user.mfaBackupCodes.length
    });

  } catch (error) {
    console.error('MFA verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify MFA token' },
      { status: 500 }
    );
  }
} 