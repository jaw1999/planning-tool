import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/app/services/database/prisma';

export async function middleware(request: NextRequest) {
  const start = performance.now();
  
  const response = await NextResponse.next();
  
  const duration = performance.now() - start;
  
  // Log API call
  await prisma.apiLog.create({
    data: {
      path: request.nextUrl.pathname,
      method: request.method,
      duration: duration,
      timestamp: new Date(),
      statusCode: response.status
    }
  });

  return response;
}

export const config = {
  matcher: '/api/:path*'
}; 