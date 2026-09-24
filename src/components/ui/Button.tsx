'use client';

import React, { CSSProperties, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  readonly children?: ReactNode;
  readonly onClick?: () => void;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly disabled?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly fullWidth?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
}

const VARIANT_STYLES: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    color: '#ffffff',
    border: '1px solid #f87171',
    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
  },
  secondary: {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
    color: '#f1f5f9',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  },
  danger: {
    background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
    color: '#fee2e2',
    border: '1px solid #f87171',
    boxShadow: '0 4px 16px rgba(185, 28, 28, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
  },
  warning: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    color: '#ffffff',
    border: '1px solid #fcd34d',
    boxShadow: '0 4px 16px rgba(217, 119, 6, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
  },
  outline: {
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(10, 14, 23, 0.75) 100%)',
    color: '#f1f5f9',
    border: '1px solid rgba(148, 163, 184, 0.35)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
  },
};

const SIZE_STYLES: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: '12px' },
  md: { padding: '8px 16px', fontSize: '14px' },
  lg: { padding: '12px 24px', fontSize: '16px' },
};

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  fullWidth = false,
  className = '',
  style = {},
}) => {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 150ms ease-in-out',
    width: fullWidth ? '100%' : 'auto',
    ...VARIANT_STYLES[variant],
    ...SIZE_STYLES[size],
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={baseStyle}
    >
      {children}
    </button>
  );
};
