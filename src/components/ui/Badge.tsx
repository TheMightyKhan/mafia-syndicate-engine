import React, { CSSProperties, ReactNode } from 'react';

export type BadgeTone = 'red' | 'blue' | 'amber' | 'emerald' | 'purple' | 'neutral';

export interface BadgeProps {
  readonly children?: ReactNode;
  readonly tone?: BadgeTone;
  readonly style?: CSSProperties;
  readonly className?: string;
}

const TONE_STYLES: Record<BadgeTone, CSSProperties> = {
  red: { background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.1) 100%)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)', boxShadow: '0 0 10px rgba(239, 68, 68, 0.15)' },
  blue: { background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(29, 78, 216, 0.1) 100%)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)', boxShadow: '0 0 10px rgba(59, 130, 246, 0.15)' },
  amber: { background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(180, 83, 9, 0.1) 100%)', color: '#fde047', border: '1px solid rgba(245, 158, 11, 0.45)', boxShadow: '0 0 10px rgba(245, 158, 11, 0.15)' },
  emerald: { background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(4, 120, 87, 0.1) 100%)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.15)' },
  purple: { background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(126, 34, 206, 0.1) 100%)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.45)', boxShadow: '0 0 10px rgba(168, 85, 247, 0.15)' },
  neutral: { background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.25) 0%, rgba(30, 41, 59, 0.15) 100%)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.25)' },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  tone = 'neutral',
  style = {},
  className = '',
}) => {
  const badgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    ...TONE_STYLES[tone],
    ...style,
  };

  return (
    <span className={className} style={badgeStyle}>
      {children}
    </span>
  );
};
