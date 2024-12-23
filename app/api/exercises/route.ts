import { NextResponse } from 'next/server';
import prisma from '@/app/services/database/prisma';
import { z } from 'zod';

const ExerciseSystemSchema = z.object({
  systemId: z.string(),
  quantity: z.number(),
  fsrSupport: z.enum(['NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  fsrCost: z.number().optional(),
  launchesPerDay: z.number().optional().default(1),
  consumablePresets: z.array(z.object({
    presetId: z.string(),
    quantity: z.number()
  })).optional().default([])
});

const ExerciseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  location: z.string().optional(),
  status: z.enum(['PLANNING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  systems: z.array(ExerciseSystemSchema),
  launchesPerDay: z.number().optional().default(1)
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
    const data = await request.json();
    const validatedData = ExerciseSchema.parse(data);

    const exercise = await prisma.$transaction(async (tx) => {
      // First verify all consumables exist and create presets if needed
      for (const system of validatedData.systems) {
        if (system.consumablePresets) {
          const consumableIds = system.consumablePresets.map(p => p.presetId);
          const existingConsumables = await tx.consumable.findMany({
            where: {
              id: {
                in: consumableIds
              }
            }
          });

          if (existingConsumables.length !== consumableIds.length) {
            throw new Error('One or more consumables not found');
          }

          // Create ConsumablePresets for each consumable
          for (const consumable of existingConsumables) {
            const preset = await tx.consumablePreset.upsert({
              where: {
                id: consumable.id
              },
              create: {
                id: consumable.id,
                consumableId: consumable.id,
                name: consumable.name,
                description: consumable.description || '',
                notes: consumable.notes || '',
                quantity: 1 // Default quantity for the preset
              },
              update: {}
            });
          }
        }
      }

      // Create exercise and systems
      const createdExercise = await tx.exercise.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          startDate: new Date(validatedData.startDate),
          endDate: new Date(validatedData.endDate),
          location: validatedData.location,
          status: validatedData.status,
          launchesPerDay: validatedData.launchesPerDay || 0,
          systems: {
            create: validatedData.systems.map(system => ({
              system: { connect: { id: system.systemId } },
              quantity: system.quantity,
              fsrSupport: system.fsrSupport,
              fsrCost: system.fsrCost || 0,
              launchesPerDay: system.launchesPerDay || 0
            }))
          }
        },
        include: {
          systems: true
        }
      });

      // Create consumable presets with verified consumableIds
      for (const systemData of validatedData.systems) {
        if (systemData.consumablePresets?.length) {
          const exerciseSystem = createdExercise.systems.find(
            s => s.systemId === systemData.systemId
          );
          if (exerciseSystem) {
            await tx.exerciseConsumablePreset.createMany({
              data: systemData.consumablePresets.map(preset => ({
                exerciseSystemId: exerciseSystem.id,
                presetId: preset.presetId,
                quantity: preset.quantity
              }))
            });
          }
        }
      }

      return await tx.exercise.findUnique({
        where: { id: createdExercise.id },
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
    });

    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Failed to create exercise:', error);
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    );
  }
}