import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading data...' }) => (
  <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
    <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
    <p className="text-sm font-medium">{message}</p>
  </div>
);
