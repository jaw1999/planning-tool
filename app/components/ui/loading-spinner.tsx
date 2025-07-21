'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const variantClasses = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  white: 'text-white',
};

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary', 
  className, 
  text 
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-2">
        <svg
          className={cn(
            'animate-spin',
            sizeClasses[size],
            variantClasses[variant]
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {text && (
          <p className={cn('text-sm', variantClasses[variant])}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

export function LoadingCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-32 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        {children && (
          <div className="mt-3 text-gray-600">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export function LoadingButton({ 
  isLoading, 
  children, 
  ...props 
}: { 
  isLoading: boolean; 
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <button 
      {...props}
      disabled={isLoading || props.disabled}
      className={cn(
        'relative',
        props.className
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" variant="white" />
        </div>
      )}
      <div className={cn(isLoading && 'opacity-0')}>
        {children}
      </div>
    </button>
  );
} 