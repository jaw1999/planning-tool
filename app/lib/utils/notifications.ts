import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { triggerWebhooks } from './webhooks';

const prisma = new PrismaClient();

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  channels: NotificationChannel[];
  scheduledFor?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export type NotificationType = 
  | 'exercise_created'
  | 'exercise_updated' 
  | 'exercise_deleted'
  | 'exercise_status_changed'
  | 'system_added'
  | 'system_removed'
  | 'cost_threshold_exceeded'
  | 'user_assigned'
  | 'user_removed'
  | 'deadline_approaching'
  | 'maintenance_required'
  | 'security_alert'
  | 'system_update'
  | 'backup_completed'
  | 'backup_failed';

export type NotificationChannel = 'web' | 'email' | 'push' | 'sms' | 'webhook';

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  messageTemplate: string;
  defaultChannels: NotificationChannel[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserNotificationPreferences {
  userId: string;
  channels: Record<NotificationChannel, boolean>;
  types: Record<NotificationType, boolean>;
  quietHours?: {
    start: string; // HH:MM
    end: string; // HH:MM
    timezone: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export class NotificationService {
  private io: SocketIOServer | null = null;
  private templates: Map<NotificationType, NotificationTemplate> = new Map();
  private userPreferences: Map<string, UserNotificationPreferences> = new Map();
  private scheduledNotifications: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeTemplates();
    this.loadUserPreferences();
  }

  // Initialize Socket.IO server
  initializeSocketIO(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Authentication
      socket.on('authenticate', async (token: string) => {
        try {
          // Verify JWT token and get user info
          const user = await this.verifyToken(token);
          if (user) {
            socket.join(`user:${user.id}`);
            socket.data.userId = user.id;
            
            // Send unread notifications
            await this.sendUnreadNotifications(user.id, socket);
          }
        } catch (error) {
          socket.emit('auth_error', 'Invalid token');
        }
      });

      // Mark notification as read
      socket.on('mark_read', async (notificationId: string) => {
        try {
          await this.markAsRead(notificationId);
          socket.emit('notification_read', { id: notificationId });
        } catch (error) {
          socket.emit('error', 'Failed to mark notification as read');
        }
      });

      // Get notification history
      socket.on('get_notifications', async (params: { limit?: number; offset?: number }) => {
        if (socket.data.userId) {
          const notifications = await this.getUserNotifications(
            socket.data.userId,
            params.limit || 20,
            params.offset || 0
          );
          socket.emit('notifications_history', notifications);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Create and send notification
  async createNotification(
    userId: string | string[],
    type: NotificationType,
    data: Record<string, any> = {},
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      channels?: NotificationChannel[];
      scheduledFor?: Date;
      expiresAt?: Date;
    } = {}
  ): Promise<void> {
    const userIds = Array.isArray(userId) ? userId : [userId];
    const template = this.templates.get(type);
    
    if (!template) {
      throw new Error(`No template found for notification type: ${type}`);
    }

    for (const uid of userIds) {
      const userPrefs = await this.getUserPreferences(uid);
      
      // Check if user wants this type of notification
      if (!userPrefs.types[type]) {
        continue;
      }

      // Generate notification content
      const title = this.interpolateTemplate(template.title, data);
      const message = this.interpolateTemplate(template.messageTemplate, data);
      
      // Determine channels based on user preferences and options
      const channels = options.channels || template.defaultChannels;
      const enabledChannels = channels.filter(channel => userPrefs.channels[channel]);

      // Create notification record
      const notification: Notification = {
        id: crypto.randomUUID(),
        userId: uid,
        type,
        title,
        message,
        data,
        priority: options.priority || template.priority,
        read: false,
        channels: enabledChannels,
        scheduledFor: options.scheduledFor,
        expiresAt: options.expiresAt,
        createdAt: new Date()
      };

      // Store in database
      await prisma.notification.create({
        data: {
          id: notification.id,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data ? JSON.stringify(notification.data) : null,
          priority: notification.priority,
          read: notification.read,
          channels: notification.channels,
          scheduledFor: notification.scheduledFor,
          expiresAt: notification.expiresAt
        }
      });

      // Send notification
      if (options.scheduledFor) {
        await this.scheduleNotification(notification);
      } else {
        await this.sendNotification(notification);
      }
    }
  }

  // Send notification through various channels
  private async sendNotification(notification: Notification): Promise<void> {
    const userPrefs = await this.getUserPreferences(notification.userId);
    
    // Check quiet hours
    if (this.isQuietHours(userPrefs)) {
      // Defer non-critical notifications
      if (notification.priority !== 'critical') {
        await this.deferNotification(notification);
        return;
      }
    }

    // Send through enabled channels
    for (const channel of notification.channels) {
      try {
        switch (channel) {
          case 'web':
            await this.sendWebNotification(notification);
            break;
          case 'email':
            await this.sendEmailNotification(notification);
            break;
          case 'push':
            await this.sendPushNotification(notification);
            break;
          case 'sms':
            await this.sendSMSNotification(notification);
            break;
          case 'webhook':
            await this.sendWebhookNotification(notification);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }

    // Track notification delivery
    await this.trackDelivery(notification);
  }

  // Send real-time web notification
  private async sendWebNotification(notification: Notification): Promise<void> {
    if (this.io) {
      this.io.to(`user:${notification.userId}`).emit('notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        createdAt: notification.createdAt
      });
    }
  }

  // Send email notification
  private async sendEmailNotification(notification: Notification): Promise<void> {
    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { email: true, name: true }
    });

    if (!user) return;

    // In a real implementation, integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`Sending email to ${user.email}: ${notification.title}`);
    
    // Example: Send through email service
    // await emailService.send({
    //   to: user.email,
    //   subject: notification.title,
    //   html: this.generateEmailHTML(notification, user),
    //   priority: notification.priority
    // });
  }

  // Send push notification
  private async sendPushNotification(notification: Notification): Promise<void> {
    // Get user's push subscription
    const pushSubscription = await prisma.pushSubscription.findFirst({
      where: { userId: notification.userId, active: true }
    });

    if (!pushSubscription) return;

    // In a real implementation, use web push library
    console.log(`Sending push notification: ${notification.title}`);
    
    // Example: Send through push service
    // await webpush.sendNotification(
    //   JSON.parse(pushSubscription.subscription),
    //   JSON.stringify({
    //     title: notification.title,
    //     body: notification.message,
    //     icon: '/icons/notification-icon.png',
    //     badge: '/icons/badge-icon.png',
    //     data: notification.data
    //   })
    // );
  }

  // Send SMS notification
  private async sendSMSNotification(notification: Notification): Promise<void> {
    // Get user phone number
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { phone: true }
    });

    if (!user?.phone) return;

    // In a real implementation, integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`Sending SMS to ${user.phone}: ${notification.title}`);
    
    // Example: Send through SMS service
    // await smsService.send({
    //   to: user.phone,
    //   message: `${notification.title}\n${notification.message}`,
    //   priority: notification.priority
    // });
  }

  // Send webhook notification
  private async sendWebhookNotification(notification: Notification): Promise<void> {
    await triggerWebhooks('notification.created', {
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        userId: notification.userId
      }
    });
  }

  // Schedule notification for later delivery
  private async scheduleNotification(notification: Notification): Promise<void> {
    if (!notification.scheduledFor) return;

    const delay = notification.scheduledFor.getTime() - Date.now();
    
    if (delay > 0) {
      const timeout = setTimeout(async () => {
        await this.sendNotification(notification);
        this.scheduledNotifications.delete(notification.id);
      }, delay);

      this.scheduledNotifications.set(notification.id, timeout);
    } else {
      // Schedule time has passed, send immediately
      await this.sendNotification(notification);
    }
  }

  // Defer notification to end of quiet hours
  private async deferNotification(notification: Notification): Promise<void> {
    const userPrefs = await this.getUserPreferences(notification.userId);
    
    if (userPrefs.quietHours) {
      const now = new Date();
      const endTime = this.parseTime(userPrefs.quietHours.end);
      const scheduledFor = new Date(now);
      scheduledFor.setHours(endTime.hours, endTime.minutes, 0, 0);
      
      // If end time is tomorrow
      if (scheduledFor <= now) {
        scheduledFor.setDate(scheduledFor.getDate() + 1);
      }

      notification.scheduledFor = scheduledFor;
      await this.scheduleNotification(notification);
    }
  }

  // Get user notification preferences
  private async getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
    let preferences = this.userPreferences.get(userId);
    
    if (!preferences) {
      // Load from database or use defaults
      const dbPrefs = await prisma.userNotificationPreferences.findUnique({
        where: { userId }
      });

      preferences = dbPrefs ? {
        userId,
        channels: JSON.parse(dbPrefs.channels),
        types: JSON.parse(dbPrefs.types),
        quietHours: dbPrefs.quietHours ? JSON.parse(dbPrefs.quietHours) : undefined,
        frequency: dbPrefs.frequency as any
      } : this.getDefaultPreferences(userId);

      this.userPreferences.set(userId, preferences);
    }

    return preferences;
  }

  // Default notification preferences
  private getDefaultPreferences(userId: string): UserNotificationPreferences {
    return {
      userId,
      channels: {
        web: true,
        email: true,
        push: false,
        sms: false,
        webhook: false
      },
      types: Object.fromEntries(
        Array.from(this.templates.keys()).map(type => [type, true])
      ) as Record<NotificationType, boolean>,
      frequency: 'immediate'
    };
  }

  // Initialize notification templates
  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        type: 'exercise_created',
        title: 'New Exercise Created',
        messageTemplate: 'Exercise "{{exerciseName}}" has been created and assigned to you.',
        defaultChannels: ['web', 'email'],
        priority: 'medium'
      },
      {
        type: 'exercise_status_changed',
        title: 'Exercise Status Updated',
        messageTemplate: 'Exercise "{{exerciseName}}" status changed from {{oldStatus}} to {{newStatus}}.',
        defaultChannels: ['web', 'email'],
        priority: 'medium'
      },
      {
        type: 'cost_threshold_exceeded',
        title: 'Budget Alert',
        messageTemplate: 'Exercise "{{exerciseName}}" has exceeded {{percentage}}% of its budget ({{currentCost}}/{{budgetLimit}}).',
        defaultChannels: ['web', 'email', 'push'],
        priority: 'high'
      },
      {
        type: 'deadline_approaching',
        title: 'Deadline Approaching',
        messageTemplate: 'Exercise "{{exerciseName}}" is due in {{daysRemaining}} days ({{dueDate}}).',
        defaultChannels: ['web', 'email'],
        priority: 'medium'
      },
      {
        type: 'security_alert',
        title: 'Security Alert',
        messageTemplate: 'Security event detected: {{alertType}}. {{description}}',
        defaultChannels: ['web', 'email', 'push', 'sms'],
        priority: 'critical'
      },
      {
        type: 'system_update',
        title: 'System Update',
        messageTemplate: 'System update available: {{updateVersion}}. {{description}}',
        defaultChannels: ['web', 'email'],
        priority: 'low'
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.type, template);
    });
  }

  // Load user preferences from database
  private async loadUserPreferences(): Promise<void> {
    try {
      const preferences = await prisma.userNotificationPreferences.findMany();
      
      preferences.forEach(pref => {
        this.userPreferences.set(pref.userId, {
          userId: pref.userId,
          channels: JSON.parse(pref.channels),
          types: JSON.parse(pref.types),
          quietHours: pref.quietHours ? JSON.parse(pref.quietHours) : undefined,
          frequency: pref.frequency as any
        });
      });
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  }

  // Utility methods
  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  private isQuietHours(preferences: UserNotificationPreferences): boolean {
    if (!preferences.quietHours) return false;

    const now = new Date();
    const start = this.parseTime(preferences.quietHours.start);
    const end = this.parseTime(preferences.quietHours.end);
    const current = { hours: now.getHours(), minutes: now.getMinutes() };

    // Convert to minutes for easier comparison
    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;
    const currentMinutes = current.hours * 60 + current.minutes;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Quiet hours span midnight
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  private parseTime(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  private async verifyToken(token: string): Promise<{ id: string } | null> {
    // Implement JWT verification
    // This is a placeholder - use your actual auth verification
    try {
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // return decoded as { id: string };
      return { id: 'user-id' }; // Placeholder
    } catch {
      return null;
    }
  }

  private async sendUnreadNotifications(userId: string, socket: any): Promise<void> {
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        userId,
        read: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    if (unreadNotifications.length > 0) {
      socket.emit('unread_notifications', unreadNotifications);
    }
  }

  private async markAsRead(notificationId: string): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });
  }

  private async getUserNotifications(userId: string, limit: number, offset: number) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  private async trackDelivery(notification: Notification): Promise<void> {
    await prisma.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        channels: notification.channels,
        deliveredAt: new Date(),
        success: true
      }
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Helper functions for common notification scenarios
export const NotificationHelpers = {
  // Exercise-related notifications
  async notifyExerciseCreated(exerciseId: string, assignedUserIds: string[]) {
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId }
    });

    if (exercise) {
      await notificationService.createNotification(
        assignedUserIds,
        'exercise_created',
        { 
          exerciseName: exercise.name,
          exerciseId: exercise.id
        }
      );
    }
  },

  async notifyBudgetThreshold(exerciseId: string, currentCost: number, budgetLimit: number) {
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        assignedUsers: true
      }
    });

    if (exercise) {
      const percentage = Math.round((currentCost / budgetLimit) * 100);
      const userIds = exercise.assignedUsers?.map(u => u.userId) || [];

      await notificationService.createNotification(
        userIds,
        'cost_threshold_exceeded',
        {
          exerciseName: exercise.name,
          currentCost: currentCost.toLocaleString(),
          budgetLimit: budgetLimit.toLocaleString(),
          percentage
        },
        { priority: 'high' }
      );
    }
  },

  async notifyDeadlineApproaching(exerciseId: string, daysRemaining: number) {
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        assignedUsers: true
      }
    });

    if (exercise) {
      const userIds = exercise.assignedUsers?.map(u => u.userId) || [];
      
      await notificationService.createNotification(
        userIds,
        'deadline_approaching',
        {
          exerciseName: exercise.name,
          daysRemaining,
          dueDate: exercise.endDate?.toLocaleDateString()
        }
      );
    }
  }
}; 