import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no items to display at this time.',
  actionLabel,
  onAction,
  icon
}) => (
  <div className="py-12 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
    <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 mb-3 text-slate-400">
      {icon || <FolderOpen className="w-8 h-8" />}
    </div>
    <h4 className="text-base font-semibold text-slate-800">{title}</h4>
    <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} size="sm">
        {actionLabel}
      </Button>
    )}
  </div>
);
