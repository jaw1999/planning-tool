import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const SystemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  hasLicensing: z.boolean(),
  licensePrice: z.number().optional(),
  leadTime: z.number().int().positive(),
  specifications: z.record(z.any()).optional(),
  consumablesRate: z.number().optional()
});

export async function GET() {
  try {
    const systems = await prisma.system.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(systems);
  } catch (error) {
    console.error('Failed to fetch systems:', error);
    return NextResponse.json(
      { error: 'Failed to fetch systems' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validatedData = SystemSchema.parse(json);
    
    const system = await prisma.system.create({
      data: validatedData
    });
    
    return NextResponse.json(system, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to create system:', error);
    return NextResponse.json(
      { error: 'Failed to create system' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const json = await request.json();
    const { id, ...data } = json;
    
    if (!id) {
      return NextResponse.json(
        { error: 'System ID is required' },
        { status: 400 }
      );
    }
    
    const validatedData = SystemSchema.partial().parse(data);
    
    const system = await prisma.system.update({
      where: { id },
      data: validatedData
    });
    
    return NextResponse.json(system);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to update system:', error);
    return NextResponse.json(
      { error: 'Failed to update system' },
      { status: 500 }
    );
  }
}