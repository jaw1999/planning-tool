import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import axios from 'axios';

const prisma = new PrismaClient();

export interface WebhookEvent {
  type: string;
  data: any;
  timestamp: string;
  source: 'planning-tool';
}

export interface WebhookPayload {
  event: WebhookEvent;
  delivery_id: string;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

export async function triggerWebhooks(eventType: string, eventData: any) {
  try {
    // Find all active webhooks that subscribe to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        active: true,
        events: {
          has: eventType
        }
      }
    });

    if (webhooks.length === 0) {
      console.log(`No active webhooks found for event: ${eventType}`);
      return;
    }

    console.log(`Triggering ${webhooks.length} webhooks for event: ${eventType}`);

    // Process webhooks in parallel
    const promises = webhooks.map(webhook => 
      deliverWebhook(webhook, eventType, eventData)
    );

    await Promise.allSettled(promises);

  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}

async function deliverWebhook(webhook: any, eventType: string, eventData: any) {
  const deliveryId = crypto.randomUUID();
  
  const payload: WebhookPayload = {
    event: {
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
      source: 'planning-tool'
    },
    delivery_id: deliveryId
  };

  let attempt = 0;
  let success = false;
  let lastError: any = null;

  while (attempt < MAX_RETRY_ATTEMPTS && !success) {
    try {
      await sendWebhookRequest(webhook, payload, deliveryId);
      success = true;
      
      // Update success count
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          successCount: { increment: 1 },
          lastTriggered: new Date()
        }
      });

      console.log(`Webhook delivered successfully: ${webhook.url} (attempt ${attempt + 1})`);

    } catch (error) {
      lastError = error;
      attempt++;
      
      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.log(`Webhook delivery failed, retrying in ${RETRY_DELAYS[attempt - 1]}ms: ${webhook.url}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
      }
    }
  }

  if (!success) {
    // Update failure count
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        failureCount: { increment: 1 },
        lastTriggered: new Date()
      }
    });

    console.error(`Webhook delivery failed after ${MAX_RETRY_ATTEMPTS} attempts: ${webhook.url}`, lastError);
    
    // Log webhook delivery failure
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        eventType,
        payload: JSON.stringify(payload),
        success: false,
        attempts: attempt,
        error: lastError?.message || 'Unknown error',
        deliveryId
      }
    });
  } else {
    // Log successful delivery
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        eventType,
        payload: JSON.stringify(payload),
        success: true,
        attempts: attempt + 1,
        deliveryId
      }
    });
  }
}

async function sendWebhookRequest(webhook: any, payload: WebhookPayload, deliveryId: string) {
  const signature = generateSignature(JSON.stringify(payload), webhook.secret);
  
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Military-Planning-Tool-Webhook/1.0',
    'X-Webhook-Signature-256': `sha256=${signature}`,
    'X-Webhook-Delivery': deliveryId,
    'X-Webhook-Event': payload.event.type,
    'X-Webhook-Timestamp': payload.event.timestamp
  };

  const response = await axios.post(webhook.url, payload, {
    headers,
    timeout: 30000, // 30 second timeout
    validateStatus: (status) => status >= 200 && status < 300
  });

  return response;
}

function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateSignature(payload, secret);
  
  // Use crypto.timingSafeEqual to prevent timing attacks
  const sigBuffer = Buffer.from(signature.replace('sha256=', ''), 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  
  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

// Event trigger functions for different entities
export async function triggerExerciseEvent(action: 'created' | 'updated' | 'deleted', exercise: any) {
  await triggerWebhooks(`exercise.${action}`, {
    id: exercise.id,
    name: exercise.name,
    status: exercise.status,
    startDate: exercise.startDate,
    endDate: exercise.endDate,
    location: exercise.location,
    totalBudget: exercise.totalBudget,
    systemsCount: exercise.systems?.length || 0,
    timestamp: new Date().toISOString()
  });
}

export async function triggerSystemEvent(action: 'created' | 'updated', system: any) {
  await triggerWebhooks(`system.${action}`, {
    id: system.id,
    name: system.name,
    description: system.description,
    basePrice: system.basePrice,
    hasLicensing: system.hasLicensing,
    leadTime: system.leadTime,
    timestamp: new Date().toISOString()
  });
}

export async function triggerEquipmentEvent(action: 'created' | 'updated', equipment: any) {
  await triggerWebhooks(`equipment.${action}`, {
    id: equipment.id,
    name: equipment.productInfo?.name,
    type: equipment.productInfo?.type,
    status: equipment.status,
    acquisitionCost: equipment.acquisitionCost,
    location: equipment.location,
    timestamp: new Date().toISOString()
  });
}

export async function triggerCostEvent(costRecord: any) {
  await triggerWebhooks('cost.recorded', {
    id: costRecord.id,
    exerciseId: costRecord.exerciseId,
    systemId: costRecord.systemId,
    type: costRecord.type,
    amount: costRecord.amount,
    date: costRecord.date,
    description: costRecord.description,
    timestamp: new Date().toISOString()
  });
}

export async function triggerUserEvent(action: 'login' | 'created', user: any) {
  await triggerWebhooks(`user.${action}`, {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    timestamp: new Date().toISOString()
  });
} 