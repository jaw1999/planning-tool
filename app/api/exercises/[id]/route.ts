import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const ExerciseUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  location: z.string().optional(),
  status: z.enum(['PLANNING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  systems: z.array(z.object({
    systemId: z.string(),
    quantity: z.number(),
    fsrSupport: z.enum(['NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']),
    fsrCost: z.number(),
    consumablesCost: z.number().default(0),
    consumablePresets: z.array(z.object({
      presetId: z.string(),
      quantity: z.number()
    })).optional()
  })).optional()
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First get the exercise with systems
    const exercise = await prisma.exercise.findUnique({
      where: { id: params.id },
      include: {
        systems: {
          include: {
            system: true
          }
        }
      }
    });

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Then get the consumable presets for each system
    const systemIds = exercise.systems.map(system => system.id);
    const presets = await prisma.exerciseConsumablePreset.findMany({
      where: {
        exerciseSystemId: {
          in: systemIds
        }
      },
      include: {
        preset: {
          include: {
            consumable: true
          }
        }
      }
    });

    // Combine the data
    const enrichedSystems = exercise.systems.map(system => ({
      ...system,
      consumablePresets: presets.filter(
        preset => preset.exerciseSystemId === system.id
      )
    }));

    const enrichedExercise = {
      ...exercise,
      systems: enrichedSystems
    };

    return NextResponse.json(enrichedExercise);
  } catch (error) {
    console.error('Failed to fetch exercise:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercise' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json();
    const validatedData = ExerciseUpdateSchema.parse(json);
    
    const exercise = await prisma.$transaction(async (tx) => {
      // Delete existing systems and their consumable presets
      await tx.exerciseConsumablePreset.deleteMany({
        where: {
          exerciseSystem: {
            exerciseId: params.id
          }
        }
      });

      await tx.exerciseSystem.deleteMany({
        where: { exerciseId: params.id }
      });

      // Create new exercise systems
      const updatedExercise = await tx.exercise.update({
        where: { id: params.id },
        data: {
          ...validatedData,
          systems: {
            create: validatedData.systems?.map(system => ({
              systemId: system.systemId,
              quantity: system.quantity,
              fsrSupport: system.fsrSupport,
              fsrCost: system.fsrCost || 0,
              consumablesCost: system.consumablesCost,
              system: { connect: { id: system.systemId } }
            })) || []
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

      // Create consumable presets separately
      if (validatedData.systems) {
        for (const systemData of validatedData.systems) {
          if (systemData.consumablePresets) {
            const exerciseSystem = updatedExercise.systems.find(
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
      }

      return updatedExercise;
    });

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Fetch consumable presets separately
    const presets = await prisma.exerciseConsumablePreset.findMany({
      where: {
        exerciseSystemId: {
          in: exercise.systems.map(s => s.id)
        }
      },
      include: {
        preset: {
          include: {
            consumable: true
          }
        }
      }
    });

    // Combine the data
    const enrichedExercise = {
      ...exercise,
      systems: exercise.systems.map(system => ({
        ...system,
        consumablePresets: presets.filter(
          preset => preset.exerciseSystemId === system.id
        )
      }))
    };

    return NextResponse.json(enrichedExercise);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to update exercise:', error);
    return NextResponse.json(
      { error: 'Failed to update exercise' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First delete all related exerciseSystems and their consumable presets
    await prisma.exerciseConsumablePreset.deleteMany({
      where: {
        exerciseSystem: {
          exerciseId: params.id
        }
      }
    });

    await prisma.exerciseSystem.deleteMany({
      where: { exerciseId: params.id }
    });

    // Then delete the exercise
    await prisma.exercise.delete({
      where: { id: params.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete exercise:', error);
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    );
  }
} 