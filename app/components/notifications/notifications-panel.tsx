'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle, XCircle, AlertTriangle, Info, Trash2, Check } from 'lucide-react';
import { useNotifications } from '@/app/lib/contexts/notifications-context';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  } = useNotifications();

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex sm:pl-16">
        <div className="w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl">
            <div className="flex-1 h-0 overflow-y-auto">
              <div className="py-6 px-4 bg-blue-700 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white">Notifications</h2>
                  <div className="flex items-center space-x-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="bg-blue-600 p-1 rounded-full text-white hover:bg-blue-500"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={clearAll}
                      className="bg-blue-600 p-1 rounded-full text-white hover:bg-blue-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Bell className="w-12 h-12 text-gray-400" />
                    <p className="mt-4 text-gray-500">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {icons[notification.type]}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {notification.message}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                              </p>
                            </div>
                            <div className="ml-4 flex-shrink-0 flex">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-blue-600 hover:text-blue-500"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => removeNotification(notification.id)}
                                className="ml-2 text-gray-400 hover:text-gray-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {notification.action && (
                            <div className="mt-3">
                              <button
                                onClick={notification.action.onClick}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                              >
                                {notification.action.label}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}