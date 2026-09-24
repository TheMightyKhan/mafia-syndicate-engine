'use client';

import React, { CSSProperties, ReactNode } from 'react';

export type BadgeTone = 'red' | 'blue' | 'amber' | 'emerald' | 'purple' | 'neutral' | 'zinc';

export interface BadgeProps {
  readonly children?: ReactNode;
  readonly tone?: BadgeTone;
  readonly style?: CSSProperties;
  readonly className?: string;
  readonly icon?: ReactNode;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  red: 'bg-red-500/10 text-red-700 border-red-500/25 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30',
  blue: 'bg-blue-500/10 text-blue-700 border-blue-500/25 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30',
  amber: 'bg-amber-500/10 text-amber-700 border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  purple: 'bg-purple-500/10 text-purple-700 border-purple-500/25 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
  neutral: 'bg-zinc-500/10 text-zinc-700 border-zinc-500/25 dark:bg-zinc-500/15 dark:text-zinc-300 dark:border-zinc-700',
  zinc: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  tone = 'neutral',
  style,
  className = '',
  icon,
}) => {
  return (
    <span
      style={style}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border transition-colors duration-200 ${TONE_CLASSES[tone]} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
