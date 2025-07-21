import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { emailSchema } from '@/app/lib/utils/validation';
import { z } from 'zod';

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  mfaToken: z.string().optional()
});

// Rate limiting map (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(email);
  
  if (!attempt) return false;
  
  // Reset after 15 minutes
  if (now - attempt.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.delete(email);
    return false;
  }
  
  return attempt.count >= 5;
}

function recordFailedAttempt(email: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(email);
  
  if (!attempt || now - attempt.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
  } else {
    loginAttempts.set(email, { count: attempt.count + 1, lastAttempt: now });
  }
}

function clearFailedAttempts(email: string): void {
  loginAttempts.delete(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const { email, password, mfaToken } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limiting
    if (isRateLimited(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    console.log('Login attempt for:', normalizedEmail);

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        status: true,
        mfaEnabled: true,
        mfaSecret: true,
        mfaBackupCodes: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('Database query result:', user ? 'User found' : 'User not found');

    if (!user) {
      console.log('User not found:', normalizedEmail);
      recordFailedAttempt(normalizedEmail);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is not active. Please contact an administrator.' },
        { status: 403 }
      );
    }

    console.log('Comparing passwords for user:', normalizedEmail);
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isValid ? 'Valid' : 'Invalid');

    if (!isValid) {
      console.log('Invalid password for:', normalizedEmail);
      recordFailedAttempt(normalizedEmail);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      // If no MFA token provided, request it
      if (!mfaToken) {
        return NextResponse.json({
          requiresMFA: true,
          message: 'MFA token required'
        }, { status: 200 });
      }

      // Verify MFA token
      const { authenticator } = require('otplib');
      let isValidMFA = false;

      // Check backup codes first
      if (user.mfaBackupCodes.includes(mfaToken.toUpperCase())) {
        isValidMFA = true;
        // Remove used backup code
        const updatedBackupCodes = user.mfaBackupCodes.filter(
          code => code !== mfaToken.toUpperCase()
        );
        await prisma.user.update({
          where: { id: user.id },
          data: { mfaBackupCodes: updatedBackupCodes }
        });
      } else if (user.mfaSecret) {
        // Verify TOTP token
        isValidMFA = authenticator.verify({
          token: mfaToken,
          secret: user.mfaSecret
        });
      }

      if (!isValidMFA) {
        recordFailedAttempt(normalizedEmail);
        return NextResponse.json(
          { error: 'Invalid MFA token' },
          { status: 401 }
        );
      }
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(normalizedEmail);

    // Create token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const { password: _, ...userWithoutPassword } = user;

    // Create response
    const response = NextResponse.json(
      { success: true, user: userWithoutPassword },
      { status: 200 }
    );

    // Set cookie without maxAge - makes it a session cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
      // No maxAge property - cookie will expire when browser closes
    });

    console.log('Login successful for:', normalizedEmail);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 