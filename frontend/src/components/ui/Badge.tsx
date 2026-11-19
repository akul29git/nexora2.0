import { type HTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'ok' | 'stale' | 'fallback' | 'error' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-surface-100 text-surface-700',
    ok: 'bg-green-50 text-green-700',
    stale: 'bg-amber-50 text-amber-700',
    fallback: 'bg-surface-100 text-surface-700',
    error: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'relative flex h-1.5 w-1.5 rounded-full',
            variant === 'ok' && 'bg-green-500',
            variant === 'stale' && 'bg-amber-500',
            variant === 'fallback' && 'bg-surface-400',
            variant === 'error' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'default' && 'bg-surface-400'
          )}
        />
      )}
      {children}
    </span>
  );
}