import { NextResponse } from 'next/server';
import prisma from '@/app/services/database/prisma';
import { z } from 'zod';

const ExerciseSystemSchema = z.object({
  systemId: z.string(),
  quantity: z.number(),
  fsrSupport: z.enum(['NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  fsrCost: z.number().optional(),
  consumablesCost: z.number().default(0),
  consumablePresets: z.array(z.object({
    presetId: z.string(),
    quantity: z.number()
  })).optional()
});

const ExerciseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  location: z.string().optional(),
  status: z.enum(['PLANNING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  systems: z.array(ExerciseSystemSchema)
});

export async function GET() {
  try {
    const exercises = await prisma.exercise.findMany({
      include: {
        systems: {
          include: {
            system: true,
            consumablePresets: {
              include: {
                preset: {
                  include: {
                    consumable: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });
    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validatedData = ExerciseSchema.parse(json);
    
    const exercise = await prisma.exercise.create({
      data: {
        ...validatedData,
        systems: {
          create: validatedData.systems.map(system => ({
            systemId: system.systemId,
            quantity: system.quantity,
            fsrSupport: system.fsrSupport,
            fsrCost: system.fsrCost || 0,
            consumablesCost: system.consumablesCost,
            system: { connect: { id: system.systemId } },
            consumablePresets: {
              create: system.consumablePresets?.map(preset => ({
                presetId: preset.presetId,
                quantity: preset.quantity,
                preset: { connect: { id: preset.presetId } }
              })) || []
            }
          }))
        }
      },
      include: {
        systems: {
          include: {
            system: true,
            consumablePresets: {
              include: {
                preset: {
                  include: {
                    consumable: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to create exercise:', error);
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    );
  }
}