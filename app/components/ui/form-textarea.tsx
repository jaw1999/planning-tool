'use client';

import { forwardRef } from 'react';
import { Textarea, TextareaProps } from './textarea';

interface FormTextareaProps extends Omit<TextareaProps, 'value'> {
  value?: Record<string, any> | string;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ value, ...props }, ref) => {
    // Convert Record<string, any> to string if needed
    const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;

    return <Textarea {...props} value={stringValue || ''} ref={ref} />;
  }
);

FormTextarea.displayName = 'FormTextarea';

export { FormTextarea }; 