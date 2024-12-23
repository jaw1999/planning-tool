import { NextResponse } from 'next/server';
import prisma from "@/app/lib/prisma";
import { parseFile } from '@/app/lib/utils/file-parser';
import { uploadDocument } from '@/app/lib/utils/storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const fileType = file.name.split('.').pop()?.toLowerCase();

    const { systemName, rawData } = await parseFile(fileBuffer, fileType as string);

    // Create or update the system with required fields
    const system = await prisma.system.upsert({
      where: { id: systemName },
      update: { 
        name: systemName,
        ...rawData 
      },
      create: {
        id: systemName,
        name: systemName,
        basePrice: 0,
        leadTime: 30,
        description: '',
        specifications: {},
        ...rawData
      }
    });

    // Store the original document
    const documentUrl = await uploadDocument(file, system.id, systemName);

    // Create document record using the schema fields
    await prisma.systemDocument.create({
      data: {
        title: file.name,
        type: fileType as string,
        url: documentUrl,
        system: { connect: { id: system.id } },
        createdAt: new Date()
      }
    });

    return NextResponse.json(system, { status: 201 });
  } catch (error) {
    console.error('Import processing failed:', error);
    return NextResponse.json(
      { error: 'Failed to process import' },
      { status: 500 }
    );
  }
} 