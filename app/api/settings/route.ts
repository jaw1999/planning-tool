import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst({
      where: { id: 1 }
    });

    if (!settings) {
      const defaultSettings = await prisma.settings.create({
        data: {
          id: 1,
          siteName: 'Planning Tool',
          defaultCurrency: 'USD',
          notifications: true,
          autoSave: true,
          timezone: 'UTC',
          dateFormat: 'DD/MM/YYYY',
          language: 'en'
        }
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        ...data
      }
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 