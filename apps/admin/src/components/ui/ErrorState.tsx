import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Failed to load data from server.',
  onRetry
}) => (
  <div className="py-12 flex flex-col items-center justify-center text-center p-6 bg-red-50/50 rounded-xl border border-red-100">
    <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
    <h4 className="text-base font-semibold text-red-900">{title}</h4>
    <p className="text-xs text-red-600 max-w-sm mt-1 mb-4">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline" size="sm">
        Try Again
      </Button>
    )}
  </div>
);
