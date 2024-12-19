// app/components/ui/notification/notification.tsx
'use client';

import { cva, type VariantProps } from 'class-variance-authority';

const notificationVariants = cva(
  "fixed top-4 right-4 p-4 rounded-lg shadow-lg max-w-sm z-50 transition-all duration-300 transform",
  {
    variants: {
      type: {
        success: "bg-green-100 text-green-800 border border-green-200",
        error: "bg-red-100 text-red-800 border border-red-200",
        warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        info: "bg-blue-100 text-blue-800 border border-blue-200",
      }
    },
    defaultVariants: {
      type: "info"
    }
  }
);

interface NotificationProps extends VariantProps<typeof notificationVariants> {
  title: string;
  message: string;
  onClose?: () => void;
}

export function Notification({ title, message, type, onClose }: NotificationProps) {
  return (
    <div className={notificationVariants({ type })}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium mb-1">{title}</h3>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-current opacity-70 hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}