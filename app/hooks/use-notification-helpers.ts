'use client';

import { useNotifications } from "@/app/lib/contexts/notifications-context";

export function useNotificationHelpers() {
  const { addNotification } = useNotifications();

  const notifySuccess = (title: string, message: string) => {
    addNotification({ type: 'success', title, message });
  };

  const notifyError = (title: string, message: string) => {
    addNotification({ type: 'error', title, message });
  };

  return { notifySuccess, notifyError };
} 