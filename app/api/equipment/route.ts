import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { Equipment } from '@/app/lib/types/equipment';
import { Prisma } from '@prisma/client';

// Temporarily disable CORS for testing
export async function POST(req: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const equipmentData = await req.json();
    
    if (!equipmentData.productInfo?.name) {
      return NextResponse.json(
        { error: 'Equipment name is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await db.equipment.create({
      data: equipmentData
    });

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('Failed to create equipment:', error);
    return NextResponse.json(
      { error: 'Failed to create equipment' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
  try {
    const equipment = await db.equipment.findMany();
    
    // Transform the data to match our Equipment type with proper type assertions
    const transformedEquipment = equipment.map(item => {
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
      };

      return transformed as Equipment;
    });

    return NextResponse.json(transformedEquipment);
  } catch (error) {
    console.error('Failed to fetch equipment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    );
  }
} 