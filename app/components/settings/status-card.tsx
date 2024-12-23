import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatusCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  status: 'connected' | 'disconnected' | 'error' | 'loading' | 'info';
}

export function StatusCard({ icon: Icon, title, value, status }: StatusCardProps) {
  const statusColors = {
    connected: 'text-green-500',
    disconnected: 'text-red-500',
    error: 'text-red-500',
    loading: 'text-blue-500',
    info: 'text-blue-500'
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${statusColors[status]}`} />
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
} 