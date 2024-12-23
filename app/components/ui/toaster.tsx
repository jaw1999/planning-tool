'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/app/components/ui/toast';
import { useToast } from '@/app/components/ui/use-toast';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export function Toaster() {
  const { toasts } = useToast();

  const getIcon = (variant?: "success" | "error" | "warning" | "info") => {
    switch (variant) {
      case "error":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
  };

  const getColors = (variant?: "success" | "error" | "warning" | "info") => {
    switch (variant) {
      case "error":
        return 'bg-red-50 border-red-100';
      case "warning":
        return 'bg-yellow-50 border-yellow-100';
      case "info":
        return 'bg-blue-50 border-blue-100';
      default:
        return 'bg-green-50 border-green-100';
    }
  };

  return (
    <ToastProvider>
      <div className="fixed top-0 right-0 flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 z-50 space-y-4">
        {toasts.map(({ id, title, description, action, variant, ...props }) => (
          <Toast key={id} {...props} className={`w-[800px] bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 ${getColors(variant)} border`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getIcon(variant)}
                </div>
                <div className="ml-3 flex-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && <ToastDescription>{description}</ToastDescription>}
                  {action}
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <ToastClose />
            </div>
          </Toast>
        ))}
      </div>
      <ToastViewport />
    </ToastProvider>
  );
} 