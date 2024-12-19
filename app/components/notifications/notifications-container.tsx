'use client';

import React from 'react';
import { NotificationToast } from './notification-toast';
import { useNotifications } from '@/app/lib/contexts/notifications-context';

export function NotificationsContainer() {
  const { notifications, removeNotification } = useNotifications();

  // Only show the last 3 unread notifications as toasts
  const toastNotifications = notifications
    .filter(n => !n.read)
    .slice(0, 3);

  return (
    <div
      aria-live="assertive"
      className="fixed top-0 right-0 flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 z-50 space-y-4"
    >
      {toastNotifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
          action={notification.action}
        />
      ))}
    </div>
  );
}