import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/app/services/database/prisma';

export async function GET() {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token');

    if (!token?.value) {
      return NextResponse.json({ user: null }, { headers: corsHeaders });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        token.value,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { userId: string };
    } catch (error) {
      const response = NextResponse.json(
        { user: null },
        { status: 401, headers: corsHeaders }
      );
      response.cookies.delete('auth-token');
      return response;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      const response = NextResponse.json(
        { user: null },
        { status: 401, headers: corsHeaders }
      );
      response.cookies.delete('auth-token');
      return response;
    }

    return NextResponse.json({ user }, { headers: corsHeaders });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { user: null },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
} 