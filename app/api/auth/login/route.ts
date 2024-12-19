import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/app/services/database/prisma';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    console.log('Login attempt for:', normalizedEmail);
    console.log('Searching for user with email:', normalizedEmail);

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      }
    });

    console.log('Database query result:', user ? 'User found' : 'User not found');

    if (!user) {
      console.log('User not found:', normalizedEmail);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('Comparing passwords for user:', normalizedEmail);
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isValid ? 'Valid' : 'Invalid');

    if (!isValid) {
      console.log('Invalid password for:', normalizedEmail);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

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