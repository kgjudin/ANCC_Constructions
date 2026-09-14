import React from 'react';
import { clsx } from 'clsx';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toLowerCase();

  let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';

  if (['active', 'approved', 'present', 'paid'].includes(normalized)) {
    colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';
  } else if (['pending', 'submitted', 'partially paid', 'half day'].includes(normalized)) {
    colorStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800';
  } else if (['inactive', 'resigned', 'rejected', 'absent', 'unpaid', 'cancelled'].includes(normalized)) {
    colorStyle = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800';
  } else if (['leave', 'holiday', 'ordered', 'received', 'in transit'].includes(normalized)) {
    colorStyle = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800';
  }

  const sizeStyle = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={clsx('inline-flex items-center font-bold rounded-full border', colorStyle, sizeStyle)}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
      {status}
    </span>
  );
};
