import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Simple query to check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 