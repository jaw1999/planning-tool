import { NextResponse } from 'next/server';
import prisma from '@/app/services/database/prisma';
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

    // Parse the file contents
    const { systemName, rawData } = await parseFile(fileBuffer, fileType as string);

    // Create or update the system in the database
    const system = await prisma.system.upsert({
      where: { id: systemName },
      update: { 
        name: systemName,
        ...rawData 
      },
      create: {
        name: systemName,
        ...rawData
      }
    });

    // Store the original document
    const documentUrl = await uploadDocument(file, system.id, systemName);

    // Link the document to the system
    await prisma.document.create({
      data: {
        systemId: system.id,
        name: file.name,
        type: fileType as string,
        url: documentUrl,
        uploadedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, systemId: system.id });
  } catch (error) {
    console.error('Import processing failed:', error);
    return NextResponse.json(
      { error: 'Failed to process import' },
      { status: 500 }
    );
  }
} 