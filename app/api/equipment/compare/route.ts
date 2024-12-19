import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { Equipment } from '@/app/lib/types/equipment';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids')?.split(',');

  if (!ids) {
    return NextResponse.json({ error: 'No equipment IDs provided' }, { status: 400 });
  }

  try {
    const equipment = await Promise.all(
      ids.map(async (id) => {
        const item = await prisma.equipment.findUnique({
          where: { id }
        });

        if (!item) return null;

        const transformed: Partial<Equipment> = {
          id: item.id,
          productInfo: item.productInfo as unknown as Equipment['productInfo'],
          physicalSpecifications: item.physicalSpecifications as unknown as Equipment['physicalSpecifications'],
          systemComponents: item.systemComponents as unknown as Equipment['systemComponents'],
          interfaces: item.interfaces as unknown as Equipment['interfaces'],
          powerSpecifications: item.powerSpecifications as unknown as Equipment['powerSpecifications'],
          environmentalSpecifications: item.environmentalSpecifications as unknown as Equipment['environmentalSpecifications'],
          software: item.software as unknown as Equipment['software'],
          operations: item.operations as unknown as Equipment['operations'],
          logistics: item.logistics as unknown as Equipment['logistics'],
          integration: item.integration as unknown as Equipment['integration'],
          acquisitionCost: item.acquisitionCost ?? undefined,
          fsrSupportCost: item.fsrSupportCost ?? undefined,
          location: item.location ?? undefined,
          serialNumber: item.serialNumber ?? undefined,
          assetTag: item.assetTag ?? undefined,
          notes: item.notes ?? undefined,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          status: item.status as Equipment['status'],
          fsrFrequency: item.fsrFrequency as Equipment['fsrFrequency'],
        };

        return transformed;
      })
    );

    return NextResponse.json(equipment.filter(Boolean));
  } catch (error) {
    console.error('Failed to fetch equipment comparison:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment comparison' },
      { status: 500 }
    );
  }
} 