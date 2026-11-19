import React from 'react';

export type BadgeVariant = 'amber' | 'green' | 'red' | 'stone' | 'blue';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  amber: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary-muted)]/30',
  green: 'bg-[var(--color-success-light)] text-[var(--color-success)] border-[var(--color-success)]/20',
  red: 'bg-[var(--color-danger-light)] text-[var(--color-danger)] border-[var(--color-danger)]/20',
  stone: 'bg-[var(--color-border-muted)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
  blue: 'bg-[var(--color-info-light)] text-[var(--color-info)] border-[var(--color-info)]/20',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'amber',
  size = 'md',
  children,
  className = '',
}) => {
  const sizeStyle = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${variantStyles[variant]} ${sizeStyle} ${className}`}
    >
      {children}
    </span>
  );
};
