import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/app/lib/utils/auth';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.payload.userId;

    // Generate TOTP secret
    const secret = authenticator.generateSecret();
    
    // Get user info for QR code
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Create TOTP URL for QR code
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'Military Planning Tool',
      secret
    );

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store MFA secret (temporarily, will be confirmed later)
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret,
        mfaBackupCodes: backupCodes
      }
    });

    return NextResponse.json({
      secret,
      qrCode: qrCodeDataUrl,
      backupCodes,
      otpauthUrl
    });

  } catch (error) {
    console.error('MFA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup MFA' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.payload.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        mfaEnabled: true,
        mfaSecret: true,
        mfaBackupCodes: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      mfaEnabled: user.mfaEnabled,
      hasSecret: !!user.mfaSecret,
      backupCodesCount: user.mfaBackupCodes.length
    });

  } catch (error) {
    console.error('MFA status error:', error);
    return NextResponse.json(
      { error: 'Failed to get MFA status' },
      { status: 500 }
    );
  }
} 