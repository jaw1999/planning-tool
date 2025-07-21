import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/app/lib/utils/auth';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { z } from 'zod';

const prisma = new PrismaClient();

const webhookConfigSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  events: z.array(z.enum([
    'exercise.created',
    'exercise.updated',
    'exercise.deleted',
    'system.created',
    'system.updated',
    'equipment.created',
    'equipment.updated',
    'cost.recorded',
    'user.login',
    'user.created'
  ])),
  secret: z.string().min(16, 'Secret must be at least 16 characters'),
  active: z.boolean().default(true),
  description: z.string().optional()
});

// GET - List all webhooks
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can manage webhooks
    const user = await prisma.user.findUnique({
      where: { id: authResult.payload.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const webhooks = await prisma.webhook.findMany({
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        description: true,
        createdAt: true,
        lastTriggered: true,
        successCount: true,
        failureCount: true
      }
    });

    return NextResponse.json({ webhooks });

  } catch (error) {
    console.error('Webhook list error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve webhooks' },
      { status: 500 }
    );
  }
}

// POST - Create new webhook
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create webhooks
    const user = await prisma.user.findUnique({
      where: { id: authResult.payload.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = webhookConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { url, events, secret, active, description } = validation.data;

    // Check if webhook URL already exists
    const existingWebhook = await prisma.webhook.findFirst({
      where: { url }
    });

    if (existingWebhook) {
      return NextResponse.json(
        { error: 'Webhook URL already exists' },
        { status: 400 }
      );
    }

    // Hash the secret for storage
    const hashedSecret = crypto.createHash('sha256').update(secret).digest('hex');

    const webhook = await prisma.webhook.create({
      data: {
        url,
        events,
        secret: hashedSecret,
        active,
        description,
        createdBy: authResult.payload.userId
      },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        description: true,
        createdAt: true
      }
    });

    return NextResponse.json({ webhook }, { status: 201 });

  } catch (error) {
    console.error('Webhook creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

// PUT - Update webhook
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update webhooks
    const user = await prisma.user.findUnique({
      where: { id: authResult.payload.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 });
    }

    const validation = webhookConfigSchema.partial().safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id }
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const updatedData: any = { ...validation.data };
    
    // Hash secret if provided
    if (updatedData.secret) {
      updatedData.secret = crypto.createHash('sha256').update(updatedData.secret).digest('hex');
    }

    const updatedWebhook = await prisma.webhook.update({
      where: { id },
      data: updatedData,
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        description: true,
        createdAt: true,
        lastTriggered: true,
        successCount: true,
        failureCount: true
      }
    });

    return NextResponse.json({ webhook: updatedWebhook });

  } catch (error) {
    console.error('Webhook update error:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

// DELETE - Remove webhook
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete webhooks
    const user = await prisma.user.findUnique({
      where: { id: authResult.payload.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 });
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id }
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    await prisma.webhook.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Webhook deleted successfully' });

  } catch (error) {
    console.error('Webhook deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
} 