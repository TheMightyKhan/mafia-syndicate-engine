'use client';

import React, { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'purple' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children?: ReactNode;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly fullWidth?: boolean;
  readonly icon?: ReactNode;
  readonly iconRight?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm border border-red-500/30 hover:border-red-600 focus-visible:ring-red-500',
  secondary:
    'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 dark:text-zinc-100 dark:border-zinc-700 shadow-sm focus-visible:ring-zinc-400',
  danger:
    'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm border border-rose-500/30 focus-visible:ring-rose-500',
  warning:
    'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-sm border border-amber-500/30 focus-visible:ring-amber-500',
  purple:
    'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-sm border border-purple-500/30 hover:border-purple-600 focus-visible:ring-purple-500',
  outline:
    'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 focus-visible:ring-zinc-400',
  ghost:
    'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-transparent focus-visible:ring-zinc-400',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-md gap-1.5 h-8',
  md: 'px-4 py-2 text-sm font-semibold rounded-lg gap-2 h-10',
  lg: 'px-6 py-3 text-base font-bold rounded-xl gap-2.5 h-12',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  fullWidth = false,
  icon,
  iconRight,
  className = '',
  style,
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={`inline-flex items-center justify-center font-medium btn-spring cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none tap-target ${
        VARIANT_CLASSES[variant]
      } ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon && <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>}
      {children && <span>{children}</span>}
      {iconRight && <span className="inline-flex shrink-0 items-center justify-center">{iconRight}</span>}
    </button>
  );
};
