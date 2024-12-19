// app/components/ui/notification/provider.tsx
'use client';

import { createContext, useContext, useState } from 'react';
import { Notification } from './notification';

interface NotificationContextType {
  showNotification: (props: { title: string; message: string; type?: 'success' | 'error' | 'info' }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
  } | null>(null);

  const showNotification = ({ title, message, type = 'info' }: {
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
  }) => {
    setNotification({ title, message, type, id: Date.now() });
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Notification
          key={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}