'use client';

import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  children,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-[20px] border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 transition-colors duration-200 ${className}`}
    >
      <div className="w-14 h-14 rounded-[8px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mb-4 shadow-sm btn-spring">
        <Icon className="w-7 h-7 text-zinc-500 dark:text-zinc-400" />
      </div>

      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5 tracking-tight">
        {title}
      </h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-65ch mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}

      {children}
    </div>
  );
};
