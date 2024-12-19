import React from 'react';
import { Card, CardContent } from '../ui/card';

interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subValue?: string;
  color?: 'green' | 'red' | 'blue' | 'default';
}

export function StatusCard({ icon, title, value, subValue, color = 'default' }: StatusCardProps) {
  const colorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    default: 'text-gray-900'
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="text-gray-500">{icon}</div>
          <div className={`text-2xl font-semibold ${colorClasses[color]}`}>
            {value}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">{title}</div>
        {subValue && (
          <div className="mt-1 text-xs text-gray-500">{subValue}</div>
        )}
      </CardContent>
    </Card>
  );
} 