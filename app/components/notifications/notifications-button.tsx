'use client';

import React, { useState } from 'react';

import { Bell } from 'lucide-react';
import { useNotifications } from '@/app/lib/contexts/notifications-context';
import { NotificationsPanel } from './notifications-panel';

export function NotificationsButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { notifications } = useNotifications();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <button
        onClick={() => setIsPanelOpen(true)}
        className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" />
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationsPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}