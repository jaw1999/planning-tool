import { NextResponse } from 'next/server';
import { parseFile } from '@/app/lib/utils/file-parser';

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

    const { systemName, extractedFields, missingFields, rawData } = await parseFile(
      fileBuffer,
      fileType as string
    );

    return NextResponse.json({
      systemName,
      fileType,
      extractedFields,
      missingFields,
      rawData
    });
  } catch (error) {
    console.error('Preview generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
} 